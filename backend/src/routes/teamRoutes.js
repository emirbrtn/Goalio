const router = require("express").Router();
const controller = require("../controllers/teamController");

router.get("/leagues", controller.listLeagues);
router.get("/search", controller.searchTeams);
router.get("/league-overview/:leagueKey", controller.getLeagueOverview);
router.get("/league/:leagueKey", controller.listLeagueTeams);
router.get("/:teamId", controller.getTeam);

module.exports = router;


