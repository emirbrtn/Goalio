const predictionCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

async function fetchSM(endpoint) {
  const token = (process.env.SPORTSMONKS_API_TOKEN || "").trim();
  if (!token) throw new Error("SPORTSMONKS_API_TOKEN missing");

  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `https://api.sportmonks.com/v3/football/${endpoint}${separator}api_token=${token}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SportMonks request failed: ${response.status}`);    
  }

  const json = await response.json();
  return json.data;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeState(state) {
  if (["INPLAY", "HT", "ET", "PEN_LIVE"].includes(state)) return "live";
  if (["FT", "AET", "FT_PEN"].includes(state)) return "finished";
  return "scheduled";
}

function extractTeams(fixture) {
  const participants = Array.isArray(fixture?.participants) ? fixture.participants : [];
  const home =
    participants.find((participant) => participant.meta?.location === "home") ||
    participants[0] ||
    {};
  const away =
    participants.find((participant) => participant.meta?.location === "away") ||
    participants[1] ||
    {};

  return {
    home: {
      id: String(home.id || ""),
      name: home.name || "Ev Sahibi",
      logo: home.image_path || "",
    },
    away: {
      id: String(away.id || ""),
      name: away.name || "Deplasman",
      logo: away.image_path || "",
    },
  };
}

function extractGoals(fixture, participantId) {
  const scores = Array.isArray(fixture?.scores) ? fixture.scores : [];
  const currentScore =
    scores.find((score) => score.participant_id === participantId && score.description === "CURRENT") ||
    scores.find((score) => score.participant_id === participantId && score.description === "TOTAL") ||
    {};

  return Number(currentScore?.score?.goals ?? currentScore?.goals ?? 0);
}

function readStandingValue(entry, code) {
  const details = Array.isArray(entry?.details) ? entry.details : [];
  const detail = details.find((item) => String(item?.type?.code || "").toLowerCase() === code);
  return Number(detail?.value?.total ?? detail?.value ?? 0);
}

function mapFinishedFixture(fixture) {
  const teams = extractTeams(fixture);
  const state = fixture?.state?.state || "NS";
  const status = normalizeState(state);

  return {
    id: String(fixture?.id || ""),
    status,
    startTime: fixture?.starting_at || "",
    homeTeam: teams.home,
    awayTeam: teams.away,
    homeGoals: status === "scheduled" ? null : extractGoals(fixture, Number(teams.home.id)),
    awayGoals: status === "scheduled" ? null : extractGoals(fixture, Number(teams.away.id)),
  };
}

function pointsForTeam(match, teamId) {
  if (match.status !== "finished") return 0;
  const isHome = String(match.homeTeam.id) === String(teamId);
  const gf = isHome ? match.homeGoals : match.awayGoals;
  const ga = isHome ? match.awayGoals : match.homeGoals;
  if (gf > ga) return 3;
  if (gf === ga) return 1;
  return 0;
}

function computeTeamMetrics(teamId, fixtures, venueMode = "all") {
  const relevantMatches = fixtures
    .filter(
      (match) =>
        match.status === "finished" &&
        (String(match.homeTeam.id) === String(teamId) || String(match.awayTeam.id) === String(teamId)),
    )
    .sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());

  const recent = relevantMatches.slice(0, 5);
  const venueMatches = relevantMatches.filter((match) => {
    if (venueMode === "home") return String(match.homeTeam.id) === String(teamId);
    if (venueMode === "away") return String(match.awayTeam.id) === String(teamId);
    return true;
  });

  const aggregate = (matches) => {
    if (matches.length === 0) {
      return {
        matches: 0,
        points: 0,
        pointsPerGame: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalsForPerGame: 0,
        goalsAgainstPerGame: 0,
      };
    }

    let totalPoints = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    matches.forEach((match) => {
      const isHome = String(match.homeTeam.id) === String(teamId);
      const gf = isHome ? match.homeGoals : match.awayGoals;
      const ga = isHome ? match.awayGoals : match.homeGoals;
      goalsFor += Number(gf || 0);
      goalsAgainst += Number(ga || 0);
      totalPoints += pointsForTeam(match, teamId);
    });

    return {
      matches: matches.length,
      points: totalPoints,
      pointsPerGame: totalPoints / matches.length,
      goalsFor,
      goalsAgainst,
      goalsForPerGame: goalsFor / matches.length,
      goalsAgainstPerGame: goalsAgainst / matches.length,
    };
  };

  return {
    overall: aggregate(relevantMatches),
    recent: aggregate(recent),
    venue: aggregate(venueMatches),
    recentResults: recent.map((match) => pointsForTeam(match, teamId)),
  };
}

function buildHeadToHead(homeTeamId, awayTeamId, fixtures) {
  const matches = fixtures
    .filter(
      (match) =>
        match.status === "finished" &&
        ((String(match.homeTeam.id) === String(homeTeamId) && String(match.awayTeam.id) === String(awayTeamId)) ||
          (String(match.homeTeam.id) === String(awayTeamId) && String(match.awayTeam.id) === String(homeTeamId))),
    )
    .sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime())
    .slice(0, 3);

  return {
    matches: matches.length,
    homePoints: matches.reduce((sum, match) => sum + pointsForTeam(match, homeTeamId), 0),
    awayPoints: matches.reduce((sum, match) => sum + pointsForTeam(match, awayTeamId), 0),
  };
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function choosePrimaryOutcome(probabilities) {
  const entries = [
    { key: "homeWin", label: "Ev Sahibi", value: probabilities.homeWin },
    { key: "draw", label: "Beraberlik", value: probabilities.draw },
    { key: "awayWin", label: "Deplasman", value: probabilities.awayWin },
  ];

  return entries.sort((a, b) => b.value - a.value)[0];
}

function formatPercent(value) {
  return `%${Math.round(value * 100)}`;
}

function buildNarrativeSummary(primaryOutcome, teams, factors) {
  const topFactors = factors.slice(0, 3);

  if (primaryOutcome.key === "draw") {
    const titles = topFactors.slice(0, 2).map((factor) => factor.title.toLowerCase());
    return `${teams.home.name} ile ${teams.away.name} arasındaki veri dengesi birbirine yakın görünüyor. Özellikle ${titles.join(" ve ")} taraflar arasında büyük bir kopuş üretmiyor. Bu yüzden maçın dengeli başlayıp beraberliğe açık ilerleme ihtimali yüksek görünüyor.`;
  }

  const favoredTeam = primaryOutcome.key === "homeWin" ? teams.home.name : teams.away.name;
  const supportingFactors = topFactors.filter((factor) =>
    primaryOutcome.key === "homeWin" ? factor.impact >= 0 : factor.impact <= 0,
  );
  const emphasis = supportingFactors.length > 0 ? supportingFactors : topFactors;
  const emphasisTitles = emphasis.slice(0, 2).map((factor) => factor.title.toLowerCase());

  const firstSentence = `${favoredTeam} tarafı özellikle ${emphasisTitles.join(" ve ")} verilerinde rakibine göre daha güçlü bir profil çiziyor.`;
  const secondSentence = emphasis[0]?.detail || "";
  const closingSentence = `Bu yüzden maç öncesi genel denge ${favoredTeam} lehine hafifçe kayıyor.`;

  return [firstSentence, secondSentence, closingSentence].filter(Boolean).join(" ");
}

async function buildPrediction(matchId) {
  const cached = predictionCache.get(String(matchId));
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return cached.data;
  }

  const fixture = await fetchSM(`fixtures/${matchId}?include=participants;scores;state;league`);
  if (!fixture) {
    throw new Error("Match not found");
  }

  const matchStatus = normalizeState(fixture?.state?.state || "NS");
  if (matchStatus !== "scheduled") {
    const error = new Error("Prediction only available before kickoff");
    error.status = 400;
    throw error;
  }

  const teams = extractTeams(fixture);
  const leagueId = fixture?.league_id || fixture?.league?.id;
  let seasonId = fixture?.season_id || "";

  if (!seasonId && leagueId) {
    const league = await fetchSM(`leagues/${leagueId}?include=currentseason`);
    seasonId = league?.currentseason?.id || "";
  }

  if (!seasonId) {
    throw new Error("Season could not be resolved");
  }

  const [seasonData, standingsData] = await Promise.all([
    fetchSM(`seasons/${seasonId}?include=fixtures.participants;fixtures.scores;fixtures.state`),
    fetchSM(`standings/seasons/${seasonId}?include=participant;details.type`),
  ]);

  const fixtures = (Array.isArray(seasonData?.fixtures) ? seasonData.fixtures : [])
    .map(mapFinishedFixture)
    .filter(Boolean);

  const standings = Array.isArray(standingsData) ? standingsData : [];
  const homeStanding = standings.find((entry) => String(entry?.participant?.id || "") === String(teams.home.id)) || {};
  const awayStanding = standings.find((entry) => String(entry?.participant?.id || "") === String(teams.away.id)) || {};

  const homeMetrics = computeTeamMetrics(teams.home.id, fixtures, "home");
  const awayMetrics = computeTeamMetrics(teams.away.id, fixtures, "away");
  const headToHead = buildHeadToHead(teams.home.id, teams.away.id, fixtures);

  const homeStandingPoints = Number(homeStanding?.points || readStandingValue(homeStanding, "overall-points") || 0);
  const awayStandingPoints = Number(awayStanding?.points || readStandingValue(awayStanding, "overall-points") || 0);

  const positionDiff = clamp((Number(awayStanding?.position || 10) - Number(homeStanding?.position || 10)) / 20, -1, 1);
  const pointsDiff = clamp((homeStandingPoints - awayStandingPoints) / 30, -1, 1);
  const formDiff = clamp((homeMetrics.recent.pointsPerGame - awayMetrics.recent.pointsPerGame) / 3, -1, 1);
  const attackDiff = clamp((homeMetrics.overall.goalsForPerGame - awayMetrics.overall.goalsForPerGame) / 3, -1, 1);
  const defenseDiff = clamp((awayMetrics.overall.goalsAgainstPerGame - homeMetrics.overall.goalsAgainstPerGame) / 3, -1, 1);
  const venueDiff = clamp((homeMetrics.venue.pointsPerGame - awayMetrics.venue.pointsPerGame) / 3, -1, 1);
  const h2hDiff = clamp((headToHead.homePoints - headToHead.awayPoints) / 9, -1, 1);

  const weightedEdge =
    positionDiff * 0.18 +
    pointsDiff * 0.16 +
    formDiff * 0.24 +
    attackDiff * 0.16 +
    defenseDiff * 0.12 +
    venueDiff * 0.1 +
    h2hDiff * 0.04 +
    0.1;

  const drawProbability = clamp(0.22 + 0.14 * (1 - Math.min(Math.abs(weightedEdge) / 1.1, 1)), 0.18, 0.34);
  const decisiveProbability = 1 - drawProbability;
  const homeShare = sigmoid(weightedEdge * 2.6);
  const awayShare = 1 - homeShare;

  const probabilities = {
    homeWin: round(decisiveProbability * homeShare, 2),
    draw: round(drawProbability, 2),
    awayWin: round(decisiveProbability * awayShare, 2),
  };

  const probabilityTotal = probabilities.homeWin + probabilities.draw + probabilities.awayWin;
  if (probabilityTotal !== 1) {
    probabilities.awayWin = round(1 - probabilities.homeWin - probabilities.draw, 2);
  }

  const confidenceBase = Math.max(probabilities.homeWin, probabilities.draw, probabilities.awayWin);
  const sampleBoost = clamp(
    ((homeMetrics.recent.matches + awayMetrics.recent.matches + headToHead.matches) / 13) * 0.12,
    0,
    0.12,
  );
  const confidence = round(clamp(confidenceBase + sampleBoost, 0.52, 0.9), 2);
  const primaryOutcome = choosePrimaryOutcome(probabilities);

  const factors = [
    {
      title: "Form Durumu",
      detail: `${teams.home.name} son 5 maçta ${round(homeMetrics.recent.pointsPerGame, 2)}, ${teams.away.name} ise ${round(awayMetrics.recent.pointsPerGame, 2)} puan ortalaması yakaladı.`,
      impact: round(formDiff, 2),
    },
    {
      title: "Puan Tablosu",
      detail: `${teams.home.name} ${homeStanding?.position || "-"}., ${teams.away.name} ${awayStanding?.position || "-"}. sırada yer alıyor.`,
      impact: round(positionDiff + pointsDiff, 2),
    },
    {
      title: "Hücum ve Savunma",
      detail: `${teams.home.name} geçmiş maçlarında toplam ${homeMetrics.overall.goalsFor} gol attı (${round(homeMetrics.overall.goalsForPerGame, 2)} / maç), ${teams.away.name} ise toplam ${awayMetrics.overall.goalsAgainst} gol yedi (${round(awayMetrics.overall.goalsAgainstPerGame, 2)} / maç).`,
      impact: round(attackDiff + defenseDiff, 2),
    },
    {
      title: "Gol Yeme Direnci",
      detail: `${teams.home.name} son 5 maçta maç başına ${round(homeMetrics.recent.goalsAgainstPerGame, 2)} gol yedi, ${teams.away.name} ise ${round(awayMetrics.recent.goalsAgainstPerGame, 2)} gol yedi.`,
      impact: round(clamp((awayMetrics.recent.goalsAgainstPerGame - homeMetrics.recent.goalsAgainstPerGame) / 3, -1, 1), 2),
    },
    {
      title: "İç Saha / Deplasman",
      detail: `${teams.home.name} iç sahadaki geçmiş maçlarında ${round(homeMetrics.venue.pointsPerGame, 2)}, ${teams.away.name} deplasmandaki geçmiş maçlarında ${round(awayMetrics.venue.pointsPerGame, 2)} puan ortalaması üretiyor.`,
      impact: round(venueDiff, 2),
    },
    {
      title: "Ikili Rekabet",
      detail:
        headToHead.matches > 0
          ? `Iki takim arasindaki son ${headToHead.matches} maclik seride ${teams.home.name} ${headToHead.homePoints} puan, ${teams.away.name} ise ${headToHead.awayPoints} puan topladi.`
          : "Iki takim arasinda yakin donemde yeterli gecmis mac verisi bulunamadi.",
      impact: round(headToHead.matches > 0 ? h2hDiff : 0, 2),
    },
  ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const summary = buildNarrativeSummary(primaryOutcome, teams, factors);

  const prediction = {
    matchId: String(matchId),
    generatedAt: new Date().toISOString(),
    probabilities,
    confidence,
    favoredSide: primaryOutcome.label,
    summary,
    analysis: {
      primaryFactor: factors[0] || null,
      factors,
      metrics: {
        homeFormPointsPerGame: round(homeMetrics.recent.pointsPerGame, 2),
        awayFormPointsPerGame: round(awayMetrics.recent.pointsPerGame, 2),
        homeGoalsFor: round(homeMetrics.overall.goalsForPerGame, 2),
        awayGoalsFor: round(awayMetrics.overall.goalsForPerGame, 2),
        homeTotalGoals: homeMetrics.overall.goalsFor,
        awayTotalGoals: awayMetrics.overall.goalsFor,
        headToHeadMatches: headToHead.matches,
        headToHeadHomePoints: headToHead.homePoints,
        headToHeadAwayPoints: headToHead.awayPoints,
      },
    },
    reasonTags: factors.slice(0, 3).map((factor) => factor.title),
    display: {
      confidenceLabel: formatPercent(confidence),
      favoriteLabel:
        primaryOutcome.key === "draw"
          ? "Dengeli Senaryo"
          : `${primaryOutcome.label} Avantajı`,
    },
  };

  predictionCache.set(String(matchId), {
    time: Date.now(),
    data: prediction,
  });

  return prediction;
}

exports.getMatchPrediction = async (req, res) => {
  try {
    const prediction = await buildPrediction(req.params.matchId);
    return res.json(prediction);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message: status === 400 ? "AI tahmini sadece başlamamış maçlarda üretilir." : "Tahmin getirilemedi.",
    });
  }
};

exports.generatePrediction = async (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ message: "Maç ID gerekli" });
    }

    const prediction = await buildPrediction(matchId);
    return res.json(prediction);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message: status === 400 ? "AI tahmini sadece başlamamış maçlarda üretilir." : "Tahmin üretilemedi",
    });
  }
};
