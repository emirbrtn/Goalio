const mongoose = require("mongoose");

const UserPredictionSchema = new mongoose.Schema(
  {
    legacyId: { type: String, index: true, sparse: true },
    userId: { type: String, required: true, index: true, trim: true },
    matchId: { type: String, required: true, index: true, trim: true },
    predictedResult: { type: String, required: true, trim: true },
    createdOn: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true },
);

UserPredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

module.exports =
  mongoose.models.UserPrediction ||
  mongoose.model("UserPrediction", UserPredictionSchema);
