import { Response } from "express";
import GroupModel from "../models/groupModel";
import GroupPlanModel from "../models/groupPlanModel";
import { AuthRequest } from "../middlewares/auth";
import VoteModel from "../models/voteModel";
import { checkAndCloseVoting } from "../logic/voting";
import mongoose from "mongoose";

// POST /api/groups/:groupId/submit-plan
export const submitMyPlanToGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = String(req.params.groupId);
    const { planId } = req.body as { planId: string };

    if (!planId) return res.status(400).json({ message: "planId is required" });

    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.votingClosed) return res.status(400).json({ message: "Voting already closed" });
    if (group.finalizedPlanId) return res.status(400).json({ message: "Group already finalized" });

    const isOwner = String(group.owner) === String(req.userId);
    const isAcceptedMember = group.members.some(
      (m: any) => String(m.userId) === String(req.userId) && m.status === "accepted"
    );
    if (!isOwner && !isAcceptedMember) return res.status(403).json({ message: "Forbidden" });

    const saved = await GroupPlanModel.findOneAndUpdate(
      { groupId, userId: req.userId },
      { $set: { planId } },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: saved });
  } catch (e: any) {
    return res.status(500).json({ message: "Submit plan failed", error: e });
  }
};

// GET /api/groups/:groupId/voting-state
export const getVotingState = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = String(req.params.groupId);

    const group = await GroupModel.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    // eligible users
    const acceptedMembers = (group.members ?? []).filter((m: any) => m.status === "accepted");
    const eligibleUserIds = [
      String(group.owner),
      ...acceptedMembers.map((m: any) => String(m.userId)),
    ];

    // submissions
    const submissions = await GroupPlanModel.find({ groupId })
      .populate("planId")
      .populate("userId", "first_name avatar")
      .lean();

    const planIds = submissions.map((s: any) => String(s.planId?._id ?? s.planId));
    const requiredPlans = planIds.length;

    // votes count by user
    const votes = await VoteModel.find({ groupId }).lean();

    const votedSet = new Set(votes.map((v: any) => `${v.userId}:${v.planId}`));

    const voterProgress = eligibleUserIds.map((uid) => {
      const votedCount = planIds.filter((pid) => votedSet.has(`${uid}:${pid}`)).length;
      const completed = requiredPlans > 0 && votedCount === requiredPlans;
      return { userId: uid, votedCount, requiredPlans, completed };
    });

    const completedVoters = voterProgress.filter((v) => v.completed).length;
    const progress = eligibleUserIds.length === 0 ? 0 : completedVoters / eligibleUserIds.length;

    // caller's view: which plans already voted
    const myVotedPlanIds = planIds.filter((pid) => votedSet.has(`${req.userId}:${pid}`));

    return res.json({
      group: {
        _id: groupId,
        votingDeadline: group.votingDeadline,
        votingClosed: group.votingClosed,
        votingClosedReason: group.votingClosedReason,
        finalizedPlanId: group.finalizedPlanId,
      },
      submissions,
      progress: {
        eligibleCount: eligibleUserIds.length,
        completedVoters,
        requiredPlans,
        progress,
        voterProgress,
        myVotedPlanIds,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: "Get voting state failed", error: e });
  }
};

// POST /api/groups/:groupId/vote
export const votePlan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = String(req.params.groupId);
    const { planId, score, comment } = req.body as {
      planId: string;
      score: { suitability: number; budget: number; schedule: number; variety: number };
      comment?: string;
    };

    if (!planId) return res.status(400).json({ message: "planId is required" });
    if (!score) return res.status(400).json({ message: "score is required" });

    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.votingClosed) return res.status(400).json({ message: "Voting already closed" });
    if (group.finalizedPlanId) return res.status(400).json({ message: "Group already finalized" });

    const isOwner = String(group.owner) === String(req.userId);
    const isAcceptedMember = group.members.some(
      (m: any) => String(m.userId) === String(req.userId) && m.status === "accepted"
    );
    if (!isOwner && !isAcceptedMember) return res.status(403).json({ message: "Forbidden" });

    // ensure plan exists in submissions
    const exists = await GroupPlanModel.findOne({ groupId, planId }).lean();
    if (!exists) return res.status(400).json({ message: "Plan not in this group" });

    await VoteModel.create({ groupId, userId: req.userId, planId, score, comment: comment ?? "" });

    await checkAndCloseVoting(groupId);

    return res.json({ success: true });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(400).json({ message: "You already voted this plan" });
    return res.status(500).json({ message: "Vote failed", error: e });
  }
};

// GET /api/groups/:groupId/voting-result
export const getVotingResult = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = String(req.params.groupId);

    const group = await GroupModel.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    const submissions = await GroupPlanModel.find({ groupId })
      .populate("planId")
      .populate("userId", "first_name avatar")
      .lean();

    const votes = await VoteModel.find({ groupId }).lean();

    const bucket = new Map<string, { plan: any; count: number; sum: number }>();


    // create bucket per plan
    for (const s of submissions as any[]) {

      if (!s.planId) continue;

      const pid = String(s.planId._id ?? s.planId);

      bucket.set(pid, {
        plan: s.planId,
        count: 0,
        sum: 0
      });
    }


    // aggregate scores
    for (const v of votes as any[]) {

      const pid = String(v.planId);
      const b = bucket.get(pid);

      if (!b) continue;

      const score = v.score;

      const total =
        score.suitability +
        score.budget +
        score.schedule +
        score.variety;

      b.sum += total;
      b.count += 1;
    }


    // compute average
    const result = Array.from(bucket.entries()).map(([planId, b]) => {

      const avg =
        b.count === 0
          ? 0
          : b.sum / (b.count * 4);

      return {
        planId,
        plan: b.plan,
        avgScore: Number(avg.toFixed(2)),
        votes: b.count
      };
    });


    // Average Score Ranking
    result.sort((a, b) => {

      if (b.avgScore !== a.avgScore) {
        return b.avgScore - a.avgScore;
      }

      return b.votes - a.votes;
    });

    return res.json({
      votingClosed: group.votingClosed,
      votingClosedReason: group.votingClosedReason,
      finalizedPlanId: group.finalizedPlanId,
      ranking: result
    });

  } catch (e: any) {
    return res.status(500).json({ message: "Get voting result failed", error: e });
  }
};

// POST /api/groups/:groupId/finalize
export const finalizeWinnerPlan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = String(req.params.groupId);
    const { planId } = req.body as { planId: string };

    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (String(group.owner) !== String(req.userId)) {
      return res.status(403).json({ message: "Owner only" });
    }
    if (!group.votingClosed) return res.status(400).json({ message: "Voting not closed yet" });

    group.finalizedPlanId = new mongoose.Types.ObjectId(planId);    
    group.finalizedAt = new Date();
    await group.save();

    return res.json({ success: true, finalizedPlanId: planId });
  } catch (e: any) {
    return res.status(500).json({ message: "Finalize failed", error: e });
  }
};