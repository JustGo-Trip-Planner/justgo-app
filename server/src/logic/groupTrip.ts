import GroupModel from "../models/groupModel";
import GroupPlanModel from "../models/groupPlanModel";
import PlanModel from "../models/planModel";
import VoteModel from "../models/voteModel";
import GroupTripHistoryModel from "../models/groupTripHistoryModel";

function parsePlanEndDate(endDate?: string | null) {
  if (!endDate) return null;

  const d = new Date(endDate);
  if (!isNaN(d.getTime())) return d;

  const parts = endDate.split("-");
  if (parts.length === 3) {
    const [y, m, day] = parts.map(Number);
    const parsed = new Date(y, m - 1, day, 23, 59, 59, 999);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export async function archiveTrip(groupId: string) {
  const group = await GroupModel.findById(groupId);
  
  if (!group) return null;
  if (!group.finalizedPlanId) return group;
  if (group.tripStatus !== "finalized") return group;

  const plan = await PlanModel.findById(group.finalizedPlanId);
  if (!plan) return group;

  const endDate = parsePlanEndDate(plan.end_date);
  if (!endDate) return group;

  const now = new Date();
  if (endDate.getTime() >= now.getTime()) {
    return group;
  }

  const existingHistory = await GroupTripHistoryModel.findOne({
    groupId: group._id,
    round: group.currentRound,
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
    });
  }

  await PlanModel.findByIdAndUpdate(plan._id, {
    $set: { planStatus: "completed" },
  });

  await GroupPlanModel.deleteMany({
    groupId: group._id,
    round: group.currentRound,
  });

  await VoteModel.deleteMany({
    groupId: group._id,
    round: group.currentRound,
  });

  group.currentRound += 1;
  group.votingDeadline = null;
  group.votingClosed = false;
  group.votingClosedReason = null;
  group.finalizedPlanId = null;
  group.finalizedAt = null;
  group.tripStatus = "planning";

  await group.save();

  return group;
}