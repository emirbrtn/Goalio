import { parseMatchDate } from "@/lib/text";

export const HERO_ELITE_TEAMS = [
  "Liverpool",
  "Arsenal",
  "Manchester City",
  "Manchester United",
  "Aston Villa",
  "Chelsea",
  "Real Madrid",
  "Barcelona",
  "Atletico Madrid",
  "Villarreal",
  "Galatasaray",
  "Fenerbahce",
  "Besiktas",
  "Inter",
  "Inter Milan",
  "AC Milan",
  "Napoli",
  "Juventus",
  "Bayern Munich",
  "Borussia Dortmund",
];

const LIVE_MATCH_MAX_WINDOW_MINUTES = 150;
const EXTENDED_LIVE_MATCH_MAX_WINDOW_MINUTES = 210;

export function normalizeMatchText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function sortMatchesByStart(matches = [], direction = "asc") {
  const factor = direction === "desc" ? -1 : 1;
  return [...matches].sort((a, b) => {
    const aTime = parseMatchDate(a?.startTime || a?.date)?.getTime() || 0;
    const bTime = parseMatchDate(b?.startTime || b?.date)?.getTime() || 0;
    return (aTime - bTime) * factor;
  });
}

export function dedupeMatches(matches = []) {
  return Array.from(new Map(matches.filter(Boolean).map((match) => [String(match._id), match])).values());
}

function getRawMatchState(match) {
  return String(match?.rawState || match?.sportsmonkData?.state?.state || "")
    .trim()
    .toUpperCase();
}

function getLiveMatchWindowMinutes(rawState) {
  if (rawState.includes("ET") || rawState.includes("PEN")) {
    return EXTENDED_LIVE_MATCH_MAX_WINDOW_MINUTES;
  }

  return LIVE_MATCH_MAX_WINDOW_MINUTES;
}

export function isActiveLiveMatch(match) {
  if (String(match?.status || "") !== "live") return false;

  const startedAt = parseMatchDate(match?.startTime || match?.date || match?.sportsmonkData?.starting_at)?.getTime() || 0;
  if (!startedAt) return true;

  return Date.now() - startedAt <= getLiveMatchWindowMinutes(getRawMatchState(match)) * 60000;
}

export function filterActiveLiveMatches(matches = []) {
  return dedupeMatches(matches.filter(isActiveLiveMatch));
}

export function isEliteMatch(match) {
  const homeName = normalizeMatchText(match?.homeTeam?.name);
  const awayName = normalizeMatchText(match?.awayTeam?.name);

  return HERO_ELITE_TEAMS.some((team) => {
    const normalizedTeam = normalizeMatchText(team);
    return homeName.includes(normalizedTeam) || awayName.includes(normalizedTeam);
  });
}

export function getLiveMatchProgress(match) {
  const explicitMinute =
    Number(match?.sportsmonkData?.minute || 0) ||
    Number(match?.sportsmonkData?.time?.minute || 0) ||
    Number(match?.minute || 0);
  if (explicitMinute > 0) return explicitMinute;

  const startedAt = parseMatchDate(match?.startTime || match?.date)?.getTime() || 0;
  if (!Number.isFinite(startedAt) || startedAt <= 0) return 0;

  const elapsed = Math.floor((Date.now() - startedAt) / 60000);
  return Math.max(0, elapsed);
}

export function sortLiveMatches(matches = [], heroMatchId = null) {
  const safeLiveMatches = filterActiveLiveMatches(matches);
  const getPriority = (match) => {
    if (!match) return Number.MAX_SAFE_INTEGER;
    if (heroMatchId && String(match._id) === String(heroMatchId)) return 0;
    if (isEliteMatch(match)) return 1;
    return 2;
  };

  return [...safeLiveMatches].sort((a, b) => {
    const priorityDiff = getPriority(a) - getPriority(b);
    if (priorityDiff !== 0) return priorityDiff;

    const progressDiff = getLiveMatchProgress(b) - getLiveMatchProgress(a);
    if (progressDiff !== 0) return progressDiff;

    return (parseMatchDate(a?.startTime || a?.date)?.getTime() || 0) - (parseMatchDate(b?.startTime || b?.date)?.getTime() || 0);
  });
}

export function selectHeroMatch(all = [], live = [], history = []) {
  const activePool = sortMatchesByStart(
    dedupeMatches(all.filter((match) => isActiveLiveMatch(match) || match?.status === "scheduled")),
    "asc",
  );
  const livePool = filterActiveLiveMatches([
    ...live,
    ...activePool,
  ]);
  const scheduledPool = activePool.filter((match) => match?.status === "scheduled");

  return (
    livePool.find(isEliteMatch) ||
    scheduledPool.find(isEliteMatch) ||
    livePool[0] ||
    scheduledPool[0] ||
    history[0] ||
    all[0] ||
    null
  );
}
