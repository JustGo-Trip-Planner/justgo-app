import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth";
import { archiveTrip } from "../logic/groupTrip";

import GroupModel from "../models/groupModel";
import GroupTripHistoryModel from "../models/groupTripHistoryModel";
import GroupPlanModel from "../models/groupPlanModel";
import VoteModel from "../models/voteModel";
import NotificationModel from "../models/notificationModel";

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, members = [], votingDeadline } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    let vd: Date | null = null;

    if (votingDeadline) {
      const d = new Date(votingDeadline);
      if (!isNaN(d.getTime())) {
        vd = d;
      }
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
      currentRound: 1,
      tripStatus: "planning",
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
      .populate("owner", "first_name avatar")
      .populate("members.userId", "first_name avatar")
      .populate("finalizedPlanId")
      .sort({ createdAt: -1 });

    const result = [];

    for (const g of groups) {

      await archiveTrip(String(g._id));

      const acceptedMembers = (g.members ?? []).filter(
        (m: any) => m.status === "accepted"
      );

      const eligibleUserIds = [
        String(g.owner),
        ...acceptedMembers.map((m: any) => String(m.userId)),
      ];

      const submissions = await GroupPlanModel.find({
        groupId: g._id,
        round: g.currentRound,
      }).lean();

      const planIds = submissions.map((s: any) =>
        String(s.planId)
      );

      const votes = await VoteModel.find({
        groupId: g._id,
        round: g.currentRound,
      }).lean();

      const votedSet = new Set(
        votes.map((v: any) => `${v.userId}:${v.planId}`)
      );

      let completedVoters = 0;

      for (const uid of eligibleUserIds) {

        const votedCount = planIds.filter((pid) =>
          votedSet.has(`${uid}:${pid}`)
        ).length;

        if (planIds.length > 0 && votedCount === planIds.length) {
          completedVoters++;
        }
      }

      result.push({
        ...g.toObject(),
        owner: g.owner
          ? {
              _id: (g.owner as any)._id,
              first_name: (g.owner as any).first_name || "",
              avatar: (g.owner as any).avatar || "",
            }
          : undefined,
        members: g.members.map((m: any) => ({
          ...m,
          avatar: m.avatar || m.userId?.avatar || "",
          name: m.name || m.userId?.first_name || "",
        })),
        voteProgress: {
          voted: completedVoters,
          total: eligibleUserIds.length,
        },
      });
    }

    res.json(result);
  } catch {
    res.status(500).json({ message: "Load groups failed" });
  }
};

export const getGroupById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const id  = getParam(req.params.id)
    await archiveTrip(id);

    const group = await GroupModel.findById(id)
      .populate("owner", "first_name avatar")
      .populate("members.userId", "first_name avatar")
      .populate("finalizedPlanId");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const history = await GroupTripHistoryModel.find({ groupId: id })
      .sort({ archivedAt: -1 })
      .populate("finalizedPlanId");

    res.json({
      ...group.toObject(),
      history,
    });
  } catch {
    res.status(500).json({ message: "Load group failed" });
  }
};

// PUT /api/groups/:id
export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { name, members, votingDeadline } = req.body;

    const group = await GroupModel.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (String(group.owner) !== String(req.userId)) {
      return res.status(403).json({ message: "Only owner can edit group" });
    }

    if (name?.trim()) {
      group.name = name.trim();
    }

    if (members) {
      const existingMembers = group.members || [];
      const newMembers = members.map((m: any) => {
        const existing = existingMembers.find((em: any) => String(em.userId) === String(m.userId));

        return {
          userId: new mongoose.Types.ObjectId(m.userId),
          name: m.name,
          avatar: m.avatar ?? "",
          status: existing?.status ?? "accepted",
          invitedAt: existing?.invitedAt ?? new Date(),
          acceptedAt: existing?.acceptedAt ?? new Date(),
        };
      });
      group.members = newMembers;
    }
    group.votingDeadline = votingDeadline ? new Date(votingDeadline) : null;

    await group.save();
    return res.json(group);
  } catch (error) {
    return res.status(500).json({ message: "Update group failed", error });
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

    const isOwner = String(group.owner) === String(req.userId);
    const isMember = group.members.some(
      (m: any) =>
        String(m.userId) === String(req.userId) &&
        m.status === "accepted"
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (String(userId) === String(group.owner)) {
      return res.status(400).json({ message: "Cannot invite owner" });
    }

    const exists = group.members.find(
      (m: any) => String(m.userId) === String(userId)
    );

    if (exists) {
      return res.status(400).json({ message: "User already invited or in group" });
    }

    const pending = group.members.find((m: any) => String(m.userId) === String(userId) && m.status === "pending");
    if (pending) {
      return res.status(400).json({ message: "Already invited (pending)" });
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

    const isOwner = String(group.owner) === String(req.userId);
    const isMember = group.members.some(
      (m: any) =>
        String(m.userId) === String(req.userId) &&
        m.status === "accepted"
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

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

    const id = getParam(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await GroupModel.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (String(group.owner) !== String(req.userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await GroupPlanModel.deleteMany({ groupId: id });
    await VoteModel.deleteMany({ groupId: id });
    await GroupTripHistoryModel.deleteMany({ groupId: id });
    await NotificationModel.deleteMany({ groupId: id });
    await GroupModel.deleteOne({ _id: id });

    return res.json({ success: true });
  } catch (e: any) {
    console.log("deleteGroup error:", e);
    return res.status(500).json({
      message: "Delete group failed",
      error: e?.message || e,
    });
  }
};

export const getGroupTripHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const id = getParam(req.params.id)

    const group = await GroupModel.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isOwner = String(group.owner) === String(req.userId);
    const isAccepted = group.members?.some(
      (m: any) => String(m.userId) === String(req.userId) && m.status === "accepted"
    );

    if (!isOwner && !isAccepted) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await archiveTrip(id);

    const history = await GroupTripHistoryModel.find({ groupId: id })
      .sort({ archivedAt: -1 })
      .populate("finalizedPlanId");

    return res.json(history);
  } catch (error) {
    return res.status(500).json({ message: "Load group history failed", error });
  }
};

export const moveTripToHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({message:"Unauthorized"})

    const id = getParam(req.params.id)
    const group = await GroupModel.findById(id).populate("finalizedPlanId")

    if (!group) return res.status(404).json({message:"Group not found"})
    if (!group.finalizedPlanId) return res.status(400).json({message:"No finalized trip"})

    const plan: any = group.finalizedPlanId

    const existingHistory = await GroupTripHistoryModel.findOne({
      groupId: group._id,
      round: group.currentRound
    });

    if (!existingHistory) {
      await GroupTripHistoryModel.create({
        groupId: group._id,
        round: group.currentRound,
        finalizedPlanId: plan._id,
        planOwnerId: plan.user ?? null,
        trip_title: plan.trip_title,
        previewImage: plan.previewImage,
        provinceName: plan.provinceName,
        total_budget: plan.total_budget,
        start_date: plan.start_date,
        end_date: plan.end_date,
        finalizedAt: group.finalizedAt,
        archivedAt: new Date(),
        archiveReason: "archived_by_owner"
      });
    }

    await GroupPlanModel.deleteMany({
      groupId: group._id,
      round: group.currentRound
    });

    await VoteModel.deleteMany({
      groupId: group._id,
      round: group.currentRound
    });

    group.currentRound += 1;
    group.finalizedPlanId = null;
    group.finalizedAt = null;
    group.votingDeadline = null;
    group.votingClosed = false;
    group.votingClosedReason = null;
    group.tripStatus = "planning";

    await group.save();
    return res.json({ success: true, message: "Trip archived and group reset for new round" });
  } catch (error) {
    return res.status(500).json({ message: "Move trip to history failed", error });
  }
};
