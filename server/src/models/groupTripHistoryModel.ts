import mongoose from "mongoose";

const GroupTripHistorySchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    round: { type: Number, required: true },

    finalizedPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    planOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    trip_title: String,
    previewImage: String,
    provinceName: String,
    total_budget: Number,

    start_date: String,
    end_date: String,

    finalizedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: Date.now },
    archiveReason:{ type: String, enum: ["archived_by_owner", "completed"], required: true },
  },
  { collection: "group_trip_histories" }
);

GroupTripHistorySchema.index({ groupId: 1, round: 1 }, { unique: true });

const GroupTripHistoryModel = mongoose.model("GroupTripHistory", GroupTripHistorySchema);
export default GroupTripHistoryModel;