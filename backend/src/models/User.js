const mongoose = require("mongoose");

const FavoriteTeamSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    logo: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const FavoritePlayerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    jersey_number: { type: Number, default: null },
    teamName: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const NotificationPrefsSchema = new mongoose.Schema(
  {
    predictionResolved: { type: Boolean, default: true },
    favoriteMatchStart: { type: Boolean, default: true },
    favoriteMatchResult: { type: Boolean, default: true },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    legacyId: { type: String, index: true, sparse: true },
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarId: { type: String, default: "captain" },
    favorites: [{ type: String, trim: true }],
    favoriteTeams: { type: [FavoriteTeamSchema], default: [] },
    favoritePlayers: { type: [FavoritePlayerSchema], default: [] },
    notifications: { type: NotificationPrefsSchema, default: () => ({}) },
    createdOn: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true },
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
