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
    createdAt: { type: Date, default: Date.now },
  }
);

const GroupModel = mongoose.model("Group", GroupSchema);
export default GroupModel;
