import { Response } from "express";
import NotificationModel from "../models/notificationModel";
import { AuthRequest } from "../middlewares/auth";

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  const noti = await NotificationModel.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("fromUserId", "first_name avatar")
    .populate("groupId", "name");

  res.json(noti);
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;

  await NotificationModel.updateOne(
    { _id: id, userId: req.userId },
    { $set: { status: "read" } }
  );

  res.json({ success: true });
};