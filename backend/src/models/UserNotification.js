const mongoose = require("mongoose");

const UserNotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    key: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, default: "", trim: true },
    matchId: { type: String, default: "", trim: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

UserNotificationSchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports =
  mongoose.models.UserNotification ||
  mongoose.model("UserNotification", UserNotificationSchema);
