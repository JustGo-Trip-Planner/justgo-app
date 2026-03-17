import { Request, Response } from "express";
import axios from "axios";
import PlanModel from "../models/planModel";
import { Plan } from "../types/response";
import config from "../config";
import { AuthRequest } from "../middlewares/auth";

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
      num_plans: num_plans || 1,
    };

    console.log("generatePlans payload:", payload);

    const response = await axios.post<{ plans: Plan[] }>(
      `${config.RAG_URL}/api/plan/generate`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 100000,
        responseType: "json",
      }
    );

    const result = response.data;
    const plans = result?.plans ?? [];

    return res.status(200).json({ plans });
  } catch (err: any) {
    console.error("Error in generatePlans:", err.message || err);
    return res.status(500).json({ error: "Failed to preview plans",
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

    const fullPlan = req.body;
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
  const updatedData = req.body;
  
  try {
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
