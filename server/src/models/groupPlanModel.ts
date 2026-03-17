import mongoose from "mongoose";

const GroupPlanSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    round: { type: Number, required: true, default: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "group_plans" }
);

GroupPlanSchema.index({ groupId: 1, round: 1, userId: 1 }, { unique: true });

const GroupPlanModel = mongoose.model("GroupPlan", GroupPlanSchema);
export default GroupPlanModel;