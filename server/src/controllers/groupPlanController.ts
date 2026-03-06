import { Response } from "express";
import GroupModel from "../models/groupModel";
import GroupPlanModel from "../models/groupPlanModel";
import PlanModel from "../models/planModel";
import { AuthRequest } from "../middlewares/auth";

const isMemberAllowed = (group: any, userId: string) => {
  const isOwner = String(group.owner) === String(userId);
  const isAccepted = group.members?.some(
    (m: any) => String(m.userId) === String(userId) && m.status === "accepted"
  );
  return isOwner || isAccepted;
};

// GET /api/groups/:groupId/submit
export const getSubmittedPlans = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = req.params.groupId;
    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!isMemberAllowed(group, req.userId)) return res.status(403).json({ message: "Forbidden" });

    const rows = await GroupPlanModel.find({ groupId })
      .populate("userId", "first_name avatar")
      .populate("planId", "trip_title start_date end_date total_budget previewImage provinceName")
      .sort({ updatedAt: -1 });

    const my = rows.find((r: any) => String(r.userId?._id) === String(req.userId));

    return res.json({
      items: rows,
      myPlanId: my?.planId?._id ?? null,
    });
  } catch (e) {
    return res.status(500).json({ message: "Load submitted plans failed", error: e });
  }
};

// POST /api/groups/:groupId/submit   body: { planId }
export const submitMyPlan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = req.params.groupId;
    const { planId } = req.body as { planId: string };
    if (!planId) return res.status(400).json({ message: "planId is required" });

    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!isMemberAllowed(group, req.userId)) return res.status(403).json({ message: "Forbidden" });

    const plan = await PlanModel.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const ownerId = (plan as any).user ?? (plan as any).userId;
    if (!ownerId || String(ownerId) !== String(req.userId)) {
      return res.status(403).json({ message: "You can submit only your plan" });
    }

    const saved = await GroupPlanModel.findOneAndUpdate(
      { groupId, userId: req.userId },
      { $set: { planId, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: saved });
  } catch (e: any) {
    return res.status(500).json({ message: "Submit plan failed", error: e });
  }
};

// DELETE /api/groups/:groupId/submit
export const removeMyPlan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = req.params.groupId;

    await GroupPlanModel.deleteOne({ groupId, userId: req.userId });

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: "Remove plan failed", error: e });
  }
};