const fs = require("fs");
const path = require("path");

const User = require("../models/User");
const UserPrediction = require("../models/UserPrediction");

const DB_PATH = path.join(__dirname, "../../data/db.json");

const defaultNotifications = {
  predictionResolved: true,
  favoriteMatchStart: true,
  favoriteMatchResult: true,
};

const allowedAvatarIds = new Set([
  "captain",
  "striker",
  "playmaker",
  "keeper",
  "winger",
  "maestro",
  "anchor",
  "wall",
  "talisman",
  "engine",
  "derby",
  "champion",
]);

function readLegacyDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { users: [], userPredictions: [] };
    }

    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = raw ? JSON.parse(raw) : {};

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      userPredictions: Array.isArray(parsed.userPredictions) ? parsed.userPredictions : [],
    };
  } catch (error) {
    return { users: [], userPredictions: [] };
  }
}

function getPublicUserId(user) {
  return String(user?.legacyId || user?._id || "");
}

async function migrateLegacyData() {
  const legacy = readLegacyDb();
  if (!legacy.users.length && !legacy.userPredictions.length) {
    return;
  }

  let usersCreated = 0;
  let usersLinked = 0;
  let predictionsCreated = 0;

  for (const legacyUser of legacy.users) {
    const email = String(legacyUser?.email || "").trim().toLowerCase();
    if (!email) continue;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        legacyId: legacyUser.id || undefined,
        username: String(legacyUser.username || "goalio-user").trim(),
        email,
        passwordHash: legacyUser.passwordHash,
        avatarId: allowedAvatarIds.has(legacyUser.avatarId) ? legacyUser.avatarId : "captain",
        favorites: Array.isArray(legacyUser.favorites) ? legacyUser.favorites.map(String) : [],
        favoriteTeams: Array.isArray(legacyUser.favoriteTeams) ? legacyUser.favoriteTeams : [],
        favoritePlayers: Array.isArray(legacyUser.favoritePlayers) ? legacyUser.favoritePlayers : [],
        notifications: {
          ...defaultNotifications,
          ...(legacyUser.notifications || {}),
        },
        createdOn: legacyUser.createdOn || new Date().toISOString(),
      });
      usersCreated += 1;
      continue;
    }

    if (!user.legacyId && legacyUser.id) {
      user.legacyId = legacyUser.id;
      usersLinked += 1;
    }

    if ((!Array.isArray(user.favoriteTeams) || user.favoriteTeams.length === 0) && Array.isArray(legacyUser.favoriteTeams) && legacyUser.favoriteTeams.length > 0) {
      user.favoriteTeams = legacyUser.favoriteTeams;
    }

    if ((!Array.isArray(user.favoritePlayers) || user.favoritePlayers.length === 0) && Array.isArray(legacyUser.favoritePlayers) && legacyUser.favoritePlayers.length > 0) {
      user.favoritePlayers = legacyUser.favoritePlayers;
    }

    if ((!Array.isArray(user.favorites) || user.favorites.length === 0) && Array.isArray(legacyUser.favorites) && legacyUser.favorites.length > 0) {
      user.favorites = legacyUser.favorites.map(String);
    }

    if (!user.createdOn && legacyUser.createdOn) {
      user.createdOn = legacyUser.createdOn;
    }

    if (!user.notifications) {
      user.notifications = {
        ...defaultNotifications,
        ...(legacyUser.notifications || {}),
      };
    }

    if (user.isModified()) {
      await user.save();
    }
  }

  for (const legacyPrediction of legacy.userPredictions) {
    const legacyUserId = String(legacyPrediction?.userId || "").trim();
    const matchId = String(legacyPrediction?.matchId || "").trim();
    if (!legacyUserId || !matchId) continue;

    const owner = await User.findOne({ legacyId: legacyUserId });
    if (!owner) continue;

    const userId = getPublicUserId(owner);
    const existing = await UserPrediction.findOne({
      userId,
      matchId,
    }).lean();

    if (existing) continue;

    await UserPrediction.create({
      legacyId: legacyPrediction.id || undefined,
      userId,
      matchId,
      predictedResult: legacyPrediction.predictedResult,
      createdOn: legacyPrediction.createdOn || new Date().toISOString(),
    });
    predictionsCreated += 1;
  }

  if (usersCreated || usersLinked || predictionsCreated) {
    console.log("-----------------------------------------");
    console.log(
      `SYSTEM: Legacy migration tamamlandi (users:${usersCreated}, linked:${usersLinked}, predictions:${predictionsCreated})`,
    );
    console.log("-----------------------------------------");
  }
}

module.exports = { migrateLegacyData };
