const router = require("express").Router();
const controller = require("../controllers/userController");
const auth = require("../middleware/auth");

// Auth Rotaları
router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", auth, controller.logout);

// Profil Rotaları-1
router.get("/:id", auth, controller.getUserProfile);
router.put("/:id", auth, controller.updateUserProfile);
router.delete("/:id", auth, controller.deleteUser);
router.put("/:id/password", auth, controller.changePassword);
router.put("/:id/notifications", auth, controller.updateNotificationPrefs);
router.get("/:id/notifications/history", auth, controller.listUserNotifications);
router.post("/:id/notifications/history/sync", auth, controller.syncUserNotifications);
router.put("/:id/notifications/history/read-all", auth, controller.markAllNotificationsRead);
router.delete("/:id/notifications/history/:notificationId", auth, controller.deleteUserNotification);

// Favori Rotaları
router.get("/:id/favorites", auth, controller.listFavoriteTeams);
router.post("/:id/favorites", auth, controller.addFavoriteTeam);
router.delete("/:id/favorites/:teamId", auth, controller.removeFavoriteTeam);
router.get("/:id/favorites-data", auth, controller.listUserFavoritesData);
router.put("/:id/favorites-data", auth, controller.updateUserFavoritesData);

// Tahmin Rotaları
router.get("/:id/predictions", auth, controller.listUserPredictions);
router.post("/:id/predictions", auth, controller.saveUserPrediction);
router.delete("/:id/predictions/:predictionId", auth, controller.deleteUserPrediction);

module.exports = router;
