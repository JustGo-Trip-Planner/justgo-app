import { Response } from "express";
import mongoose from "mongoose";
import GroupModel from "../models/groupModel";
import { AuthRequest } from "../middlewares/auth";
import NotificationModel from "../models/notificationModel";

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, members = [], votingDeadline } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!votingDeadline) {
      return res.status(400).json({ message: "votingDeadline is required" });
    }

    const vd = new Date(votingDeadline);
    if (isNaN(vd.getTime()) || vd.getTime() <= Date.now()) {
      return res.status(400).json({ message: "Invalid votingDeadline" });
    }

    // check duplicate members
    const uniq = new Map<string, any>();
    for (const m of members) {
      if (!m?.userId) continue;
      const id = String(m.userId);
      if (id === String(req.userId)) continue;
      if (!uniq.has(id)) uniq.set(id, m);
    }

    const pendingMembers = Array.from(uniq.values()).map((m) => ({
      userId: m.userId,
      name: m.name,
      avatar: m.avatar ?? "",
      status: "pending",
      invitedAt: new Date(),
    }));

    const group = await GroupModel.create({
      name: name.trim(),
      owner: req.userId,
      members: pendingMembers,
      votingDeadline: vd,
    });

    // notify all pending members
    if (pendingMembers.length > 0) {
      await NotificationModel.insertMany(
        pendingMembers.map((m) => ({
          userId: m.userId,
          fromUserId: req.userId,
          type: "group_invite",
          groupId: group._id,
          status: "unread",
          createdAt: new Date(),
        }))
      );
    }

    return res.status(201).json(group);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Create group failed", error });
  }
};

export const getMyGroups = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const uid = req.userId;

    const groups = await GroupModel.find({
      $or: [
        { owner: uid },
        { members: { $elemMatch: { userId: uid, status: "accepted" } } },
      ],
    })
    .populate("finalizedPlanId")
    .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Load groups failed" });
  }
};

export const getGroupById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const group = await GroupModel.findById(id)
      .populate("owner", "first_name avatar")
      .populate("members.userId", "first_name avatar")
      .populate("finalizedPlanId");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: "Load group failed" });
  }
};

// POST /api/groups/:groupId/invite
export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.params;
    const { userId, name, avatar } = req.body;

    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (String(group.owner) !== String(req.userId)) {
      return res.status(403).json({ message: "Only owner can invite" });
    }

    const exists = group.members.find(
      (m: any) => String(m.userId) === String(userId)
    );

    if (exists) {
      return res.status(400).json({ message: "User already in group or invited" });
    }

    // add to group members
    group.members.push({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      avatar: avatar ?? "",
      status: "pending",
      invitedAt: new Date(),
    });
    await group.save();

    // create notification for invited user
    await NotificationModel.create({
      userId,
      fromUserId: req.userId,
      type: "group_invite",
      groupId: group._id,
      status: "unread",
      createdAt: new Date(),
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Invite member failed", error });
  }
};

// DELETE /api/groups/:groupId/invite/:userId
export const removeInviteMember = async (req: AuthRequest, res: Response) => {
  try {

    if (!req.userId)
      return res.status(401).json({ message: "Unauthorized" });

    const { groupId, userId } = req.params;

    const uid = Array.isArray(userId) ? userId[0] : userId;

    const group = await GroupModel.findById(groupId);

    if (!group)
      return res.status(404).json({ message: "Group not found" });

    if (String(group.owner) !== String(req.userId))
      return res.status(403).json({ message: "Only owner can remove invite" });

    // 🔥 ลบ member โดยตรง
    const result = await GroupModel.updateOne(
      {
        _id: groupId,
        "members.userId": uid
      },
      {
        $pull: {
          members: { userId: uid }
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Invite not found" });
    }

    await NotificationModel.deleteMany({
      userId: uid,
      groupId,
      type: "group_invite"
    });

    return res.json({ success: true });

  } catch (error) {

    console.log("removeInvite error", error);

    return res.status(500).json({
      message: "Remove invite failed",
      error
    });

  }
};

// POST /api/groups/:groupId/respond
export const respondInvite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.params;
    const { action } = req.body as { action: "accept" | "decline" };

    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const member = group.members.find((m: any) => String(m.userId) === String(req.userId));
    if (!member) return res.status(403).json({ message: "You are not invited to this group" });

    // accept invite = update status to accepted
    if (action === "accept") {
      member.status = "accepted";
      member.acceptedAt = new Date();
      await group.save();

      await NotificationModel.updateMany(
        { userId: req.userId, groupId, type: "group_invite" },
        { $set: { status: "accepted" } }
      );

      return res.json({ success: true, status: "accepted" });
    }

    // decline invite = remove from group
    group.members.pull({ userId: req.userId });
    await group.save();

    await NotificationModel.updateMany(
      { userId: req.userId, groupId, type: "group_invite" },
      { $set: { status: "declined" } }
    );

    return res.json({ success: true, status: "declined" });
  } catch (e) {
    return res.status(500).json({ message: "Respond invite failed", error: e });
  }
};

export const leaveGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const group = await GroupModel.findById(id);

    if (!group) return res.status(404).json({ message: "Group not found" });

    if (String(group.owner) === String(req.userId)) {
      return res.status(400).json({ message: "Owner cannot leave group" });
    }

    group.members.pull({ userId: req.userId });
    await group.save();

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: "Leave group failed", error: e });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const group = await GroupModel.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (String(group.owner) !== String(req.userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await GroupModel.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: "Delete group failed", error: e });
  }
};