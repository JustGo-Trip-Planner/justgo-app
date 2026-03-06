import GroupModel from "../models/groupModel";
import GroupPlanModel from "../models/groupPlanModel";
import VoteModel from "../models/voteModel";

export const checkAndCloseVoting = async (groupId: string) => {
  const group = await GroupModel.findById(groupId);
  if (!group) return;

  if (group.votingClosed) return;
  if (group.finalizedPlanId) return;

  const now = new Date();

  // 1) deadline reached
  if (group.votingDeadline && now >= group.votingDeadline) {
    group.votingClosed = true;
    group.votingClosedReason = "deadline";
    await group.save();
    return;
  }

  // 2) all voted condition: ทุก eligible โหวตครบทุก submissions
  const submissions = await GroupPlanModel.find({ groupId }).lean();
  const planIds = submissions.map((s: any) => String(s.planId));
  const requiredPlans = planIds.length;

  // ถ้ายังไม่มีแผนในกลุ่ม → ยังไม่ปิดโหวต
  if (requiredPlans === 0) return;

  const acceptedMembers = group.members.filter((m: any) => m.status === "accepted");
  const eligibleUserIds = [
    String(group.owner),
    ...acceptedMembers.map((m: any) => String(m.userId)),
  ];

  const votes = await VoteModel.find({ groupId }).lean();
  const votedSet = new Set(votes.map((v: any) => `${v.userId}:${v.planId}`));

  const allCompleted = eligibleUserIds.every((uid) => {
    const votedCount = planIds.filter((pid) => votedSet.has(`${uid}:${pid}`)).length;
    return votedCount === requiredPlans;
  });

  if (allCompleted) {
    group.votingClosed = true;
    group.votingClosedReason = "all_voted";
    await group.save();
  }
};