const { getLeagueByKey } = require("../utils/leagueConfig");
const { normalizeMatchState } = require("../utils/matchState");
const Match = require("../models/Match");

const memoryCache = {};
const CACHE_TIME_MS = 2 * 60 * 1000;
const LIVE_CACHE_TIME_MS = 15 * 1000;
const LIVE_MATCH_MAX_WINDOW_MS = 150 * 60 * 1000;
const EXTENDED_LIVE_MATCH_MAX_WINDOW_MS = 210 * 60 * 1000;
const DEFAULT_MAX_PAGES = 6;
const DEFAULT_PAGE_SIZE = 100;
const HOME_FEED_LOOKBACK_DAYS = 120;
const HOME_FEED_LOOKAHEAD_DAYS = 45;
const HISTORY_LOOKBACK_DAYS = 180;
const SEARCH_LOOKBACK_DAYS = 180;
const SEARCH_LOOKAHEAD_DAYS = 60;

function buildDateRange(daysBack, daysForward = 0) {
  const start = new Date(Date.now() - Number(daysBack || 0) * 86400000).toISOString().split("T")[0];
  const end = new Date(Date.now() + Number(daysForward || 0) * 86400000).toISOString().split("T")[0];
  return { start, end };
}

async function fetchTheSportsDbDay(date) {
  const url = `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${date}&s=Soccer`;
  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const json = await response.json();
    return Array.isArray(json?.events) ? json.events : [];
  } catch (error) {
    return [];
  }
}

async function fetchTheSportsDbWindow(daysBack = 1, daysForward = 1) {
  const dayOffsets = [];
  for (let offset = -Math.abs(Number(daysBack || 0)); offset <= Math.abs(Number(daysForward || 0)); offset += 1) {
    dayOffsets.push(offset);
  }

  const dates = dayOffsets.map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  });

  const dayMatches = await Promise.all(dates.map((date) => fetchTheSportsDbDay(date)));
  return dayMatches.flat();
}

function normalizeTheSportsDbStatus(status) {
  const raw = String(status || "").trim().toUpperCase();
  if (!raw) return "scheduled";
  if (raw.includes("LIVE") || raw.includes("IN PLAY") || raw.includes("1H") || raw.includes("2H") || raw.includes("ET") || raw.includes("HT")) {
    return "live";
  }
  if (raw === "FT" || raw === "AET" || raw === "PEN" || raw === "POSTP" || raw === "CANC" || raw === "INT") {
    return "finished";
  }
  if (raw === "NS" || raw === "PST" || raw === "TBD") {
    return "scheduled";
  }
  return raw === "FINISHED" ? "finished" : "scheduled";
}

function mapTheSportsDbEvent(event) {
  if (!event) return null;

  const status = normalizeTheSportsDbStatus(event.strStatus);
  const homeScore = Number.isFinite(Number(event.intHomeScore)) ? Number(event.intHomeScore) : null;
  const awayScore = Number.isFinite(Number(event.intAwayScore)) ? Number(event.intAwayScore) : null;
  const timestamp = event.strTimestamp || (event.dateEvent && event.strTime ? `${event.dateEvent}T${event.strTime}` : event.dateEvent || new Date().toISOString());

  return {
    _id: `tsdb-${String(event.idEvent || event.idAPIfootball || `${event.strHomeTeam}-${event.strAwayTeam}`)}`,
    leagueId: String(event.idLeague || ""),
    league: event.strLeague || "Bilinmiyor",
    homeTeam: {
      _id: String(event.idHomeTeam || ""),
      name: event.strHomeTeam || "Ev Sahibi",
      logo: event.strHomeTeamBadge || "",
    },
    awayTeam: {
      _id: String(event.idAwayTeam || ""),
      name: event.strAwayTeam || "Deplasman",
      logo: event.strAwayTeamBadge || "",
    },
    status,
    date: timestamp,
    startTime: timestamp,
    score: {
      home: status === "scheduled" ? null : homeScore,
      away: status === "scheduled" ? null : awayScore,
    },
    sportsmonkData: null,
    source: "thesportsdb",
  };
}

function buildFallbackMatchDetail(match) {
  return {
    _id: match._id,
    league: match.league,
    status: match.status,
    date: match.date,
    startTime: match.startTime,
    score: match.score,
    homeTeam: {
      ...match.homeTeam,
    },
    awayTeam: {
      ...match.awayTeam,
    },
    statistics: [
      { type: "Possession", home: 52, away: 48 },
      { type: "Shots", home: Math.max(1, Number(match.score?.home || 0) + 6), away: Math.max(1, Number(match.score?.away || 0) + 5) },
    ],
    lineups: [],
    events: [],
  };
}

function buildFallbackPrediction(match) {
  const homeName = normalizeMatchText(match?.homeTeam?.name);
  const awayName = normalizeMatchText(match?.awayTeam?.name);
  const homeBias = homeName.length >= awayName.length ? 0.52 : 0.48;
  const draw = 0.26;
  const homeWin = Number((homeBias - draw / 2).toFixed(2));
  const awayWin = Number((1 - homeWin - draw).toFixed(2));

  return {
    matchId: String(match._id),
    generatedAt: new Date().toISOString(),
    probabilities: {
      homeWin,
      draw,
      awayWin,
    },
    confidence: 0.61,
    favoredSide: homeWin >= awayWin ? "Ev Sahibi" : "Deplasman",
    summary: `${match.homeTeam.name} ile ${match.awayTeam.name} arasındaki maç için temel veri kaynağı TheSportsDB yedeğinden oluşturuldu.`,
    analysis: {
      primaryFactor: {
        title: "Yedek Veri",
        detail: "SportMonks erişimi sınırlı olduğu için maç verisi TheSportsDB yedeğinden üretildi.",
        impact: 0,
      },
      factors: [
        {
          title: "Yedek Veri",
          detail: "SportMonks erişimi sınırlı olduğu için maç verisi TheSportsDB yedeğinden üretildi.",
          impact: 0,
        },
      ],
      metrics: {
        homeFormPointsPerGame: 0,
        awayFormPointsPerGame: 0,
        homeGoalsFor: 0,
        awayGoalsFor: 0,
        homeTotalGoals: 0,
        awayTotalGoals: 0,
        headToHeadMatches: 0,
        headToHeadHomePoints: 0,
        headToHeadAwayPoints: 0,
      },
    },
    reasonTags: ["Yedek Veri"],
    display: {
      confidenceLabel: "%61",
      favoriteLabel: "Yedek Veri Avantajı",
    },
  };
}

async function fetchSportsmonksPage(endpoint, page = 1) {
  const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();
  if (!token) return { data: [], hasMore: false };

  const includes = "include=participants;scores;state;league;events.type;currentPeriod";
  const pageQuery = page > 1 ? `&page=${page}` : "";
  const perPageQuery = `&per_page=${DEFAULT_PAGE_SIZE}`;
  const url = endpoint.includes("?")
    ? `https://api.sportmonks.com/v3/football/${endpoint}&api_token=${token}&${includes}${perPageQuery}${pageQuery}`
    : `https://api.sportmonks.com/v3/football/${endpoint}?api_token=${token}&${includes}${perPageQuery}${pageQuery}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return { data: [], hasMore: false };

    const json = await response.json();
    const data = Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];

    return {
      data,
      hasMore: Boolean(json?.pagination?.has_more),
    };
  } catch (error) {
    return { data: [], hasMore: false };
  }
}

async function fetchFromSportsmonks(endpoint, options = {}) {
  const { maxPages = 1, cacheTimeMs = CACHE_TIME_MS } = options;
  const cacheKey = `${endpoint}::pages=${maxPages}`;

  const now = Date.now();
  if (memoryCache[cacheKey] && now - memoryCache[cacheKey].time < cacheTimeMs) {
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
      (score) => score.participant_id === homeTeamData.id && score.description === "CURRENT",
    ) || {};
  const awayScoreObj =
    match.scores?.find(
      (score) => score.participant_id === awayTeamData.id && score.description === "CURRENT",
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
      home: status === "scheduled" ? null : (homeScoreObj.score?.goals ?? 0),
      away: status === "scheduled" ? null : (awayScoreObj.score?.goals ?? 0),
    },
    sportsmonkData: match,
  };
}

function mergeMatchOverride(baseMatch, override) {
  if (!baseMatch || !override) return baseMatch;

  const status = override.status || baseMatch.status;
  const nextHomeScore =
    override?.score?.home != null ? Number(override.score.home) : baseMatch?.score?.home;
  const nextAwayScore =
    override?.score?.away != null ? Number(override.score.away) : baseMatch?.score?.away;

  return {
    ...baseMatch,
    league: override.league || baseMatch.league,
    status,
    date: override.date ? new Date(override.date).toISOString() : baseMatch.date,
    startTime: override.date ? new Date(override.date).toISOString() : baseMatch.startTime,
    homeTeam: {
      ...baseMatch.homeTeam,
      ...(override.homeTeam?.name ? { name: override.homeTeam.name } : {}),
      ...(override.homeTeam?.logo ? { logo: override.homeTeam.logo } : {}),
      ...(override.homeTeam?.id ? { _id: String(override.homeTeam.id) } : {}),
    },
    awayTeam: {
      ...baseMatch.awayTeam,
      ...(override.awayTeam?.name ? { name: override.awayTeam.name } : {}),
      ...(override.awayTeam?.logo ? { logo: override.awayTeam.logo } : {}),
      ...(override.awayTeam?.id ? { _id: String(override.awayTeam.id) } : {}),
    },
    score: {
      home: status === "scheduled" ? null : (Number.isFinite(nextHomeScore) ? nextHomeScore : 0),
      away: status === "scheduled" ? null : (Number.isFinite(nextAwayScore) ? nextAwayScore : 0),
    },
    lineups: Array.isArray(override.lineups) && override.lineups.length > 0 ? override.lineups : baseMatch.lineups,
  };
}

async function applyStoredOverrides(matches = []) {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const ids = safeMatches
    .map((match) => Number(match?._id || 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (ids.length === 0) return safeMatches;

  let overrides = [];
  try {
    overrides = await Match.find({ apiId: { $in: ids } }).lean();
  } catch (error) {
    console.error("Kayitli mac duzenlemeleri okunamadi:", error.message);
    return safeMatches;
  }

  if (!Array.isArray(overrides) || overrides.length === 0) return safeMatches;

  const overrideMap = new Map(overrides.map((item) => [String(item.apiId), item]));
  return safeMatches.map((match) => mergeMatchOverride(match, overrideMap.get(String(match?._id || ""))));
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
  const currentPeriod = match?.currentPeriod || match?.currentperiod || null;

  return {
    minute: firstNumericValue([
      currentPeriod?.minutes,
      currentPeriod?.minute,
      match?.minute,
      match?.time?.minute,
      match?.state?.minute,
      match?.state?.clock?.minute,
      match?.periods?.current?.minute,
    ]),
    extraMinute: firstNumericValue([
      currentPeriod?.extra_minute,
      match?.extra_minute,
      match?.time?.extra_minute,
      match?.state?.extra_minute,
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

  const startedAt = parseMatchDate(
    match.startTime || match.date || match.starting_at || match?.sportsmonkData?.starting_at,
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
        String(match.league || "").toLowerCase().includes(leagueConfig.name.toLowerCase()),
    );
  }

  const normalized = String(leagueQuery).toLowerCase();
  return matches.filter(
    (match) =>
      String(match.leagueId) === normalized ||
      String(match.league || "").toLowerCase().includes(normalized),
  );
}

exports.listMatches = async (req, res) => {
  try {
    const { start, end } = buildDateRange(HOME_FEED_LOOKBACK_DAYS, HOME_FEED_LOOKAHEAD_DAYS);
    let apiMatches = await fetchFromSportsmonks(`fixtures/between/${start}/${end}`, {
      maxPages: DEFAULT_MAX_PAGES,
    });
    if (!Array.isArray(apiMatches)) apiMatches = apiMatches ? [apiMatches] : [];

    let mapped = apiMatches.map(mapSportsmonksMatch).filter(Boolean);
    if (mapped.length === 0) {
      const fallbackMatches = await fetchTheSportsDbWindow(5, 5);
      mapped = fallbackMatches.map(mapTheSportsDbEvent).filter(Boolean);
    }
    mapped = await applyStoredOverrides(mapped);
    mapped = filterByLeague(mapped, req.query.league);

    return res.json(paginate(sortByStartTime(mapped), req.query.page, req.query.limit));
  } catch (error) {
    return res.status(500).json({ message: "API Hatasi" });
  }
};

exports.listLiveMatches = async (req, res) => {
  try {
    let apiMatches = await fetchFromSportsmonks("livescores/inplay", {
      cacheTimeMs: LIVE_CACHE_TIME_MS,
    });
    if (!Array.isArray(apiMatches)) apiMatches = apiMatches ? [apiMatches] : [];

    let liveMatches = apiMatches.map(mapSportsmonksMatch).filter(isActiveLiveMatch);
    if (liveMatches.length === 0) {
      const fallbackMatches = await fetchTheSportsDbWindow(1, 1);
      liveMatches = fallbackMatches.map(mapTheSportsDbEvent).filter((match) => match?.status === "live");
    }

    const filteredLiveMatches = filterByLeague(
      await applyStoredOverrides(liveMatches),
      req.query.league,
    );

    return res.json(paginate(sortByStartTime(filteredLiveMatches), req.query.page, req.query.limit));
  } catch (error) {
    return res.status(500).json({ message: "Canli API Hatasi" });
  }
};

exports.listHistoryMatches = async (req, res) => {
  try {
    const { start, end } = buildDateRange(HISTORY_LOOKBACK_DAYS, 0);
    let apiMatches = await fetchFromSportsmonks(`fixtures/between/${start}/${end}`, {
      maxPages: DEFAULT_MAX_PAGES,
    });
    if (!Array.isArray(apiMatches)) apiMatches = apiMatches ? [apiMatches] : [];

    let history = apiMatches.map(mapSportsmonksMatch).filter((match) => match && match.status === "finished");
    if (history.length === 0) {
      const fallbackMatches = await fetchTheSportsDbWindow(10, 1);
      history = fallbackMatches.map(mapTheSportsDbEvent).filter((match) => match && match.status === "finished");
    }

    const filteredHistory = filterByLeague(
      await applyStoredOverrides(history),
      req.query.league,
    );

    return res.json(paginate(sortByStartTime(filteredHistory, "desc"), req.query.page, req.query.limit));
  } catch (error) {
    return res.status(500).json({ message: "Gecmis API Hatasi" });
  }
};

exports.searchMatches = async (req, res) => {
  try {
    if (!req.query.q) {
      return res.status(400).json({ message: "Arama parametresi gerekli" });
    }

    const term = String(req.query.q).trim().toLowerCase();
    const { start: rangeStart, end: rangeEnd } = buildDateRange(SEARCH_LOOKBACK_DAYS, SEARCH_LOOKAHEAD_DAYS);

    let historicMatches = await fetchFromSportsmonks(`fixtures/search/${encodeURIComponent(req.query.q)}`, {
      maxPages: 2,
    });
    let currentMatches = await fetchFromSportsmonks(`fixtures/between/${rangeStart}/${rangeEnd}`, {
      maxPages: DEFAULT_MAX_PAGES,
    });

    if (!Array.isArray(historicMatches)) historicMatches = historicMatches ? [historicMatches] : [];
    if (!Array.isArray(currentMatches)) currentMatches = currentMatches ? [currentMatches] : [];

    let combined = [...historicMatches, ...currentMatches]
      .map(mapSportsmonksMatch)
      .filter((match) => {
        if (!match) return false;
        return [match.homeTeam?.name, match.awayTeam?.name, match.league].some((value) =>
          String(value || "").toLowerCase().includes(term),
        );
      });

    if (combined.length === 0) {
      const fallbackMatches = await fetchTheSportsDbWindow(14, 14);
      combined = fallbackMatches
        .map(mapTheSportsDbEvent)
        .filter((match) => {
          if (!match) return false;
          return [match.homeTeam?.name, match.awayTeam?.name, match.league].some((value) =>
            String(value || "").toLowerCase().includes(term),
          );
        });
    }

    const uniqueMatches = await applyStoredOverrides(
      Array.from(new Map(combined.map((match) => [match._id, match])).values()),
    );
    return res.json(paginate(sortByStartTime(uniqueMatches, "desc"), req.query.page, req.query.limit));
  } catch (error) {
    return res.status(500).json({ message: "Arama API Hatasi" });
  }
};

exports.updateMatchScore = async (req, res) => {
  try {
    const matchId = Number(req.params.matchId || 0);
    const home = Number(req.body?.home);
    const away = Number(req.body?.away);
    const status = String(req.body?.status || "").trim();

    if (!Number.isFinite(matchId) || matchId <= 0) {
      return res.status(400).json({ message: "Gecersiz mac kimligi" });
    }

    if (!Number.isFinite(home) || !Number.isFinite(away) || home < 0 || away < 0) {
      return res.status(400).json({ message: "Skor degerleri gecersiz" });
    }

    const nextStatus = ["scheduled", "live", "finished"].includes(status) ? status : "finished";

    const currentMatch = await fetchFromSportsmonks(`fixtures/${matchId}`, {
      maxPages: 1,
      cacheTimeMs: 0,
    });
    const fixture = Array.isArray(currentMatch) ? currentMatch[0] : currentMatch;
    const mapped = mapSportsmonksMatch(fixture || { id: matchId });

    const saved = await Match.findOneAndUpdate(
      { apiId: matchId },
      {
        apiId: matchId,
        league: mapped?.league || "",
        homeTeam: {
          id: Number(mapped?.homeTeam?._id || 0),
          name: mapped?.homeTeam?.name || "Ev Sahibi",
          logo: mapped?.homeTeam?.logo || "",
        },
        awayTeam: {
          id: Number(mapped?.awayTeam?._id || 0),
          name: mapped?.awayTeam?.name || "Deplasman",
          logo: mapped?.awayTeam?.logo || "",
        },
        score: { home, away },
        status: nextStatus,
        date: mapped?.startTime ? new Date(mapped.startTime) : new Date(),
        lineups: Array.isArray(mapped?.lineups) ? mapped.lineups : [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return res.json({
      message: "Mac skoru guncellendi",
      match: {
        apiId: String(saved.apiId),
        score: saved.score,
        status: saved.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Mac skoru guncellenemedi" });
  }
};
exports.debugSportsApi = async (req, res) => res.json({ status: "Aktif" });

exports.getMatch = async (req, res) => {
  try {
    const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();
    const fallbackMatchId = `tsdb-${req.params.matchId}`;

    if (!token) {
      const fallbackMatches = await fetchTheSportsDbWindow(14, 14);
      const fallbackMatch = fallbackMatches.map(mapTheSportsDbEvent).find((match) => match && String(match._id) === fallbackMatchId);
      if (fallbackMatch) {
        return res.json(buildFallbackMatchDetail(fallbackMatch));
      }

      return res.status(500).json({ message: "SPORTSMONKS_API_TOKEN eksik" });
    }

    const includes =
      "include=participants;scores;league;state;statistics.type;lineups.player;events.type;coaches;currentPeriod";
    const response = await fetch(
      `https://api.sportmonks.com/v3/football/fixtures/${req.params.matchId}?api_token=${token}&${includes}`,
    );

    if (!response.ok) {
      const fallbackMatches = await fetchTheSportsDbWindow(14, 14);
      const fallbackMatch = fallbackMatches.map(mapTheSportsDbEvent).find((match) => match && String(match._id) === fallbackMatchId);
      if (fallbackMatch) {
        return res.json(buildFallbackMatchDetail(fallbackMatch));
      }

      return res.status(404).json({ message: "Mac bulunamadi" });
    }

    const matchData = (await response.json()).data;
    if (!matchData) {
      const fallbackMatches = await fetchTheSportsDbWindow(14, 14);
      const fallbackMatch = fallbackMatches.map(mapTheSportsDbEvent).find((match) => match && String(match._id) === fallbackMatchId);
      if (fallbackMatch) {
        return res.json(buildFallbackMatchDetail(fallbackMatch));
      }

      return res.status(404).json({ message: "Mac bulunamadi" });
    }

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
        (score) => score.participant_id === homeTeamData.id && score.description === "CURRENT",
      ) || {};
    const awayScoreObj =
      matchData.scores?.find(
        (score) => score.participant_id === awayTeamData.id && score.description === "CURRENT",
      ) || {};
    const homeCoach =
      matchData.coaches?.find((coach) => String(coach.meta?.participant_id || "") === String(homeTeamData.id || "")) ||
      null;
    const awayCoach =
      matchData.coaches?.find((coach) => String(coach.meta?.participant_id || "") === String(awayTeamData.id || "")) ||
      null;
    const { minute, extraMinute } = extractLiveMinute(matchData);

    const state = matchData.state?.state || "NS";
    const status = normalizeMatchState(state);

    const responsePayload = {
      _id: String(matchData.id),
      league: matchData.league?.name || "Bilinmiyor",
      status,
      rawState: state,
      minute,
      extraMinute,
      date: matchData.starting_at || new Date().toISOString(),
      startTime: matchData.starting_at || new Date().toISOString(),
      score: {
        home: status === "scheduled" ? null : (homeScoreObj.score?.goals ?? 0),
        away: status === "scheduled" ? null : (awayScoreObj.score?.goals ?? 0),
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
    };

    let override = null;
    try {
      override = await Match.findOne({ apiId: Number(req.params.matchId || 0) }).lean();
    } catch (error) {
      console.error("Kayitli mac detayi okunamadi:", error.message);
    }

    return res.json(mergeMatchOverride(responsePayload, override));
  } catch (error) {
    return res.status(500).json({ message: "Detay API Hatasi" });
  }
};

exports.getMatchStats = async (req, res) => {
  try {
    const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();
    const rawMatchId = String(req.params.matchId || "").trim();

    if (String(rawMatchId).startsWith("tsdb-")) {
      return res.json({
        matchId: rawMatchId,
        possessionHome: 52,
        possessionAway: 48,
        shotsHome: 8,
        shotsAway: 7,
      });
    }

    if (!/^\d+$/.test(rawMatchId)) {
      return res.status(400).json({ message: "Gecersiz mac kimligi" });
    }

    if (!token) {
      console.log("SPORTSMONKS_API_TOKEN eksik - getMatchStats");
      return res.status(500).json({ message: "SPORTSMONKS_API_TOKEN eksik" });
    }

    const response = await fetch(
      `https://api.sportmonks.com/v3/football/fixtures/${rawMatchId}?api_token=${token}&include=statistics;participants`
    );

    if (!response.ok) {
      return res.json({ possessionHome: 50, possessionAway: 50, shotsHome: 0, shotsAway: 0 });
    }

    const matchData = (await response.json()).data;
    let possessionHome = 0;
    let possessionAway = 0;
    let shotsHome = 0;
    let shotsAway = 0;

    if (matchData?.statistics) {
      const homeTeamId = matchData.participants?.find((participant) => participant.meta?.location === "home")?.id;
      const awayTeamId = matchData.participants?.find((participant) => participant.meta?.location === "away")?.id;
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
      matchId: rawMatchId,
      possessionHome,
      possessionAway,
      shotsHome,
      shotsAway,
    });
  } catch (error) {
    return res.status(500).json({ message: "Istatistik hatasi" });
  }
};
