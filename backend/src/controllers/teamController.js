const { getLeagueByKey, getAllLeagues } = require("../utils/leagueConfig");
const { normalizeMatchState } = require("../utils/matchState");

async function fetchSM(endpoint) {
  const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `https://api.sportmonks.com/v3/football/${endpoint}${separator}api_token=${token}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SportMonks request failed: ${response.status}`);
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("SportMonks fetch error:", error.message);
    return null;
  }
}

function mapTeam(team) {
  if (!team) return null;

  return {
    _id: String(team.id),
    name: team.name,
    logo: team.image_path || "",
  };
}

function mapLeagueFixture(fixture) {
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
  status = normalizeMatchState(state);

  return {
    _id: String(fixture.id),
    leagueId: String(fixture.league_id || ""),
    league: fixture.league?.name || "Bilinmiyor",
    startTime: fixture.starting_at || "",
    status,
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
    score: {
      home: status === "scheduled" ? null : (homeScore.score?.goals ?? 0),
      away: status === "scheduled" ? null : (awayScore.score?.goals ?? 0),
    },
  };
}

function extractTopscorerGoals(entry) {
  const directValues = [
    entry?.total,
    entry?.value,
    entry?.score?.goals,
    entry?.goals,
    entry?.count,
  ];

  for (const value of directValues) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  const details = Array.isArray(entry?.details) ? entry.details : [];
  for (const detail of details) {
    const typeCode = String(detail?.type?.code || "").toLowerCase();
    if (!typeCode.includes("goal")) continue;

    const parsed = Number(detail?.value?.total ?? detail?.value ?? 0);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}

function mapTopscorerEntry(entry) {
  const player = entry?.player || entry?.participant || {};
  const nestedTopscorer = Array.isArray(entry?.topscorer) ? entry.topscorer[0] : null;
  const team =
    entry?.team ||
    nestedTopscorer?.team ||
    nestedTopscorer?.participant ||
    entry?.participant ||
    entry?.team?.participant ||
    {};

  return {
    playerId: String(player?.id || ""),
    name: player?.display_name || player?.fullname || player?.name || "Futbolcu",
    image: player?.image_path || "",
    teamName: team?.name || "",
    teamLogo: team?.image_path || "",
    goals: extractTopscorerGoals(entry),
  };
}

function collectTopscorerEntries(payload, bucket = []) {
  if (!payload) return bucket;

  if (Array.isArray(payload)) {
    payload.forEach((item) => collectTopscorerEntries(item, bucket));
    return bucket;
  }

  if (typeof payload !== "object") {
    return bucket;
  }

  const hasScorerIdentity =
    payload?.player ||
    payload?.player_id ||
    payload?.participant ||
    payload?.participant_id;
  const hasGoalShape =
    payload?.goals !== undefined ||
    payload?.score?.goals !== undefined ||
    payload?.total !== undefined ||
    Array.isArray(payload?.details);

  if (hasScorerIdentity && hasGoalShape) {
    bucket.push(payload);
  }

  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      collectTopscorerEntries(value, bucket);
    }
  }

  return bucket;
}

async function fetchSeasonTopscorers(seasonId) {
  const seasonTopscorers = await fetchSM(
    `seasons/${seasonId}?include=topscorers.player;topscorers.team;topscorers.participant;topscorers.topscorer.team;topscorers.topscorer.participant;topscorers.details.type&filters=seasonTopscorerTypes:208`,
  );
  const includedTopscorers = collectTopscorerEntries(seasonTopscorers?.topscorers || seasonTopscorers);
  if (includedTopscorers.length > 0) {
    return includedTopscorers
      .map(mapTopscorerEntry)
      .filter((entry) => entry.playerId || entry.name);
  }

  const directTopscorers = await fetchSM(
    `topscorers/seasons/${seasonId}?include=player;team;participant;details.type&filters=seasonTopscorerTypes:208`,
  );
  const directEntries = collectTopscorerEntries(directTopscorers);
  if (directEntries.length > 0) {
    return directEntries.map(mapTopscorerEntry).filter((entry) => entry.playerId || entry.name);
  }

  const seasonFallback = await fetchSM(
    `seasons/${seasonId}?include=topscorers.player;topscorers.team;topscorers.participant;topscorers.topscorer.team;topscorers.topscorer.participant;topscorers.details.type`,
  );
  const fallbackEntries = collectTopscorerEntries(
    seasonFallback?.topscorers ||
    seasonFallback?.goalscorers ||
    seasonFallback?.aggregatedGoalscorers ||
    seasonFallback,
  );

  if (fallbackEntries.length > 0) {
    return fallbackEntries
      .map(mapTopscorerEntry)
      .filter((entry) => entry.playerId || entry.name);
  }

  return [];
}

function isGoalEvent(event) {
  const typeCode = String(event?.type?.code || event?.type?.developer_name || "").toLowerCase();
  if (!typeCode) return false;
  if (typeCode.includes("own-goal")) return false;
  if (typeCode.includes("penalty-shootout")) return false;
  return typeCode.includes("goal") || typeCode.includes("penalty");
}

function aggregateTopscorersFromFixtures(fixtures = []) {
  const scorerMap = new Map();

  for (const fixture of Array.isArray(fixtures) ? fixtures : []) {
    const participants = Array.isArray(fixture?.participants) ? fixture.participants : [];
    const events = Array.isArray(fixture?.events) ? fixture.events : [];

    for (const event of events) {
      if (!isGoalEvent(event)) continue;

      const player = event?.player || {};
      const playerId = String(event?.player_id || player?.id || "");
      const playerName = player?.display_name || player?.fullname || player?.name || event?.player_name || "";
      if (!playerId && !playerName) continue;

      const team =
        participants.find((participant) => String(participant?.id || "") === String(event?.participant_id || "")) ||
        {};
      const scorerKey = playerId || playerName.toLowerCase();
      const currentEntry = scorerMap.get(scorerKey) || {
        playerId,
        name: playerName || "Futbolcu",
        image: player?.image_path || "",
        teamName: team?.name || "",
        teamLogo: team?.image_path || "",
        goals: 0,
      };

      currentEntry.goals += 1;
      if (!currentEntry.image && player?.image_path) currentEntry.image = player.image_path;
      if (!currentEntry.teamName && team?.name) currentEntry.teamName = team.name;
      if (!currentEntry.teamLogo && team?.image_path) currentEntry.teamLogo = team.image_path;

      scorerMap.set(scorerKey, currentEntry);
    }
  }

  return [...scorerMap.values()].sort((a, b) => b.goals - a.goals);
}

async function fetchLeagueChampions(leagueId) {
  try {
    const leagueData = await fetchSM(`leagues/${leagueId}?include=seasons`);
    const seasons = Array.isArray(leagueData?.seasons) ? leagueData.seasons : [];
    const now = Date.now();
    const finishedSeasons = seasons
      .filter((season) => {
        if (season?.is_current) return false;
        const endTime = new Date(season?.finished_at || season?.ending_at || 0).getTime();
        return Number.isFinite(endTime) && endTime > 0 && endTime <= now;
      })
      .sort((a, b) => {
        const aTime = new Date(a?.finished_at || a?.ending_at || a?.starting_at || 0).getTime();
        const bTime = new Date(b?.finished_at || b?.ending_at || b?.starting_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 2);

    const championMap = new Map();
    let processedSeasons = 0;

    for (const season of finishedSeasons) {
      const standings = await fetchSM(`standings/seasons/${season.id}?include=participant`);
      const championEntry = (Array.isArray(standings) ? standings : [])
        .filter((entry) => Number(entry?.position || 0) === 1)
        .sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0))[0];

      if (!championEntry?.participant?.id) continue;
      processedSeasons += 1;

      const championId = String(championEntry.participant.id);
      const currentCount = championMap.get(championId) || {
        teamId: championId,
        name: championEntry.participant.name || "Takim",
        logo: championEntry.participant.image_path || "",
        titles: 0,
      };

      currentCount.titles += 1;
      championMap.set(championId, currentCount);
    }

    return {
      champions: [...championMap.values()].sort((a, b) => b.titles - a.titles).slice(0, 6),
      processedSeasons,
    };
  } catch (error) {
    return {
      champions: [],
      processedSeasons: 0,
    };
  }
}

exports.listLeagues = async (req, res) => {
  res.json(getAllLeagues());
};

exports.listLeagueTeams = async (req, res) => {
  try {
    const league = getLeagueByKey(req.params.leagueKey);
    if (!league) {
      return res.status(404).json({ message: "Lig bulunamadi" });
    }

    const leagueData = await fetchSM(`leagues/${league.id}?include=currentseason`);
    const currentSeasonId = leagueData?.currentseason?.id;

    if (!currentSeasonId) {
      return res.status(404).json({ message: "Lig sezonu bulunamadi" });
    }

    const standings = await fetchSM(`standings/seasons/${currentSeasonId}?include=participant`);
    const teams = (Array.isArray(standings) ? standings : [])
      .map((entry) => ({
        _id: String(entry.participant?.id || ""),
        name: entry.participant?.name || "Takim",
        logo: entry.participant?.image_path || "",
        position: entry.position || 0,
      }))
      .filter((team) => team._id)
      .sort((a, b) => a.position - b.position);

    return res.json({
      league: {
        ...league,
        seasonId: currentSeasonId,
      },
      teams,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lig takimlari alinamadi" });
  }
};

exports.getLeagueOverview = async (req, res) => {
  try {
    const league = getLeagueByKey(req.params.leagueKey);
    if (!league) {
      return res.status(404).json({ message: "Lig bulunamadi" });
    }

    const leagueData = await fetchSM(`leagues/${league.id}?include=currentseason;country`);
    const currentSeasonId = leagueData?.currentseason?.id;

    if (!currentSeasonId) {
      return res.status(404).json({ message: "Lig sezonu bulunamadi" });
    }

    const [standingsData, seasonData, topscorersData, championsData] = await Promise.all([
      fetchSM(`standings/seasons/${currentSeasonId}?include=participant;details.type`),
      fetchSM(`seasons/${currentSeasonId}?include=currentStage;fixtures.participants;fixtures.scores;fixtures.state;fixtures.league;fixtures.events.type;fixtures.events.player`),
      fetchSeasonTopscorers(currentSeasonId),
      fetchLeagueChampions(league.id),
    ]);

    const standings = (Array.isArray(standingsData) ? standingsData : [])
      .map((entry) => ({
        position: entry.position || 0,
        points: Number(entry.points || 0),
        team: {
          _id: String(entry.participant?.id || ""),
          name: entry.participant?.name || "Takim",
          logo: entry.participant?.image_path || "",
        },
      }))
      .filter((entry) => entry.team._id)
      .sort((a, b) => a.position - b.position);

    const fixtures = (Array.isArray(seasonData?.fixtures) ? seasonData.fixtures : [])
      .map(mapLeagueFixture)
      .filter(Boolean);

    const liveMatches = fixtures.filter((fixture) => fixture.status === "live");
    const upcomingMatches = fixtures
      .filter((fixture) => fixture.status === "scheduled")
      .sort((a, b) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime());
    const finishedMatches = fixtures
      .filter((fixture) => fixture.status === "finished")
      .sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());

    const fallbackTopscorers = aggregateTopscorersFromFixtures(seasonData?.fixtures);
    const finalTopscorers = ((Array.isArray(topscorersData) && topscorersData.length > 0)
      ? topscorersData
      : fallbackTopscorers)
      .sort((a, b) => Number(b.goals || 0) - Number(a.goals || 0))
      .slice(0, 6);

    return res.json({
      league: {
        ...league,
        seasonId: currentSeasonId,
        seasonName: seasonData?.name || leagueData?.currentseason?.name || "",
        country: leagueData?.country?.name || league.country,
        currentStage: seasonData?.currentStage?.name || "",
      },
      stats: {
        teamsCount: standings.length,
        totalFixtures: fixtures.length,
        liveCount: liveMatches.length,
        upcomingCount: upcomingMatches.length,
        finishedCount: finishedMatches.length,
      },
      standings,
      leaders: standings.slice(0, 5),
      topscorers: finalTopscorers,
      champions: championsData?.champions || [],
      championsCoverage: {
        processedSeasons: Number(championsData?.processedSeasons || 0),
      },
      upcomingMatches: upcomingMatches.slice(0, 6),
      recentMatches: finishedMatches.slice(0, 6),
    });
  } catch (error) {
    return res.status(500).json({ message: "Lig ozeti alinamadi" });
  }
};

exports.getTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await fetchSM(`teams/${teamId}?include=country;players.player.position`);

    if (!team) {
      return res.status(404).json({ message: "Takim bulunamadi" });
    }

    return res.json({
      _id: String(team.id),
      name: team.name,
      logo: team.image_path || "",
      country: team.country?.name || "",
      squad: (team.players || []).map((playerEntry) => ({
        id: playerEntry.player?.id,
        name: playerEntry.player?.display_name || playerEntry.player?.fullname,
        image: playerEntry.player?.image_path || "",
        position: playerEntry.player?.position?.name || "Oyuncu",
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Takim bilgisi alinamadi" });
  }
};

exports.searchTeams = async (req, res) => {
  try {
    const query = String(req.query.q || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    if (!query) {
      return res.json([]);
    }

    const teams = await fetchSM(`teams/search/${encodeURIComponent(query)}`);
    const mapped = (Array.isArray(teams) ? teams : [])
      .map(mapTeam)
      .filter(Boolean)
      .slice(0, 8);

    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ message: "Takim arama hatasi" });
  }
};
