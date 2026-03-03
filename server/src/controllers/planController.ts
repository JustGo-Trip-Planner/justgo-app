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
    const plan = await PlanModel.findById(id).exec();
    
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    return res.json(plan);
  } catch (err: any) {
    console.error("Error in getSavedPlanById:", err.message || err);
    return res.status(500).json({ error: "Failed to load plan" });
  }
}

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
