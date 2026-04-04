const LIVE_STATES = new Set(["HT", "ET", "PEN_LIVE", "BREAK", "INTERRUPTED"]);
const FINISHED_STATES = new Set([
  "AET",
  "FT_PEN",
  "AFTER_PENALTIES",
  "AWARDED",
  "CANCELLED",
  "POSTPONED",
]);

function normalizeMatchState(rawState) {
  const state = String(rawState || "NS").trim().toUpperCase();

  if (state.startsWith("INPLAY") || LIVE_STATES.has(state)) {
    return "live";
  }

  if (state.startsWith("FT") || FINISHED_STATES.has(state)) {
    return "finished";
  }

  return "scheduled";
}

module.exports = { normalizeMatchState };
