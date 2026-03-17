import mongoose from "mongoose";

const VoteScoreSchema = new mongoose.Schema(
  {
    suitability: { type: Number, min: 1, max: 5, required: true },  // ความเหมาะสม
    budget: { type: Number, min: 1, max: 5, required: true },       // ความคุ้มค่า
    schedule: { type: Number, min: 1, max: 5, required: true },     // ตารางเวลาของแผน
    variety: { type: Number, min: 1, max: 5, required: true },      // ความหลากหลาย
    // other
  },
  { _id: false }
);

const VoteSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    round: { type: Number, required: true, default: 1, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true, index: true },

    score: { type: VoteScoreSchema, required: true },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

VoteSchema.index({ groupId: 1, round: 1, userId: 1, planId: 1 }, { unique: true });

const VoteModel = mongoose.model("Vote", VoteSchema);
export default VoteModel;
