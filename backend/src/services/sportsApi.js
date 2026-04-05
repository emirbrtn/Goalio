console.log("SPORTS API DOSYASI ÇALIŞTI");
const axios = require("axios");

const API_KEY = "123";

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function getTodayMatches() {
  const today = formatDate(new Date());

  const url = `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${today}&s=Soccer`;

  console.log("TODAY URL:", url);

  const res = await axios.get(url);

  return res.data?.events || [];
}

async function getLiveMatches() {
  const matches = await getTodayMatches();

  return matches.filter((m) =>
    (m.strStatus || "").toLowerCase().includes("live"),
  );
}

async function getHistoryMatches() {
  const d = new Date();
  d.setDate(d.getDate() - 1);

  const yesterday = formatDate(d);

  const url = `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${yesterday}&s=Soccer`;

  console.log("HISTORY URL:", url);

  const res = await axios.get(url);

  return res.data?.events || [];
}

async function getSearchMatches(query) {
  const matches = await getTodayMatches();

  const q = query.toLowerCase();

  return matches.filter((m) => {
    return (
      (m.strHomeTeam || "").toLowerCase().includes(q) ||
      (m.strAwayTeam || "").toLowerCase().includes(q) ||
      (m.strLeague || "").toLowerCase().includes(q)
    );
  });
}

module.exports = {
  getTodayMatches,
  getLiveMatches,
  getHistoryMatches,
  getSearchMatches,
};
