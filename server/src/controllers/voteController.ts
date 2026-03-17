import { Response } from "express";
import GroupModel from "../models/groupModel";
import GroupPlanModel from "../models/groupPlanModel";
import { AuthRequest } from "../middlewares/auth";
import VoteModel from "../models/voteModel";
import { checkAndCloseVoting } from "../logic/voting";
import mongoose from "mongoose";
import PlanModel from "../models/planModel";
import { archiveTrip } from "../logic/groupTrip";

// POST /api/groups/:groupId/submit-plan
export const submitMyPlanToGroup = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = String(req.params.groupId);
    const { planId } = req.body as { planId: string };

    if (!planId) return res.status(400).json({ message: "planId is required" });

    await archiveTrip(groupId);

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
      { groupId, round: group.currentRound, userId: req.userId },
      {
        $set: {
          planId,
          round: group.currentRound,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    );

    await PlanModel.findByIdAndUpdate(planId, {
      $set: { planStatus: "submitted" },
    });

    group.tripStatus = "voting";
    await group.save();

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
    await archiveTrip(groupId);

    const group = await GroupModel.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    const acceptedMembers = (group.members ?? []).filter((m: any) => m.status === "accepted");
    const eligibleUserIds = [
      String(group.owner),
      ...acceptedMembers.map((m: any) => String(m.userId)),
    ];

    const submissions = await GroupPlanModel.find({
      groupId,
      round: group.currentRound,
    })
      .populate("planId")
      .populate("userId", "first_name avatar")
      .lean();

    const planIds = submissions.map((s: any) => String(s.planId?._id ?? s.planId));
    const requiredPlans = planIds.length;

    const votes = await VoteModel.find({
      groupId,
      round: group.currentRound,
    }).lean();

    const votedSet = new Set(votes.map((v: any) => `${v.userId}:${v.planId}`));

    const voterProgress = eligibleUserIds.map((uid) => {
      const votedCount = planIds.filter((pid) => votedSet.has(`${uid}:${pid}`)).length;
      const completed = requiredPlans > 0 && votedCount === requiredPlans;
      return { userId: uid, votedCount, requiredPlans, completed };
    });

    const completedVoters = voterProgress.filter((v) => v.completed).length;
    const progress = eligibleUserIds.length === 0 ? 0 : completedVoters / eligibleUserIds.length;

    const myVotedPlanIds = planIds.filter((pid) => votedSet.has(`${req.userId}:${pid}`));

    return res.json({
      group: {
        _id: groupId,
        round: group.currentRound,
        votingDeadline: group.votingDeadline,
        votingClosed: group.votingClosed,
        votingClosedReason: group.votingClosedReason,
        finalizedPlanId: group.finalizedPlanId,
        tripStatus: group.tripStatus,
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

    await archiveTrip(groupId);

    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.votingClosed) return res.status(400).json({ message: "Voting already closed" });
    if (group.finalizedPlanId) return res.status(400).json({ message: "Group already finalized" });

    const isOwner = String(group.owner) === String(req.userId);
    const isAcceptedMember = group.members.some(
      (m: any) => String(m.userId) === String(req.userId) && m.status === "accepted"
    );
    if (!isOwner && !isAcceptedMember) return res.status(403).json({ message: "Forbidden" });

    const exists = await GroupPlanModel.findOne({
      groupId,
      round: group.currentRound,
      planId,
    }).lean();

    if (!exists) return res.status(400).json({ message: "Plan not in this round" });

    await VoteModel.create({
      groupId,
      round: group.currentRound,
      userId: req.userId,
      planId,
      score,
      comment: comment ?? "",
    });

    await checkAndCloseVoting(groupId, group.currentRound);

    return res.json({ success: true });
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(400).json({ message: "You already voted this plan" });
    }
    return res.status(500).json({ message: "Vote failed", error: e });
  }
};

// GET /api/groups/:groupId/voting-result
export const getVotingResult = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const groupId = String(req.params.groupId);
    await archiveTrip(groupId);

    const group = await GroupModel.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.votingClosed) return res.status(400).json({ message:"Voting still in progress" })

    const submissions = await GroupPlanModel.find({
      groupId,
      round: group.currentRound,
    })
      .populate("planId")
      .populate("userId", "first_name avatar")
      .lean();

    const votes = await VoteModel.find({
      groupId,
      round: group.currentRound,
    }).lean();

    const bucket = new Map<
      string,
      {
        plan:any
        submitter:any
        count:number
        sum:number
        voters:any[]
        criteria:{
        suitability:number
        budget:number
        schedule:number
        variety:number
        }
      }
      >();

    for (const s of submissions as any[]) {
      if (!s.planId) continue;

      const pid = String(s.planId._id ?? s.planId);
      bucket.set(pid, {
        plan:s.planId,
        submitter:s.userId,
        count:0,
        sum:0,
        voters:[],
        criteria:{
          suitability:0,
          budget:0,
          schedule:0,
          variety:0
        }
      });
    }

    for (const v of votes as any[]) {
      const pid = String(v.planId);
      const b = bucket.get(pid);

      if(!b) continue;

      const s = v.score;
      const total =
        s.suitability +
        s.budget +
        s.schedule +
        s.variety;

      b.sum += total;
      b.count += 1;

      b.criteria.suitability += s.suitability;
      b.criteria.budget += s.budget;
      b.criteria.schedule += s.schedule;
      b.criteria.variety += s.variety;

      b.voters.push(v.userId);
    }

    const result = Array.from(bucket.entries()).map(([planId, b]) => {
      const avg = b.count === 0 ? 0 : b.sum / (b.count * 4);

      const criteriaAvg = {
        suitability: b.count ? b.criteria.suitability / b.count : 0,
        budget: b.count ? b.criteria.budget / b.count : 0,
        schedule: b.count ? b.criteria.schedule / b.count : 0,
        variety: b.count ? b.criteria.variety / b.count : 0
      };

      return {
        planId,
        plan: b.plan,
        submitter: b.submitter,
        avgScore: Number(avg.toFixed(2)),
        votes: b.count,
        voters: b.voters,
        criteria: {
          suitability: Number(criteriaAvg.suitability.toFixed(2)),
          budget :Number(criteriaAvg.budget.toFixed(2)),
          schedule: Number(criteriaAvg.schedule.toFixed(2)),
          variety: Number(criteriaAvg.variety.toFixed(2))
        }
      };
    });
    
    result.sort((a, b) => {
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      return b.votes - a.votes;
    });

    return res.json({
      round: group.currentRound,
      votingClosed: group.votingClosed,
      votingClosedReason: group.votingClosedReason,
      finalizedPlanId: group.finalizedPlanId,
      ranking: result,
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

    await archiveTrip(groupId);

    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (String(group.owner) !== String(req.userId)) {
      return res.status(403).json({ message: "Owner only" });
    }

    if (!group.votingClosed) {
      return res.status(400).json({ message: "Voting not closed yet" });
    }

    const selected = await GroupPlanModel.findOne({
      groupId,
      round: group.currentRound,
      planId,
    });

    if (!selected) {
      return res.status(400).json({ message: "Plan not found in current round" });
    }

    group.finalizedPlanId = new mongoose.Types.ObjectId(planId);
    group.finalizedAt = new Date();
    group.tripStatus = "finalized";
    await group.save();

    await PlanModel.findByIdAndUpdate(planId, {
      $set: { planStatus: "finalized" },
    });

    return res.json({
      success: true,
      finalizedPlanId: planId,
      round: group.currentRound,
    });
  } catch (e: any) {
    return res.status(500).json({ message: "Finalize failed", error: e });
  }
};