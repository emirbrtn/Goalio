const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/predictionController");

router.get("/hero/:matchId", controller.getHeroPrediction);
router.get("/:matchId", auth, controller.getMatchPrediction);
router.post("/generate", auth, controller.generatePrediction);

module.exports = router;
