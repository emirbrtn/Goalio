const TEAM_ACRONYMS = new Set([
  "AC",
  "AFC",
  "AIK",
  "AS",
  "BK",
  "BSC",
  "CA",
  "CD",
  "CF",
  "CFR",
  "CSKA",
  "FC",
  "FK",
  "HJK",
  "IF",
  "IK",
  "KF",
  "KV",
  "NK",
  "OFI",
  "OFK",
  "PSG",
  "PSV",
  "RC",
  "RCD",
  "RKC",
  "SC",
  "SK",
  "SV",
  "TSV",
  "US",
  "VV",
]);

const MATCH_TIME_ZONE = "Europe/Istanbul";

const LEAGUE_LOGOS = [
  { patterns: ["super lig", "trendyol super lig"], logo: "https://cdn.sportmonks.com/images/soccer/leagues/24/600.png" },
  { patterns: ["premier league"], logo: "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png" },
  { patterns: ["la liga"], logo: "https://cdn.sportmonks.com/images/soccer/leagues/20/564.png" },
  { patterns: ["bundesliga"], logo: "https://cdn.sportmonks.com/images/soccer/leagues/18/82.png" },
  { patterns: ["serie a"], logo: "https://cdn.sportmonks.com/images/soccer/leagues/0/384.png" },
];

export function formatTeamName(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  return input
    .split(/\s+/)
    .map((word) => word.split("-").map(formatNamePart).join("-"))
    .join(" ");
}

export function formatLeagueName(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  if (/^trendyol super lig$/i.test(input)) return "Trendyol Süper Lig";
  if (/^super lig$/i.test(input)) return "Süper Lig";

  return input
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "c");
}

export function getLeagueLogo(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!normalized) return "";

  const matched = LEAGUE_LOGOS.find((entry) =>
    entry.patterns.some((pattern) => normalized === pattern || normalized.includes(pattern) || pattern.includes(normalized)),
  );

  return matched?.logo || "";
}

export function parseMatchDate(value) {
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

export function formatMatchDate(value) {
  const parsed = parseMatchDate(value);
  if (!parsed) return "";

  return parsed.toLocaleDateString("tr-TR", {
    timeZone: MATCH_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatMatchTime(value) {
  const parsed = parseMatchDate(value);
  if (!parsed) return "";

  return parsed.toLocaleTimeString("tr-TR", {
    timeZone: MATCH_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMatchDateTime(value) {
  const date = formatMatchDate(value);
  const time = formatMatchTime(value);
  if (date && time) return `${date} ${time}`;
  return date || time || "";
}

function formatNamePart(part) {
  const value = String(part || "").trim();
  if (!value) return "";

  const normalized = value.replace(/İ/g, "I");
  const hasLowercase = /\p{Ll}/u.test(normalized);
  const hasUppercase = /\p{Lu}/u.test(normalized);

  if (hasLowercase && hasUppercase) {
    return normalized;
  }

  const compactUpper = normalized.replace(/\./g, "").toUpperCase();

  if (TEAM_ACRONYMS.has(compactUpper) || /^[A-Z0-9]{1,3}$/u.test(compactUpper)) {
    return normalized.toUpperCase();
  }

  const lower = normalized.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function sortMatchEvents(events = []) {
  return [...events].sort((a, b) => {
    const minuteDiff = Number(a?.minute || 0) - Number(b?.minute || 0);
    if (minuteDiff !== 0) return minuteDiff;

    const extraDiff = Number(a?.extra_minute || 0) - Number(b?.extra_minute || 0);
    if (extraDiff !== 0) return extraDiff;

    const orderDiff = Number(a?.sort_order || 0) - Number(b?.sort_order || 0);
    if (orderDiff !== 0) return orderDiff;

    return Number(a?.id || 0) - Number(b?.id || 0);
  });
}

export function formatMinuteLabel(event) {
  const minute = Number(event?.minute || 0);
  const extraMinute = Number(event?.extra_minute || 0);

  if (!minute && !extraMinute) return "--'";
  if (extraMinute > 0) return `${minute}+${extraMinute}'`;
  return `${minute}'`;
}

function firstLiveNumber(values = []) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}

function getRawMatchState(match) {
  return String(match?.rawState || match?.sportsmonkData?.state?.state || "")
    .trim()
    .toUpperCase();
}

function isHalftimeState(rawState) {
  return (
    rawState === "HT" ||
    rawState === "BREAK" ||
    rawState.includes("HALF_TIME") ||
    rawState.includes("HALFTIME")
  );
}

function isFirstHalfState(rawState) {
  return rawState.includes("1ST_HALF") || rawState.includes("FIRST_HALF");
}

function isSecondHalfState(rawState) {
  return rawState.includes("2ND_HALF") || rawState.includes("SECOND_HALF");
}

function getLatestEventMinute(match) {
  const events = sortMatchEvents(match?.sportsmonkData?.events || []);
  if (!events.length) {
    return { minute: 0, extraMinute: 0 };
  }

  const latestEvent = events[events.length - 1];
  return {
    minute: Number(latestEvent?.minute || 0),
    extraMinute: Number(latestEvent?.extra_minute || 0),
  };
}

export function formatLiveMinute(match) {
  if (String(match?.status || "") !== "live") return "";

  const rawState = getRawMatchState(match);
  const startedAt = parseMatchDate(match?.startTime || match?.date)?.getTime() || 0;
  const currentPeriod =
    match?.sportsmonkData?.currentPeriod ||
    match?.sportsmonkData?.currentperiod ||
    null;

  if (isHalftimeState(rawState)) {
    return "Devre Arası";
  }

  const minute = firstLiveNumber([
    match?.minute,
    currentPeriod?.minutes,
    currentPeriod?.minute,
    match?.sportsmonkData?.minute,
    match?.sportsmonkData?.time?.minute,
    match?.sportsmonkData?.state?.minute,
    match?.sportsmonkData?.state?.clock?.minute,
  ]);
  const extraMinute = firstLiveNumber([
    match?.extraMinute,
    match?.extra_minute,
    currentPeriod?.time_added,
    currentPeriod?.extra_minute,
    match?.sportsmonkData?.extra_minute,
    match?.sportsmonkData?.time?.extra_minute,
    match?.sportsmonkData?.time?.added_time,
    match?.sportsmonkData?.state?.extra_minute,
    match?.sportsmonkData?.state?.added_time,
    match?.sportsmonkData?.state?.clock?.extra_minute,
  ]);
  const latestEvent = getLatestEventMinute(match);

  if (!minute && !extraMinute) {
    if (isHalftimeState(rawState)) {
      return "Devre Arası";
    }

    if (isFirstHalfState(rawState)) {
      if (latestEvent.minute > 0) {
        if (latestEvent.extraMinute > 0) return `${latestEvent.minute}+${latestEvent.extraMinute}'`;
        if (latestEvent.minute > 45) return `45+${latestEvent.minute - 45}'`;
        return `${latestEvent.minute}'`;
      }

      if (Number.isFinite(startedAt) && startedAt > 0) {
        const elapsed = Math.max(1, Math.floor((Date.now() - startedAt) / 60000));
        if (elapsed > 45) return `45+${elapsed - 45}'`;
        return `${elapsed}'`;
      }

      return "1. Yarı";
    }

    if (isSecondHalfState(rawState)) {
      if (latestEvent.minute >= 46) {
        if (latestEvent.extraMinute > 0) return `${latestEvent.minute}+${latestEvent.extraMinute}'`;
        if (latestEvent.minute > 90) return `90+${latestEvent.minute - 90}'`;
        return `${latestEvent.minute}'`;
      }

      if (Number.isFinite(startedAt) && startedAt > 0) {
        const elapsed = Math.max(1, Math.floor((Date.now() - startedAt) / 60000));
        const adjustedSecondHalfMinute = Math.max(46, elapsed - 15);

        if (adjustedSecondHalfMinute > 90) {
          return `90+${adjustedSecondHalfMinute - 90}'`;
        }

        return `${adjustedSecondHalfMinute}'`;
      }

      return "2. Yarı";
    }

    if (Number.isFinite(startedAt) && startedAt > 0 && rawState.startsWith("INPLAY")) {
      const fallbackMinute = Math.max(1, Math.floor((Date.now() - startedAt) / 60000));
      return `${fallbackMinute}'`;
    }

    return "";
  }

  if (extraMinute > 0) return `${minute}+${extraMinute}'`;
  if (isFirstHalfState(rawState) && minute > 45) return `45+${minute - 45}'`;
  if (isSecondHalfState(rawState) && minute > 90) return `90+${minute - 90}'`;
  return `${minute}'`;
}
