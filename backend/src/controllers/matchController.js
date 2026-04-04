const { getLeagueByKey } = require("../utils/leagueConfig");
const { normalizeMatchState } = require("../utils/matchState");

const memoryCache = {};
const CACHE_TIME_MS = 2 * 60 * 1000;
const LIVE_MATCH_MAX_WINDOW_MS = 150 * 60 * 1000;
const EXTENDED_LIVE_MATCH_MAX_WINDOW_MS = 210 * 60 * 1000;
const DEFAULT_MAX_PAGES = 6;

async function fetchSportsmonksPage(endpoint, page = 1) {
  const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();

  if (!token) {
    console.log("SPORTSMONKS_API_TOKEN eksik");
    return { data: [], hasMore: false };
  }

  const includes = "include=participants;scores;state;league;events.type;currentPeriod";
  const pageQuery = page > 1 ? `&page=${page}` : "";
  const url = endpoint.includes("?")
    ? `https://api.sportmonks.com/v3/football/${endpoint}&api_token=${token}&${includes}${pageQuery}`
    : `https://api.sportmonks.com/v3/football/${endpoint}?api_token=${token}&${includes}${pageQuery}`;

  try {
    console.log("SportMonks istek:", endpoint, "page:", page);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("SportMonks response hata:", response.status, errorText);
      return { data: [], hasMore: false };
    }

    const json = await response.json();
    const data = Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];

    console.log(
      "SportMonks veri sayisi:",
      Array.isArray(data) ? data.length : 0,
      "endpoint:",
      endpoint,
      "page:",
      page
    );

    return {
      data,
      hasMore: Boolean(json?.pagination?.has_more),
    };
  } catch (error) {
    console.log("SportMonks fetch exception:", error.message);
    return { data: [], hasMore: false };
  }
}

async function fetchFromSportsmonks(endpoint, options = {}) {
  const { maxPages = 1 } = options;
  const cacheKey = `${endpoint}::pages=${maxPages}`;
  const now = Date.now();

  if (memoryCache[cacheKey] && now - memoryCache[cacheKey].time < CACHE_TIME_MS) {
    return memoryCache[cacheKey].data;
  }

  const collected = [];

  for (let page = 1; page <= Math.max(1, maxPages); page += 1) {
    const { data, hasMore } = await fetchSportsmonksPage(endpoint, page);
    collected.push(...data);

    if (!hasMore) {
      break;
    }
  }

  memoryCache[cacheKey] = { data: collected, time: now };
  return collected;
}

function mapSportsmonksMatch(match) {
  if (!match) return null;

  const { minute, extraMinute } = extractLiveMinute(match);

  const homeTeamData =
    match.participants?.find((participant) => participant.meta?.location === "home") ||
    match.participants?.[0] ||
    {};

  const awayTeamData =
    match.participants?.find((participant) => participant.meta?.location === "away") ||
    match.participants?.[1] ||
    {};

  const homeScoreObj =
    match.scores?.find(
      (score) => score.participant_id === homeTeamData.id && score.description === "CURRENT"
    ) || {};

  const awayScoreObj =
    match.scores?.find(
      (score) => score.participant_id === awayTeamData.id && score.description === "CURRENT"
    ) || {};

  const state = match.state?.state || "NS";
  const status = normalizeMatchState(state);

  return {
    _id: String(match.id),
    leagueId: String(match.league_id || ""),
    league: match.league?.name || "Bilinmiyor",
    homeTeam: {
      _id: String(homeTeamData.id || ""),
      name: homeTeamData.name || "Ev Sahibi",
      logo: homeTeamData.image_path || "",
    },
    awayTeam: {
      _id: String(awayTeamData.id || ""),
      name: awayTeamData.name || "Deplasman",
      logo: awayTeamData.image_path || "",
    },
    status,
    rawState: state,
    minute,
    extraMinute,
    date: match.starting_at || new Date().toISOString(),
    startTime: match.starting_at || new Date().toISOString(),
    score: {
      home: status === "scheduled" ? null : homeScoreObj.score?.goals ?? 0,
      away: status === "scheduled" ? null : awayScoreObj.score?.goals ?? 0,
    },
    sportsmonkData: match,
  };
}

function firstNumericValue(values = []) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}

function extractLiveMinute(match) {
  return {
    minute: firstNumericValue([
      match?.currentPeriod?.minutes,
      match?.currentPeriod?.minute,
      match?.minute,
      match?.time?.minute,
      match?.state?.minute,
      match?.state?.clock?.minute,
      match?.periods?.current?.minute,
    ]),
    extraMinute: firstNumericValue([
      match?.extra_minute,
      match?.time?.extra_minute,
      match?.time?.added_time,
      match?.state?.extra_minute,
      match?.state?.added_time,
      match?.state?.clock?.extra_minute,
      match?.periods?.current?.extra_minute,
    ]),
  };
}

function parseMatchDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized);

  const candidate =
    !hasTimezone && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(normalized)
      ? `${normalized}Z`
      : normalized;

  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRawMatchState(match) {
  return String(match?.rawState || match?.sportsmonkData?.state?.state || "")
    .trim()
    .toUpperCase();
}

function getLiveMatchWindowMs(rawState) {
  if (rawState.includes("ET") || rawState.includes("PEN")) {
    return EXTENDED_LIVE_MATCH_MAX_WINDOW_MS;
  }

  return LIVE_MATCH_MAX_WINDOW_MS;
}

function isActiveLiveMatch(match) {
  if (!match || match.status !== "live") return false;

  const startedAt =
    parseMatchDate(
      match.startTime || match.date || match.starting_at || match?.sportsmonkData?.starting_at
    )?.getTime() || 0;

  if (!startedAt) return true;

  return Date.now() - startedAt <= getLiveMatchWindowMs(getRawMatchState(match));
}

function paginate(items, page = 1, limit = 100) {
  const start = (Number(page) - 1) * Number(limit);
  return Array.isArray(items) ? items.slice(start, start + Number(limit)) : [];
}

function sortByStartTime(items, direction = "asc") {
  const factor = direction === "desc" ? -1 : 1;

  return [...items].sort((a, b) => {
    const aTime = new Date(a.startTime || a.date || 0).getTime();
    const bTime = new Date(b.startTime || b.date || 0).getTime();
    return (aTime - bTime) * factor;
  });
}

function filterByLeague(matches, leagueQuery) {
  if (!leagueQuery) return matches;

  const leagueConfig = getLeagueByKey(leagueQuery);

  if (leagueConfig) {
    return matches.filter(
      (match) =>
        String(match.leagueId) === String(leagueConfig.id) ||
        String(match.league || "").toLowerCase().includes(leagueConfig.name.toLowerCase())
    );
  }

  const normalized = String(leagueQuery).toLowerCase();

  return matches.filter(
    (match) =>
      String(match.leagueId) === normalized ||
      String(match.league || "").toLowerCase().includes(normalized)
  );
}

exports.listMatches = async (req, res) => {
  try {
    const start = new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0];
    const end = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];

    let apiMatches = await fetchFromSportsmonks(`fixtures/between/${start}/${end}`, {
      maxPages: DEFAULT_MAX_PAGES,
    });
    if (!Array.isArray(apiMatches)) apiMatches = apiMatches ? [apiMatches] : [];

    let mapped = apiMatches.map(mapSportsmonksMatch).filter(Boolean);
    mapped = filterByLeague(mapped, req.query.league);

    return res.json(paginate(sortByStartTime(mapped), req.query.page, req.query.limit));
  } catch (error) {
    console.log("listMatches hata:", error.message);
    return res.status(500).json({ message: "API Hatasi" });
  }
};

exports.listLiveMatches = async (req, res) => {
  try {
    let apiMatches = await fetchFromSportsmonks("livescores/inplay");
    if (!Array.isArray(apiMatches)) apiMatches = apiMatches ? [apiMatches] : [];

    const liveMatches = filterByLeague(
      apiMatches.map(mapSportsmonksMatch).filter(isActiveLiveMatch),
      req.query.league
    );

    return res.json(paginate(sortByStartTime(liveMatches), req.query.page, req.query.limit));
  } catch (error) {
    console.log("listLiveMatches hata:", error.message);
    return res.status(500).json({ message: "Canli API Hatasi" });
  }
};

exports.listHistoryMatches = async (req, res) => {
  try {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0];

    let apiMatches = await fetchFromSportsmonks(`fixtures/between/${start}/${end}`, {
      maxPages: DEFAULT_MAX_PAGES,
    });
    if (!Array.isArray(apiMatches)) apiMatches = apiMatches ? [apiMatches] : [];

    const history = filterByLeague(
      apiMatches.map(mapSportsmonksMatch).filter((match) => match && match.status === "finished"),
      req.query.league
    );

    return res.json(paginate(sortByStartTime(history, "desc"), req.query.page, req.query.limit));
  } catch (error) {
    console.log("listHistoryMatches hata:", error.message);
    return res.status(500).json({ message: "Gecmis API Hatasi" });
  }
};

exports.searchMatches = async (req, res) => {
  try {
    if (!req.query.q) {
      return res.status(400).json({ message: "Arama parametresi gerekli" });
    }

    const term = String(req.query.q).trim().toLowerCase();
    const rangeStart = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const rangeEnd = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    let historicMatches = await fetchFromSportsmonks(
      `fixtures/search/${encodeURIComponent(req.query.q)}`,
      { maxPages: 2 }
    );
    let currentMatches = await fetchFromSportsmonks(`fixtures/between/${rangeStart}/${rangeEnd}`, {
      maxPages: DEFAULT_MAX_PAGES,
    });

    if (!Array.isArray(historicMatches)) historicMatches = historicMatches ? [historicMatches] : [];
    if (!Array.isArray(currentMatches)) currentMatches = currentMatches ? [currentMatches] : [];

    const combined = [...historicMatches, ...currentMatches]
      .map(mapSportsmonksMatch)
      .filter((match) => {
        if (!match) return false;

        return [match.homeTeam?.name, match.awayTeam?.name, match.league].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );
      });

    const uniqueMatches = Array.from(
      new Map(combined.map((match) => [match._id, match])).values()
    );

    return res.json(
      paginate(sortByStartTime(uniqueMatches, "desc"), req.query.page, req.query.limit)
    );
  } catch (error) {
    console.log("searchMatches hata:", error.message);
    return res.status(500).json({ message: "Arama API Hatasi" });
  }
};

exports.updateMatchScore = async (req, res) => {
  return res.json({ message: "Okuma modu aktif" });
};

exports.debugSportsApi = async (req, res) => {
  return res.json({ status: "Aktif" });
};

exports.getMatch = async (req, res) => {
  try {
    const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();

    if (!token) {
      console.log("SPORTSMONKS_API_TOKEN eksik - getMatch");
      return res.status(500).json({ message: "SPORTSMONKS_API_TOKEN eksik" });
    }

    const includes =
      "include=participants;scores;league;state;statistics.type;lineups.player;events.type;coaches;currentPeriod";

    const response = await fetch(
      `https://api.sportmonks.com/v3/football/fixtures/${req.params.matchId}?api_token=${token}&${includes}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("getMatch SportMonks hata:", response.status, errorText);
      return res.status(404).json({ message: "Mac bulunamadi" });
    }

    const matchData = (await response.json()).data;
    if (!matchData) return res.status(404).json({ message: "Mac bulunamadi" });

    const homeTeamData =
      matchData.participants?.find((participant) => participant.meta?.location === "home") ||
      matchData.participants?.[0] ||
      {};

    const awayTeamData =
      matchData.participants?.find((participant) => participant.meta?.location === "away") ||
      matchData.participants?.[1] ||
      {};

    const homeScoreObj =
      matchData.scores?.find(
        (score) => score.participant_id === homeTeamData.id && score.description === "CURRENT"
      ) || {};

    const awayScoreObj =
      matchData.scores?.find(
        (score) => score.participant_id === awayTeamData.id && score.description === "CURRENT"
      ) || {};

    const homeCoach =
      matchData.coaches?.find(
        (coach) => String(coach.meta?.participant_id || "") === String(homeTeamData.id || "")
      ) || null;

    const awayCoach =
      matchData.coaches?.find(
        (coach) => String(coach.meta?.participant_id || "") === String(awayTeamData.id || "")
      ) || null;

    const { minute, extraMinute } = extractLiveMinute(matchData);

    const state = matchData.state?.state || "NS";
    const status = normalizeMatchState(state);

    return res.json({
      _id: String(matchData.id),
      league: matchData.league?.name || "Bilinmiyor",
      status,
      rawState: state,
      minute,
      extraMinute,
      date: matchData.starting_at || new Date().toISOString(),
      startTime: matchData.starting_at || new Date().toISOString(),
      score: {
        home: status === "scheduled" ? null : homeScoreObj.score?.goals ?? 0,
        away: status === "scheduled" ? null : awayScoreObj.score?.goals ?? 0,
      },
      homeTeam: {
        _id: String(homeTeamData.id || ""),
        name: homeTeamData.name || "Ev Sahibi",
        logo: homeTeamData.image_path || "",
        coach: homeCoach
          ? {
              id: String(homeCoach.id || ""),
              name: homeCoach.display_name || homeCoach.name || "Coach",
              image: homeCoach.image_path || "",
            }
          : null,
      },
      awayTeam: {
        _id: String(awayTeamData.id || ""),
        name: awayTeamData.name || "Deplasman",
        logo: awayTeamData.image_path || "",
        coach: awayCoach
          ? {
              id: String(awayCoach.id || ""),
              name: awayCoach.display_name || awayCoach.name || "Coach",
              image: awayCoach.image_path || "",
            }
          : null,
      },
      statistics: matchData.statistics || [],
      lineups: matchData.lineups || [],
      events: matchData.events || [],
    });
  } catch (error) {
    console.log("getMatch hata:", error.message);
    return res.status(500).json({ message: "Detay API Hatasi" });
  }
};

exports.getMatchStats = async (req, res) => {
  try {
    const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();

    if (!token) {
      console.log("SPORTSMONKS_API_TOKEN eksik - getMatchStats");
      return res.status(500).json({ message: "SPORTSMONKS_API_TOKEN eksik" });
    }

    const response = await fetch(
      `https://api.sportmonks.com/v3/football/fixtures/${req.params.matchId}?api_token=${token}&include=statistics;participants`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("getMatchStats SportMonks hata:", response.status, errorText);
      return res.json({
        possessionHome: 50,
        possessionAway: 50,
        shotsHome: 0,
        shotsAway: 0,
      });
    }

    const matchData = (await response.json()).data;
    let possessionHome = 0;
    let possessionAway = 0;
    let shotsHome = 0;
    let shotsAway = 0;

    if (matchData?.statistics) {
      const homeTeamId = matchData.participants?.find(
        (participant) => participant.meta?.location === "home"
      )?.id;

      const awayTeamId = matchData.participants?.find(
        (participant) => participant.meta?.location === "away"
      )?.id;

      const homeStats = matchData.statistics.filter((stat) => stat.participant_id === homeTeamId) || [];
      const awayStats = matchData.statistics.filter((stat) => stat.participant_id === awayTeamId) || [];

      const homePoss = homeStats.find((stat) => [54, 45, 84, 34].includes(stat.type_id));
      const awayPoss = awayStats.find((stat) => [54, 45, 84, 34].includes(stat.type_id));

      if (homePoss) possessionHome = parseInt(homePoss.data?.value || homePoss.value || 0, 10);
      if (awayPoss) possessionAway = parseInt(awayPoss.data?.value || awayPoss.value || 0, 10);

      const homeShots = homeStats.find((stat) => [42, 86, 33].includes(stat.type_id));
      const awayShots = awayStats.find((stat) => [42, 86, 33].includes(stat.type_id));

      if (homeShots) shotsHome = parseInt(homeShots.data?.value || homeShots.value || 0, 10);
      if (awayShots) shotsAway = parseInt(awayShots.data?.value || awayShots.value || 0, 10);
    }

    return res.json({
      matchId: req.params.matchId,
      possessionHome,
      possessionAway,
      shotsHome,
      shotsAway,
    });
  } catch (error) {
    console.log("getMatchStats hata:", error.message);
    return res.status(500).json({ message: "Istatistik hatasi" });
  }
};
