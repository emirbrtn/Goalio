const router = require("express").Router();
const axios = require("axios");
const matchController = require("../controllers/matchController");
const { syncLeagueData } = require("../services/syncService");
const { getAllLeagues } = require("../utils/leagueConfig");

function mapFixture(fixture) {
  const homeTeam =
    fixture.participants?.find((participant) => participant.meta?.location === "home") ||
    fixture.participants?.[0] ||
    {};
  const awayTeam =
    fixture.participants?.find((participant) => participant.meta?.location === "away") ||
    fixture.participants?.[1] ||
    {};
  const homeScore =
    fixture.scores?.find((score) => score.participant_id === homeTeam.id && score.description === "CURRENT") ||
    {};
  const awayScore =
    fixture.scores?.find((score) => score.participant_id === awayTeam.id && score.description === "CURRENT") ||
    {};

  let status = "scheduled";
  const state = fixture.state?.state || "NS";
  if (["INPLAY", "HT", "ET", "PEN_LIVE"].includes(state)) status = "live";
  if (["FT", "AET", "FT_PEN"].includes(state)) status = "finished";

  return {
    _id: String(fixture.id),
    leagueId: String(fixture.league_id || ""),
    league: fixture.league?.name || "Bilinmiyor",
    homeTeam: {
      _id: String(homeTeam.id || ""),
      name: homeTeam.name || "Ev Sahibi",
      logo: homeTeam.image_path || "",
    },
    awayTeam: {
      _id: String(awayTeam.id || ""),
      name: awayTeam.name || "Deplasman",
      logo: awayTeam.image_path || "",
    },
    status,
    date: fixture.starting_at || new Date().toISOString(),
    startTime: fixture.starting_at || new Date().toISOString(),
    score: {
      home: status === "scheduled" ? null : (homeScore.score?.goals ?? 0),
      away: status === "scheduled" ? null : (awayScore.score?.goals ?? 0),
    },
  };
}

function readStandingValue(entry, code) {
  const details = Array.isArray(entry?.details) ? entry.details : [];
  const detail = details.find((item) => String(item?.type?.code || "").toLowerCase() === code);
  return Number(detail?.value?.total ?? detail?.value ?? 0);
}

function pickActiveLeagueSeason(seasons = []) {
  const supportedLeagueIds = new Set(getAllLeagues().map((league) => String(league.id)));
  const safeSeasons = Array.isArray(seasons) ? seasons : [];

  const sortByPriority = (items) =>
    [...items].sort((a, b) => {
      const aCurrent = a?.is_current ? 1 : 0;
      const bCurrent = b?.is_current ? 1 : 0;
      if (aCurrent !== bCurrent) return bCurrent - aCurrent;

      const aTime = new Date(a?.starting_at || 0).getTime();
      const bTime = new Date(b?.starting_at || 0).getTime();
      return bTime - aTime;
    });

  return (
    sortByPriority(
      safeSeasons.filter(
        (season) => season?.league?.id && supportedLeagueIds.has(String(season.league.id)),
      ),
    )[0] ||
    sortByPriority(safeSeasons)[0] ||
    null
  );
}

function pickCurrentCoach(coaches = []) {
  const safeCoaches = Array.isArray(coaches) ? coaches : [];
  if (safeCoaches.length === 0) return null;

  return (
    safeCoaches.find((coach) => coach?.active || coach?.is_active || coach?.current || coach?.is_current) ||
    safeCoaches.find((coach) => String(coach?.type || "").toLowerCase().includes("head")) ||
    safeCoaches.find((coach) => String(coach?.job || "").toLowerCase().includes("head")) ||
    safeCoaches[0]
  );
}

function normalizeCoach(coach) {
  if (!coach) return null;

  const name =
    coach.display_name ||
    coach.name ||
    coach.fullname ||
    coach.common_name ||
    "";
  const image = coach.image_path || coach.photo_path || "";

  if (!String(name || "").trim()) {
    return null;
  }

  return {
    id: String(coach.id || ""),
    name: String(name).trim(),
    image,
  };
}

async function fetchCoachFromRecentFixtures(token, fixtures = [], teamId) {
  const safeFixtures = Array.isArray(fixtures) ? fixtures : [];
  const candidateFixtures = [...safeFixtures]
    .filter((fixture) =>
      fixture?.participants?.some((participant) => String(participant?.id || "") === String(teamId || "")),
    )
    .sort((a, b) => new Date(b?.starting_at || 0).getTime() - new Date(a?.starting_at || 0).getTime())
    .slice(0, 5);

  for (const fixture of candidateFixtures) {
    try {
      const fixtureRes = await axios.get(
        `https://api.sportmonks.com/v3/football/fixtures/${fixture.id}`,
        {
          params: {
            api_token: token,
            include: "participants;coaches",
          },
        },
      );

      const fixtureData = fixtureRes.data?.data;
      const coach =
        fixtureData?.coaches?.find(
          (entry) => String(entry?.meta?.participant_id || "") === String(teamId || ""),
        ) || null;

      if (coach) {
        return coach;
      }
    } catch (error) {
      console.log("Mac uzerinden teknik direktor cekilemedi", error.message);
    }
  }

  return null;
}

async function fetchSeasonFixtures(token, seasonId) {
  if (!seasonId) return [];

  try {
    const seasonRes = await axios.get(
      `https://api.sportmonks.com/v3/football/seasons/${seasonId}`,
      {
        params: {
          api_token: token,
          include: "fixtures.participants;fixtures.scores;fixtures.state;fixtures.league;fixtures.events.type;fixtures.events.player",
        },
      },
    );

    return Array.isArray(seasonRes.data?.data?.fixtures) ? seasonRes.data.data.fixtures : [];
  } catch (error) {
    console.log("Sezon fiksturu cekilemedi", error.message);
    return [];
  }
}

function isGoalEvent(event) {
  const typeCode = String(event?.type?.code || event?.type?.developer_name || "").toLowerCase();
  if (!typeCode) return false;
  if (typeCode.includes("own-goal")) return false;
  if (typeCode.includes("penalty-shootout")) return false;
  return typeCode.includes("goal") || typeCode.includes("penalty");
}

function aggregateTeamTopScorers(fixtures = [], teamId) {
  const scorerMap = new Map();

  for (const fixture of Array.isArray(fixtures) ? fixtures : []) {
    const participants = Array.isArray(fixture?.participants) ? fixture.participants : [];
    const events = Array.isArray(fixture?.events) ? fixture.events : [];

    for (const event of events) {
      if (!isGoalEvent(event)) continue;
      if (String(event?.participant_id || "") !== String(teamId || "")) continue;

      const player = event?.player || {};
      const playerId = String(event?.player_id || player?.id || "");
      const playerName = player?.display_name || player?.fullname || player?.name || event?.player_name || "";
      if (!playerId && !playerName) continue;

      const scorerKey = playerId || playerName.toLowerCase();
      const currentScorer = scorerMap.get(scorerKey) || {
        id: playerId || scorerKey,
        name: playerName || "Futbolcu",
        image: player?.image_path || "",
        goals: 0,
      };

      currentScorer.goals += 1;
      if (!currentScorer.image && player?.image_path) {
        currentScorer.image = player.image_path;
      }

      scorerMap.set(scorerKey, currentScorer);
    }
  }

  return [...scorerMap.values()]
    .sort((a, b) => Number(b.goals || 0) - Number(a.goals || 0))
    .slice(0, 6);
}

router.get("/", matchController.listMatches);
router.get("/live", matchController.listLiveMatches);
router.get("/history", matchController.listHistoryMatches);
router.get("/search", matchController.searchMatches);
router.get("/:matchId/stats", matchController.getMatchStats);

router.get("/sync/:leagueId", async (req, res) => {
  try {
    const result = await syncLeagueData(req.params.leagueId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/team-profile/:name", async (req, res) => {
  try {
    const teamName = req.params.name;
    const token = process.env.SPORTSMONKS_API_TOKEN;

    const teamRes = await axios.get(
      `https://api.sportmonks.com/v3/football/teams/search/${encodeURIComponent(teamName)}`,
      {
        params: {
          api_token: token,
          include: "country;venue;activeseasons.league;coaches",
        },
      },
    );

    const teams = Array.isArray(teamRes.data?.data) ? teamRes.data.data : [];
    const normalizedName = String(teamName || "").trim().toLowerCase();
    const teamData =
      teams.find((team) => String(team.name || "").trim().toLowerCase() === normalizedName) || teams[0];

    if (!teamData) {
      return res.status(404).json({ message: "Takim bulunamadi" });
    }

    let detailedTeamData = teamData;
    try {
      const teamDetailRes = await axios.get(
        `https://api.sportmonks.com/v3/football/teams/${teamData.id}`,
        {
          params: {
            api_token: token,
              include: "country;venue;coach;coaches",
            },
          },
        );

      if (teamDetailRes.data?.data) {
        detailedTeamData = teamDetailRes.data.data;
      }
    } catch (error) {
      console.log("Takim detaylari cekilemedi", error.message);
    }

    let currentCoach = normalizeCoach(
      detailedTeamData?.coach ||
      teamData?.coach ||
      pickCurrentCoach(detailedTeamData?.coaches || teamData?.coaches),
    );

    let squad = [];
    try {
      const squadRes = await axios.get(`https://api.sportmonks.com/v3/football/squads/teams/${teamData.id}`, {
        params: {
          api_token: token,
          include: "player.position",
        },
      });
      squad = (Array.isArray(squadRes.data?.data) ? squadRes.data.data : []).map((entry) => ({
        id: entry.player?.id,
        name: entry.player?.display_name || entry.player?.fullname,
        image: entry.player?.image_path,
        position: entry.player?.position?.name || "-",
        jersey_number: entry.jersey_number,
      }));
    } catch (error) {
      console.log("Kadro cekilemedi", error.message);
    }

    const activeSeason = pickActiveLeagueSeason(teamData.activeseasons);

    let standings = [];
    try {
      if (activeSeason?.id) {
        const standRes = await axios.get(`https://api.sportmonks.com/v3/football/standings/seasons/${activeSeason.id}`, {
          params: {
            api_token: token,
            include: "participant;details.type",
          },
        });

        standings = (Array.isArray(standRes.data?.data) ? standRes.data.data : [])
          .map((entry) => {
            const played = readStandingValue(entry, "overall-matches-played");
            const won = readStandingValue(entry, "overall-won");
            const draw = readStandingValue(entry, "overall-draw");
            const lost = readStandingValue(entry, "overall-lost");

            return {
              position: entry.position,
              team_name: entry.participant?.name || "Takim",
              logo: entry.participant?.image_path || "",
              points: entry.points,
              played,
              won,
              draw,
              lost,
            };
          })
          .sort((a, b) => a.position - b.position);
      }
    } catch (error) {
      console.log("Puan durumu cekilemedi", error.message);
    }

    let fixturesData = [];

    const seasonFixtures = await fetchSeasonFixtures(token, activeSeason?.id);
    fixturesData = seasonFixtures
      .map(mapFixture)
      .filter(
        (fixture) =>
          String(fixture.homeTeam._id) === String(teamData.id) ||
          String(fixture.awayTeam._id) === String(teamData.id),
      );

    if (!currentCoach && seasonFixtures.length > 0) {
      currentCoach = normalizeCoach(
        await fetchCoachFromRecentFixtures(token, seasonFixtures, teamData.id),
      );
    }

    if (fixturesData.length === 0) {
      try {
        const fixtureRes = await axios.get(
          `https://api.sportmonks.com/v3/football/fixtures/search/${encodeURIComponent(teamData.name)}`,
          {
            params: {
              api_token: token,
              include: "participants;scores;state;league",
            },
          },
        );

        fixturesData = (Array.isArray(fixtureRes.data?.data) ? fixtureRes.data.data : [])
          .map(mapFixture)
          .filter(
            (fixture) =>
              String(fixture.homeTeam._id) === String(teamData.id) ||
              String(fixture.awayTeam._id) === String(teamData.id),
          );
      } catch (error) {
        console.log("Mac verileri cekilemedi", error.message);
      }

      try {
        const start = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
        const end = new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0];
        const currentRes = await axios.get(
          `https://api.sportmonks.com/v3/football/fixtures/between/${start}/${end}`,
          {
            params: {
              api_token: token,
              include: "participants;scores;state;league",
            },
          },
        );

        const currentFixtures = (Array.isArray(currentRes.data?.data) ? currentRes.data.data : [])
          .map(mapFixture)
          .filter(
            (fixture) =>
              String(fixture.homeTeam._id) === String(teamData.id) ||
              String(fixture.awayTeam._id) === String(teamData.id),
          );

        fixturesData = Array.from(
          new Map([...fixturesData, ...currentFixtures].map((fixture) => [fixture._id, fixture])).values(),
        );
      } catch (error) {
        console.log("Guncel fikstur cekilemedi", error.message);
      }
    }

    const results = [...fixturesData]
      .filter((fixture) => fixture.status === "finished")
      .sort((a, b) => new Date(b.startTime || b.date || 0) - new Date(a.startTime || a.date || 0))
      ;
    const fixtures = [...fixturesData]
      .filter((fixture) => fixture.status === "scheduled" || fixture.status === "live")
      .sort((a, b) => new Date(a.startTime || a.date || 0) - new Date(b.startTime || b.date || 0))
      ;
    const topScorers = aggregateTeamTopScorers(seasonFixtures, teamData.id);

    return res.json({
      team: {
        id: String(teamData.id),
        _id: String(teamData.id),
        name: teamData.name,
        logo: teamData.image_path || "",
        country: detailedTeamData.country?.name || teamData.country?.name || "",
        leagueName: activeSeason?.league?.name || "",
        stadium: detailedTeamData.venue?.name || teamData.venue?.name || "",
        city: detailedTeamData.venue?.city_name || teamData.venue?.city_name || "",
        capacity:
          Number(detailedTeamData.venue?.capacity || teamData.venue?.capacity) > 0
            ? Number(detailedTeamData.venue?.capacity || teamData.venue?.capacity)
            : null,
        founded:
          Number(detailedTeamData?.founded || teamData?.founded) > 0
            ? Number(detailedTeamData?.founded || teamData?.founded)
            : null,
        coach: currentCoach,
      },
      squad,
      standings,
      results,
      fixtures,
      topScorers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:matchId", matchController.getMatch);

module.exports = router;
