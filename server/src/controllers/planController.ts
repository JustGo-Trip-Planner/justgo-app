import { Request, Response } from "express";
import axios from "axios";
import PlanModel from "../models/planModel";
import { Plan } from "../types/response";
import config from "../config";
import { AuthRequest } from "../middlewares/auth";

const normalizeHotelStars = (value: any) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num < 0) return 0;
  if (num > 5) return 5;
  return num;
};

const calculateTotalPlaces = (dailyItinerary: any[] = []) => {
  return (dailyItinerary || []).reduce((sum: number, day: any) => {
    const activities = Array.isArray(day?.activities) ? day.activities : [];
    return sum + activities.length;
  }, 0);
};

const calculatePrimaryHotelStars = (hotels: any[] = []) => {
  const firstHotel = Array.isArray(hotels) ? hotels[0] : null;
  return normalizeHotelStars(firstHotel?.stars);
};

const normalizePlanBeforeSave = (raw: any) => {
  const recommended_hotels = Array.isArray(raw?.recommended_hotels)
    ? raw.recommended_hotels.slice(0, 1).map((hotel: any) => ({
        ...hotel,
        stars: normalizeHotelStars(hotel?.stars),
      }))
    : [];

  const daily_itinerary = Array.isArray(raw?.daily_itinerary)
    ? raw.daily_itinerary.map((day: any) => ({
        ...day,
        activities: Array.isArray(day?.activities) ? day.activities : [],
      }))
    : [];

  return {
    ...raw,
    recommended_hotels,
    daily_itinerary,
    total_places: calculateTotalPlaces(daily_itinerary),
    hotel_stars: calculatePrimaryHotelStars(recommended_hotels),
  };
};

// ส่ง request ไป FastAPI เพื่อ generate plans preview
export async function generatePlans(req: Request, res: Response) {
  try {
    const {
      province_id,
      province_name,
      start_date,
      end_date,
      group_type,
      friend_count,
      family,
      interests,
      activities,
      budget_type,
      budget_amount,
      plan_name,
      num_plans,
    } = req.body;

    const safeNumPlans = Math.max(1, Math.min(3, Number(num_plans || 1)));

    const payload = {
      province: province_name || province_id,
      start_date,
      end_date,
      group_type,
      friend_count,
      family,
      interests,
      activities,
      budget_type,
      budget_amount,
      plan_name,
      num_plans: safeNumPlans,
    };

    console.log("generatePlans payload:", payload);

    const response = await axios.post<{ plans: Plan[] }>(
      `${config.RAG_URL}/api/plan/generate`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 190000,
        responseType: "json",
      }
    );

    const result = response.data;
    const plans = Array.isArray(result?.plans) ? result.plans : [];

    return res.status(200).json({ plans });
  } catch (err: any) {
    console.error("Error in generatePlans:", err?.response?.data || err.message || err);
    return res.status(500).json({
      error: "Failed to preview plans",
      message: err?.response?.data?.detail || err.message,
    });
  }
}

export async function startGeneratePlans(req: Request, res: Response) {
  try {
    const {
      province_id,
      province_name,
      start_date,
      end_date,
      group_type,
      friend_count,
      family,
      interests,
      activities,
      budget_type,
      budget_amount,
      plan_name,
      num_plans,
    } = req.body;

    const safeNumPlans = Math.max(1, Math.min(3, Number(num_plans || 1)));

    const payload = {
      province: province_name || province_id,
      start_date,
      end_date,
      group_type,
      friend_count,
      family,
      interests,
      activities,
      budget_type,
      budget_amount,
      plan_name,
      num_plans: safeNumPlans,
    };

    const response = await axios.post(
      `${config.RAG_URL}/api/plan/generate/start`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    return res.status(200).json(response.data);
  } catch (err: any) {
    return res.status(500).json({
      error: "Failed to start generate plans",
      message: err?.response?.data?.detail || err.message,
    });
  }
}

export async function getGeneratePlansStatus(req: Request, res: Response) {
  try {
    const { jobId } = req.params;

    const response = await axios.get(
      `${config.RAG_URL}/api/plan/generate/status/${jobId}`,
      { timeout: 30000 }
    );

    return res.status(200).json(response.data);
  } catch (err: any) {
    return res.status(500).json({
      error: "Failed to get generate status",
      message: err?.response?.data?.detail || err.message,
    });
  }
}

// บันทึกแผนที่เลือกลง database
export async function savePlan(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const fullPlan = normalizePlanBeforeSave(req.body);

    const newPlan = new PlanModel({
      ...fullPlan,
      user: req.userId,
    });

    const saved = await newPlan.save();
    return res.status(201).json(saved);
  } catch (err: any) {
    console.error("Error in savePlan:", err.message || err);
    return res.status(500).json({ error: "Failed to save plan" });
  }
}

// ดึงแผนที่บันทึกไว้ทั้งหมดของ user ตัวเอง
export async function getSavedPlans(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const plans = await PlanModel.find({ user: req.userId }).sort({ createdAt: -1 });
    return res.json(plans);
  } catch (err: any) {
    console.error("Error in getSavedPlans:", err.message || err);
    return res.status(500).json({ error: "Failed to load saved plans" });
  }
}

// (Optional) ดึงแผนที่บันทึกแล้วตาม id
export async function getSavedPlanById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const plan = await PlanModel.findById(id).populate("user", "first_name avatar").exec();
    
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    return res.json(plan);
  } catch (err: any) {
    console.error("Error in getSavedPlanById:", err.message || err);
    return res.status(500).json({ error: "Failed to load plan" });
  }
}

// GET: get submitted plans in group
export const getMyPlans = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    
    const status = String(req.query.status || "").trim();
    
    const filter: any = { user: req.userId };
    
    if (status && ["draft", "submitted", "finalized", "completed"].includes(status)) {
      filter.planStatus = status;
    }
    
    const plans = await PlanModel.find(filter).sort({ createdAt: -1 });
    return res.json(plans);
  } catch (error) {
    return res.status(500).json({ message: "Load my plans failed", error });
  }
};

// PUT: Update plan by ID
export const updatePlanById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updatedData = normalizePlanBeforeSave(req.body);

    const updatedPlan = await PlanModel.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({ success: true, data: updatedPlan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed", error });
  }
};

// DELETE: /api/plan/:id
export const deletePlanById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const plan = await PlanModel.findOneAndDelete({
      _id: id,
      user: req.userId
    });

    if (!plan) return res.status(404).json({ message: "Plan not found" });

    return res.json({ success: true, message: "Plan deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Delete plan failed" });
  }
};

export const getCurrentPlans = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    await autoArchivePlans(req.userId);

    const plans = await PlanModel.find({
      user: req.userId,
      isArchived: false
    }).sort({ start_date: 1 });

    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: "Load current plans failed", err });
  }
};

export const getHistoryPlans = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    
    await autoArchivePlans(req.userId);
    
    const plans = await PlanModel.find({
      user: req.userId,
      isArchived: true
    }).sort({ end_date: -1 });

    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: "Load history plans failed", err });
  }
};

export const reusePlan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { start_date, end_date } = req.body;

    if (!start_date || !end_date) return res.status(400).json({ message: "Invalid date range" });

    const start = new Date(start_date);
    const end = new Date(end_date);

    const today = new Date();
    if (start < today) return res.status(400).json({ message: "Cannot select past date" });

    const plan = await PlanModel.findById(id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const { _id, __v, ...rest } = plan.toObject();
    const cloned = new PlanModel({
      ...rest,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      isArchived: false,
      planStatus: "draft",
      createdAt: new Date()
    });

    await cloned.save();
    res.json(cloned);
  } catch (err) {
    res.status(500).json({ message: "Reuse plan failed", err });
  }
};

async function autoArchivePlans(userId: string) {
  const today = new Date();

  await PlanModel.updateMany(
    {
      user: userId,
      isArchived: false,
      end_date: { $lt: today.toISOString().slice(0,10) }
    },
    {
      $set: { isArchived: true }
    }
  );
}
