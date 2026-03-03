import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // receiver
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // sender
    type: { type: String, enum: ["group_invite"], required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },

    status: { type: String, enum: ["unread", "read", "accepted", "declined"], default: "unread" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const NotificationModel = mongoose.model("Notification", NotificationSchema);
export default NotificationModel;