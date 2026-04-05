const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const UserNotification = require("../models/UserNotification");
const UserPrediction = require("../models/UserPrediction");

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

const defaultAvatarId = "captain";

const toPublicUserId = (user) => String(user?.legacyId || user?._id || "");

const signToken = (user) =>
  jwt.sign(
    { id: toPublicUserId(user), username: user.username },
    process.env.JWT_SECRET || "goalio-secret",
    { expiresIn: "7d" },
  );

function requireSameUser(req, res) {
  if (!req.user || String(req.user.id) !== String(req.params.id)) {
    res.status(403).json({ message: "Bu islem icin yetkiniz yok" });
    return false;
  }

  return true;
}

function sanitizeUser(user) {
  return {
    id: toPublicUserId(user),
    _id: toPublicUserId(user),
    username: user.username,
    email: user.email,
    avatarId: allowedAvatarIds.has(user.avatarId) ? user.avatarId : defaultAvatarId,
    favorites: Array.isArray(user.favorites) ? user.favorites : [],
    favoriteTeams: Array.isArray(user.favoriteTeams) ? user.favoriteTeams : [],
    favoritePlayers: Array.isArray(user.favoritePlayers) ? user.favoritePlayers : [],
    notifications: {
      ...defaultNotifications,
      ...(user.notifications || {}),
    },
  };
}

function sanitizeNotification(notification) {
  return {
    id: String(notification?._id || ""),
    _id: String(notification?._id || ""),
    key: notification.key,
    type: notification.type,
    title: notification.title,
    message: notification.message || "",
    matchId: notification.matchId || "",
    read: Boolean(notification.read),
    createdAt: notification.createdAt,
  };
}

function normalizeMatchState(state) {
  if (["INPLAY", "HT", "ET", "PEN_LIVE"].includes(state)) return "live";
  if (["FT", "AET", "FT_PEN"].includes(state)) return "finished";
  return "scheduled";
}

function extractParticipantGoals(scores = [], participantId) {
  const currentScore =
    scores.find(
      (score) =>
        String(score.participant_id) === String(participantId) &&
        (score.description === "CURRENT" || score.description === "TOTAL"),
    ) || {};

  return Number(currentScore?.score?.goals ?? currentScore?.goals ?? 0);
}

async function resolveUser(identifier) {
  const value = String(identifier || "").trim();
  if (!value) return null;

  let user = await User.findOne({ legacyId: value });
  if (user) return user;

  if (/^[a-f0-9]{24}$/i.test(value)) {
    user = await User.findById(value);
    if (user) return user;
  }

  return null;
}

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const cleanUsername = String(username || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !password) {
      return res.status(400).json({ message: "Kullanici adi, e-posta ve sifre gerekli" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Sifre en az 6 karakter olmali" });
    }

    const existingUser = await User.findOne({ email: cleanEmail }).lean();
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta adresi zaten kullanimda." });
    }

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: await bcrypt.hash(password, 10),
      avatarId: defaultAvatarId,
      favorites: [],
      favoriteTeams: [],
      favoritePlayers: [],
      notifications: { ...defaultNotifications },
      createdOn: new Date().toISOString(),
    });

    return res.status(201).json({
      token: signToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Sistem hatasi: " + error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Boyle bir kullanici bulunamadi." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Sifreniz hatali." });
    }

    return res.json({
      token: signToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Sistem hatasi: " + error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const user = await resolveUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Kullanici bulunamadi" });
  }

  return res.json(sanitizeUser(user));
};

exports.updateUserProfile = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const user = await resolveUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Kullanici bulunamadi" });
  }

  const username = String(req.body.username || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const avatarId = String(req.body.avatarId || "").trim();

  if (!username || !email) {
    return res.status(400).json({ message: "Kullanici adi ve e-posta gerekli" });
  }

  if (avatarId && !allowedAvatarIds.has(avatarId)) {
    return res.status(400).json({ message: "Gecersiz avatar secimi" });
  }

  const emailInUse = await User.findOne({
    email,
    _id: { $ne: user._id },
  }).lean();

  if (emailInUse) {
    return res.status(400).json({ message: "Bu e-posta adresi zaten kullanimda." });
  }

  user.username = username;
  user.email = email;
  user.avatarId = avatarId && allowedAvatarIds.has(avatarId) ? avatarId : user.avatarId || defaultAvatarId;
  await user.save();

  return res.json(sanitizeUser(user));
};

exports.updateNotificationPrefs = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const user = await resolveUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Kullanici bulunamadi" });
  }

  user.notifications = {
    ...defaultNotifications,
    ...(req.body || {}),
  };
  await user.save();

  return res.json(user.notifications);
};

exports.listUserNotifications = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const items = await UserNotification.find({ userId: String(req.params.id) })
    .sort({ createdAt: -1, _id: -1 })
    .limit(80)
    .lean();

  return res.json(items.map(sanitizeNotification));
};

exports.syncUserNotifications = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const notifications = Array.isArray(req.body?.notifications) ? req.body.notifications : [];
  const userId = String(req.params.id);

  for (const item of notifications) {
    const key = String(item?.key || "").trim();
    if (!key) continue;

    await UserNotification.updateOne(
      { userId, key },
      {
        $setOnInsert: {
          userId,
          key,
          type: String(item?.type || "generic").trim(),
          title: String(item?.title || "Bildirim").trim(),
          message: String(item?.message || "").trim(),
          matchId: String(item?.matchId || "").trim(),
          read: false,
          createdAt: item?.createdAt ? new Date(item.createdAt) : new Date(),
        },
      },
      { upsert: true },
    );
  }

  const items = await UserNotification.find({ userId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(80)
    .lean();

  return res.json(items.map(sanitizeNotification));
};

exports.markAllNotificationsRead = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  await UserNotification.updateMany(
    { userId: String(req.params.id), read: false },
    { $set: { read: true } },
  );

  const items = await UserNotification.find({ userId: String(req.params.id) })
    .sort({ createdAt: -1, _id: -1 })
    .limit(80)
    .lean();

  return res.json(items.map(sanitizeNotification));
};

exports.deleteUserNotification = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  await UserNotification.deleteOne({
    userId: String(req.params.id),
    _id: String(req.params.notificationId || ""),
  });

  return res.status(204).send();
};

exports.changePassword = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const { currentPassword, newPassword } = req.body;
  const user = await resolveUser(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "Kullanici bulunamadi" });
  }

  const matches = await bcrypt.compare(String(currentPassword || ""), user.passwordHash);
  if (!matches) {
    return res.status(400).json({ message: "Mevcut sifre hatali" });
  }

  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: "Yeni sifre en az 6 karakter olmali" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.status(204).send();
};

exports.deleteUser = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const user = await resolveUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Kullanici bulunamadi" });
  }

  const publicId = toPublicUserId(user);
  await UserPrediction.deleteMany({ userId: publicId });
  await UserNotification.deleteMany({ userId: publicId });
  await User.deleteOne({ _id: user._id });

  return res.json({ message: "Hesap silindi" });
};

exports.logout = async (req, res) => res.status(200).json({ message: "Cikis basarili" });

exports.listFavoriteTeams = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const user = await resolveUser(req.params.id);
  return res.json(Array.isArray(user?.favorites) ? user.favorites : []);
};

exports.addFavoriteTeam = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const user = await resolveUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Kullanici bulunamadi" });
  }

  const teamId = String(req.body.teamId || "").trim();
  if (!teamId) {
    return res.status(400).json({ message: "Takim kimligi gerekli" });
  }

  const currentFavorites = Array.isArray(user.favorites) ? user.favorites.map(String) : [];

  if (!currentFavorites.includes(teamId)) {
    user.favorites = [...currentFavorites, teamId];
    await user.save();
  }

  return res.json({ message: "Eklendi" });
};

exports.removeFavoriteTeam = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const user = await resolveUser(req.params.id);
  if (user) {
    const currentFavorites = Array.isArray(user.favorites) ? user.favorites.map(String) : [];
    user.favorites = currentFavorites.filter((favorite) => favorite !== String(req.params.teamId));
    await user.save();
  }

  return res.status(204).send();
};

exports.listUserFavoritesData = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const user = await resolveUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Kullanici bulunamadi" });
  }

  return res.json({
    teams: Array.isArray(user.favoriteTeams) ? user.favoriteTeams : [],
    players: Array.isArray(user.favoritePlayers) ? user.favoritePlayers : [],
  });
};

exports.updateUserFavoritesData = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const user = await resolveUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Kullanici bulunamadi" });
  }

  user.favoriteTeams = Array.isArray(req.body?.teams) ? req.body.teams : [];
  user.favoritePlayers = Array.isArray(req.body?.players) ? req.body.players : [];
  await user.save();

  return res.json({
    teams: user.favoriteTeams,
    players: user.favoritePlayers,
  });
};

exports.listUserPredictions = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  try {
    const predictions = await UserPrediction.find({ userId: String(req.params.id) })
      .sort({ createdOn: -1, createdAt: -1 })
      .lean();
    const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();

    const populated = await Promise.all(
      predictions.map(async (prediction) => {
        let matchInfo = {
          homeTeam: { name: "Bilinmiyor", logo: "" },
          awayTeam: { name: "Bilinmiyor", logo: "" },
        };
        const normalizedMatchId = String(prediction.matchId || "").trim();

        if (token && /^\d+$/.test(normalizedMatchId)) {
          try {
            const response = await fetch(
              `https://api.sportmonks.com/v3/football/fixtures/${normalizedMatchId}?api_token=${token}&include=participants;scores;state;league`,
            );
            if (!response.ok) {
              throw new Error(`fixture-fetch-failed:${response.status}`);
            }
            const json = await response.json();
            const fixture = json.data || {};
            const participants = fixture.participants || [];
            const home = participants.find((team) => team.meta?.location === "home") || participants[0];
            const away = participants.find((team) => team.meta?.location === "away") || participants[1];

            if (home && away) {
              const status = normalizeMatchState(fixture?.state?.state || "NS");
              matchInfo = {
                id: String(fixture.id || prediction.matchId),
                _id: String(fixture.id || prediction.matchId),
                league: fixture?.league?.name || "",
                status,
                startTime: fixture?.starting_at || "",
                homeTeam: { name: home.name, logo: home.image_path },
                awayTeam: { name: away.name, logo: away.image_path },
                score: {
                  home: status === "scheduled" ? null : extractParticipantGoals(fixture.scores || [], home.id),
                  away: status === "scheduled" ? null : extractParticipantGoals(fixture.scores || [], away.id),
                },
              };
            }
          } catch (error) {
            console.log("Prediction logo fetch failed:", prediction.matchId);
          }
        }

        return {
          ...prediction,
          id: String(prediction.legacyId || prediction._id),
          _id: String(prediction.legacyId || prediction._id),
          match: matchInfo,
        };
      }),
    );

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: "Tahminler getirilemedi" });
  }
};

exports.saveUserPrediction = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  const matchId = String(req.body.matchId || "").trim();
  if (!matchId) {
    return res.status(400).json({ message: "Mac kimligi gerekli" });
  }

  const existingPrediction = await UserPrediction.findOne({
    userId: String(req.params.id),
    matchId,
  }).lean();

<<<<<<< HEAD
    if (!/^\d+$/.test(matchId)) {
      return res.status(400).json({ message: "Gecersiz mac kimligi" });
    }

    if (!allowedPredictionResults.has(predictedResult)) {
      return res.status(400).json({ message: "Gecersiz tahmin secimi" });
    }

    const fixture = await fetchFixtureForPrediction(matchId);
    const matchStatus = normalizeMatchState(fixture?.state?.state || "NS");
    if (matchStatus !== "scheduled") {
      return res.status(400).json({ message: "Tahmin sadece baslamamis maclar icin kaydedilebilir" });
    }

    const existingPrediction = await UserPrediction.findOne({
      userId: String(req.params.id),
      matchId,
    }).lean();

    if (existingPrediction) {
      return res.status(200).json({
        ...existingPrediction,
        id: String(existingPrediction.legacyId || existingPrediction._id),
        _id: String(existingPrediction.legacyId || existingPrediction._id),
      });
    }

    const prediction = await UserPrediction.create({
      userId: String(req.params.id),
      matchId,
      predictedResult,
      createdOn: new Date().toISOString(),
    });

    return res.status(201).json({
      ...prediction.toObject(),
      id: String(prediction.legacyId || prediction._id),
      _id: String(prediction.legacyId || prediction._id),
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message:
        status === 404
          ? "Mac bulunamadi"
          : status === 503
            ? "Mac durumu su anda dogrulanamiyor. Lutfen biraz sonra tekrar deneyin."
            : "Tahmin kaydedilemedi",
=======
  if (existingPrediction) {
    return res.status(200).json({
      ...existingPrediction,
      id: String(existingPrediction.legacyId || existingPrediction._id),
      _id: String(existingPrediction.legacyId || existingPrediction._id),
>>>>>>> 4b5d01481e6cc1f2dfd2c90ec5cd2cb1512a2634
    });
  }

  const prediction = await UserPrediction.create({
    userId: String(req.params.id),
    matchId,
    predictedResult: req.body.predictedResult,
    createdOn: new Date().toISOString(),
  });

  return res.status(201).json({
    ...prediction.toObject(),
    id: String(prediction.legacyId || prediction._id),
    _id: String(prediction.legacyId || prediction._id),
  });
};

exports.deleteUserPrediction = async (req, res) => {
  if (!requireSameUser(req, res)) return;

  try {
    const predictionId = String(req.params.predictionId || "").trim();
    const filters = [{ legacyId: predictionId }];
    if (/^[a-f0-9]{24}$/i.test(predictionId)) {
      filters.push({ _id: predictionId });
    }

    const deleted = await UserPrediction.findOneAndDelete({
      userId: String(req.params.id),
      $or: filters,
    });

    if (!deleted) {
      await UserPrediction.deleteOne({
        userId: String(req.params.id),
        legacyId: predictionId,
      });
    }

    return res.json({ message: "Tahmin kalici olarak silindi" });
  } catch (error) {
    return res.status(500).json({ message: "Silme hatasi" });
  }
};
