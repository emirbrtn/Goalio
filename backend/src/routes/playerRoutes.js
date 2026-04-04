const router = require("express").Router();
const controller = require("../controllers/playerController");

router.get("/search", controller.searchPlayers);
router.get("/:playerId", controller.getPlayerProfile);

module.exports = router;
