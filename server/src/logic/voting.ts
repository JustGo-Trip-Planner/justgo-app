import GroupModel from "../models/groupModel";
import GroupPlanModel from "../models/groupPlanModel";
import VoteModel from "../models/voteModel";

export async function checkAndCloseVoting(groupId: string, round?: number) {
  const group = await GroupModel.findById(groupId);
  if (!group) return;

  const activeRound = round ?? group.currentRound;

  if (group.votingClosed) return;

  const submissions = await GroupPlanModel.find({
    groupId,
    round: activeRound,
  }).lean();

  const acceptedMembers = (group.members ?? []).filter((m: any) => m.status === "accepted");
  const eligibleUserIds = [
    String(group.owner),
    ...acceptedMembers.map((m: any) => String(m.userId)),
  ];

  const planIds = submissions.map((s: any) => String(s.planId));
  const requiredPlans = planIds.length;

  if (requiredPlans === 0) return;

  const votes = await VoteModel.find({
    groupId,
    round: activeRound,
  }).lean();

  const votedSet = new Set(votes.map((v: any) => `${v.userId}:${v.planId}`));

  const allVoted = eligibleUserIds.every((uid) =>
    planIds.every((pid) => votedSet.has(`${uid}:${pid}`))
  );

  const deadlinePassed =
    !!group.votingDeadline && new Date(group.votingDeadline).getTime() <= Date.now();

  if (allVoted || deadlinePassed) {
    group.votingClosed = true;
    group.votingClosedReason = allVoted ? "all_voted" : "deadline";
    await group.save();
  }
}