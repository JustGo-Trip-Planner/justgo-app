import mongoose from "mongoose";

const GroupMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    avatar: String,
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
  },
  { _id: false }
);

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [GroupMemberSchema],

    currentRound: { type: Number, default: 1 },

    votingDeadline: { type: Date, default: null },
    votingClosed: { type: Boolean, default: false },
    votingClosedReason: { type: String, enum: ["deadline", "all_voted", null], default: null },

    finalizedPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", default: null },
    finalizedAt: { type: Date, default: null },

    tripStatus: { type: String, enum: ["planning", "voting", "finalized"], default: "planning"},

    createdAt: { type: Date, default: Date.now },
  }
);

GroupSchema.index({ owner: 1 })
GroupSchema.index({ "members.userId": 1 })

const GroupModel = mongoose.model("Group", GroupSchema);
export default GroupModel;
