const playerCache = new Map();
const PLAYER_CACHE_MS = 5 * 60 * 1000;

function buildPlayerName(player) {
  if (!player) return "Futbolcu";
  return (
    player.display_name ||
    player.common_name ||
    player.fullname ||
    [player.firstname, player.lastname].filter(Boolean).join(" ") ||
    "Futbolcu"
  );
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

async function fetchSM(endpoint) {
  const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();
  if (!token) return null;

  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `https://api.sportmonks.com/v3/football/${endpoint}${separator}api_token=${token}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    return json.data ?? null;
  } catch (error) {
    return null;
  }
}

function pickTeam(player) {
  return (
    player?.team ||
    player?.latest_team ||
    (Array.isArray(player?.teams) ? player.teams[0] : null) ||
    (Array.isArray(player?.transfers) ? player.transfers[0]?.team : null) ||
    null
  );
}

function pickCurrentTeam(player) {
  const teamEntries = Array.isArray(player?.teams) ? player.teams : [];
  const datedEntries = [...teamEntries].sort((a, b) => {
    const aTime = new Date(a?.end || a?.start || 0).getTime();
    const bTime = new Date(b?.end || b?.start || 0).getTime();
    return bTime - aTime;
  });

  const activeDomestic =
    teamEntries.find((entry) => !entry?.end && entry?.team?.type === "domestic") ||
    teamEntries.find((entry) => entry?.team?.type === "domestic") ||
    teamEntries.find((entry) => !entry?.end) ||
    datedEntries[0] ||
    null;

  return activeDomestic?.team || pickTeam(player);
}

function pickPrimaryStat(statistics) {
  const safeStats = Array.isArray(statistics) ? statistics : [];
  if (safeStats.length === 0) return null;

  return [...safeStats].sort((a, b) => {
    const aCurrent = a?.season?.is_current ? 1 : 0;
    const bCurrent = b?.season?.is_current ? 1 : 0;
    if (aCurrent !== bCurrent) return bCurrent - aCurrent;

    const aTime = new Date(a?.season?.finished_at || a?.season?.ending_at || a?.season?.starting_at || 0).getTime();
    const bTime = new Date(b?.season?.finished_at || b?.season?.ending_at || b?.season?.starting_at || 0).getTime();
    return bTime - aTime;
  })[0];
}

function readStatValue(entry) {
  if (entry?.value?.total != null) return entry.value.total;
  if (entry?.value?.average != null) return entry.value.average;
  if (entry?.value != null && typeof entry.value !== "object") return entry.value;
  if (entry?.data?.value != null) return entry.data.value;
  if (entry?.total != null) return entry.total;
  return null;
}

function toNumericValue(value) {
  if (value == null || value === "") return null;
  const numeric = Number(String(value).replace("%", "").replace(",", "."));
  return Number.isNaN(numeric) ? null : numeric;
}

function roundStat(value) {
  if (value == null || Number.isNaN(value)) return null;
  return Number(value.toFixed(2));
}

function createEmptyStats() {
  return {
    appearances: null,
    lineups: null,
    minutes: null,
    goals: null,
    assists: null,
    passes: null,
    passAccuracy: null,
    rating: null,
    yellowCards: null,
    redCards: null,
  };
}

function extractStats(statistics, options = {}) {
  const summary = {
    ...createEmptyStats(),
  };
  let ratingTotal = 0;
  let ratingCount = 0;
  let passAccuracyWeightedTotal = 0;
  let passAccuracyWeight = 0;
  let passAccuracyFallbackTotal = 0;
  let passAccuracyFallbackCount = 0;

  for (const statGroup of Array.isArray(statistics) ? statistics : []) {
    let groupPasses = null;
    let groupPassAccuracy = null;
    let groupRating = null;

    for (const detail of Array.isArray(statGroup?.details) ? statGroup.details : []) {
      const code = String(detail?.type?.code || detail?.type?.developer_name || "").toLowerCase();
      const value = toNumericValue(readStatValue(detail));
      if (value == null) continue;

      switch (code) {
        case "appearances":
          summary.appearances = (summary.appearances || 0) + value;
          break;
        case "lineups":
          summary.lineups = (summary.lineups || 0) + value;
          break;
        case "minutes-played":
          summary.minutes = (summary.minutes || 0) + value;
          break;
        case "goals":
          summary.goals = (summary.goals || 0) + value;
          break;
        case "assists":
          summary.assists = (summary.assists || 0) + value;
          break;
        case "passes":
          summary.passes = (summary.passes || 0) + value;
          groupPasses = value;
          break;
        case "accurate-passes-percentage":
        case "pass-accuracy":
        case "passing-accuracy":
          groupPassAccuracy = value;
          break;
        case "rating":
          groupRating = value;
          break;
        case "yellowcards":
          summary.yellowCards = (summary.yellowCards || 0) + value;
          break;
        case "redcards":
        case "redcard":
          summary.redCards = (summary.redCards || 0) + value;
          break;
        default:
          break;
      }
    }

    if (groupPassAccuracy != null) {
      if (groupPasses != null && groupPasses > 0) {
        passAccuracyWeightedTotal += groupPassAccuracy * groupPasses;
        passAccuracyWeight += groupPasses;
      } else {
        passAccuracyFallbackTotal += groupPassAccuracy;
        passAccuracyFallbackCount += 1;
      }
    }

    if (groupRating != null) {
      ratingTotal += groupRating;
      ratingCount += 1;
    }
  }

  if (options.appearances != null) {
    summary.appearances = options.appearances;
  }

  if (options.lineups != null) {
    summary.lineups = options.lineups;
  }

  summary.passAccuracy =
    passAccuracyWeight > 0
      ? roundStat(passAccuracyWeightedTotal / passAccuracyWeight)
      : passAccuracyFallbackCount > 0
        ? roundStat(passAccuracyFallbackTotal / passAccuracyFallbackCount)
        : null;
  summary.rating = ratingCount > 0 ? roundStat(ratingTotal / ratingCount) : null;

  return summary;
}

function extractLatestCompetitionStats(player, teamId) {
  if (!teamId) return null;

  const latestEntries = (Array.isArray(player?.latest) ? player.latest : []).filter(
    (entry) => String(entry?.team_id || "") === String(teamId) && Array.isArray(entry?.details) && entry.details.length > 0,
  );

  if (latestEntries.length === 0) return null;

  return extractStats(latestEntries, {
    appearances: latestEntries.length,
    lineups: latestEntries.filter((entry) => Number(entry?.type_id) === 11).length,
  });
}

function mapPlayerSearch(player) {
  if (!player?.id) return null;

  const team = pickCurrentTeam(player);
  return {
    id: String(player.id),
    _id: String(player.id),
    name: buildPlayerName(player),
    image: player.image_path || "",
    position: player.position?.name || player.detailedposition?.name || "Oyuncu",
    nationality: player.nationality?.name || player.country?.name || "",
    nationalityFlag: player.nationality?.image_path || player.country?.image_path || "",
    teamName: team?.name || "",
    teamLogo: team?.image_path || "",
  };
}

function mapPlayerProfile(player) {
  const team = pickCurrentTeam(player);
  const primaryStat = pickPrimaryStat(player?.statistics);
  const league = primaryStat?.season?.league || null;
  const fallbackStats = extractStats(primaryStat ? [primaryStat] : player?.statistics);
  const latestStats = extractLatestCompetitionStats(player, team?.id);
  const fallbackAppearances = Number(fallbackStats.appearances || fallbackStats.lineups || 0);
  const latestAppearances = Number(latestStats?.appearances || latestStats?.lineups || 0);
  const stats = latestStats && latestAppearances >= fallbackAppearances ? latestStats : fallbackStats;

  return {
    id: String(player?.id || ""),
    _id: String(player?.id || ""),
    name: buildPlayerName(player),
    firstName: player?.firstname || "",
    lastName: player?.lastname || "",
    image: player?.image_path || "",
    number: player?.jersey_number || player?.number || null,
    age: player?.age || null,
    dateOfBirth: player?.date_of_birth || player?.birthdate || "",
    height: player?.height || "",
    weight: player?.weight || "",
    preferredFoot: player?.foot || player?.preferred_foot || "",
    position: player?.position?.name || "Oyuncu",
    detailedPosition: player?.detailedposition?.name || "",
    nationality: player?.nationality?.name || player?.country?.name || "",
    nationalityFlag: player?.nationality?.image_path || player?.country?.image_path || "",
    country: player?.country?.name || "",
    countryFlag: player?.country?.image_path || "",
    teamName: team?.name || "",
    teamLogo: team?.image_path || "",
    leagueName: league?.name || "",
    leagueLogo: league?.image_path || "",
    seasonName: primaryStat?.season?.name || "",
    stats,
  };
}

exports.searchPlayers = async (req, res) => {
  try {
    const query = String(req.query.q || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    if (!query) {
      return res.json([]);
    }

    let players = await fetchSM(`players/search/${encodeURIComponent(query)}?include=position;country;nationality;teams.team`);
    if (!Array.isArray(players)) {
      players = await fetchSM(`players/search/${encodeURIComponent(query)}`);
    }

    const mapped = (Array.isArray(players) ? players : [])
      .map(mapPlayerSearch)
      .filter(Boolean)
      .sort((a, b) => {
        const aName = normalize(a.name);
        const bName = normalize(b.name);
        const q = normalize(query);
        const aExact = aName === q ? 0 : aName.startsWith(q) ? 1 : 2;
        const bExact = bName === q ? 0 : bName.startsWith(q) ? 1 : 2;
        return aExact - bExact || aName.localeCompare(bName, "tr");
      })
      .slice(0, 10);

    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ message: "Oyuncu arama hatasi" });
  }
};

exports.getPlayerProfile = async (req, res) => {
  try {
    const playerId = String(req.params.playerId || "").trim();
    if (!playerId) {
      return res.status(400).json({ message: "Oyuncu id gerekli" });
    }

    const cached = playerCache.get(playerId);
    if (cached && Date.now() - cached.time < PLAYER_CACHE_MS) {
      return res.json(cached.data);
    }

    const attempts = [
      `players/${playerId}?include=position;detailedposition;nationality;country;teams.team;statistics.details.type;statistics.season.league;statistics.team;latest.details.type`,
      `players/${playerId}?include=position;detailedposition;nationality;country;teams.team;statistics.season.league;statistics.team`,
      `players/${playerId}?include=position;detailedposition;nationality;country;teams.team`,
      `players/${playerId}`,
    ];

    let player = null;
    for (const endpoint of attempts) {
      player = await fetchSM(endpoint);
      if (player) break;
    }

    if (!player) {
      return res.status(404).json({ message: "Oyuncu bulunamadi" });
    }

    const mapped = mapPlayerProfile(player);
    playerCache.set(playerId, { data: mapped, time: Date.now() });
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ message: "Oyuncu profili alinamadi" });
  }
};
