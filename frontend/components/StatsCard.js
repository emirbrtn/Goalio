"use client";

import { Activity } from "lucide-react";

const COMPACT_STAT_GROUPS = [
  ["ball possession", "possession"],
  ["shots on target", "shots on target"],
  ["shots total", "total shots", "goal attempts"],
  ["big chances created", "big chances"],
  ["expected goals", "xg", "expected goal"],
  ["corners"],
  ["fouls"],
];

export default function StatsCard({ match, compact = false }) {
  if (!match || !match.statistics || match.statistics.length === 0) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center rounded-[32px] border border-slate-700/50 ${
          compact ? "bg-slate-900/20 p-5" : "bg-slate-800/40 p-8 min-h-[300px]"
        }`}
      >
        <Activity className={`${compact ? "mb-3 text-slate-500" : "mb-4 text-slate-600"}`} size={compact ? 28 : 40} />
        <p className={`text-center italic font-bold ${compact ? "text-sm text-slate-400" : "text-slate-500"}`}>
          {compact ? "One cikan mac verileri henuz hazir degil." : "Detayli mac istatistikleri henüz mevcut değil."}
        </p>
      </div>
    );
  }

  const homeId = match.homeTeam?._id;
  const awayId = match.awayTeam?._id;
  const statGroups = {};

  match.statistics.forEach((stat) => {
    const statName = stat.type?.name || "Istatistik";

    if (!statGroups[statName]) {
      statGroups[statName] = { name: statName, home: 0, away: 0 };
    }

    let value = stat.data?.value || stat.value || 0;
    if (typeof value === "string") {
      value = parseInt(value.replace("%", ""), 10) || 0;
    }

    if (String(stat.participant_id) === String(homeId)) {
      statGroups[statName].home = value;
    } else if (String(stat.participant_id) === String(awayId)) {
      statGroups[statName].away = value;
    }
  });

  const statList = Object.values(statGroups);

  if (compact) {
    const compactStats = getCompactStats(statList);

    return (
      <div className="flex h-full w-full flex-col justify-center">
        <div className="grid h-full grid-cols-2 gap-3">
          {compactStats.map((statItem, index) => (
            <CompactStatTile key={`${statItem.name}-${index}`} label={statItem.name} home={statItem.home} away={statItem.away} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111827]/80 border border-slate-800 rounded-[45px] p-10 shadow-2xl">
      <h3 className="mb-8 flex items-center gap-3 border-b border-slate-800 pb-6 text-2xl font-black italic uppercase text-white">
        <Activity className="text-blue-500" size={28} /> Tüm Istatistikler
      </h3>
      <div className="custom-scrollbar max-h-[450px] space-y-6 overflow-y-auto pr-4">
        {statList.map((statItem, index) => (
          <StatBar key={index} label={statItem.name} home={statItem.home} away={statItem.away} />
        ))}
      </div>
    </div>
  );
}

function getCompactStats(statList) {
  const selected = [];
  const usedIndexes = new Set();

  COMPACT_STAT_GROUPS.forEach((aliases) => {
    const matchIndex = statList.findIndex((item, index) => {
      if (usedIndexes.has(index)) return false;

      const normalized = String(item.name || "").toLowerCase();
      return aliases.some((alias) => normalized.includes(alias));
    });

    if (matchIndex >= 0) {
      selected.push(statList[matchIndex]);
      usedIndexes.add(matchIndex);
    }
  });

  const hasExpectedGoals = selected.some((item) =>
    String(item.name || "").toLowerCase().includes("expected goals") ||
    String(item.name || "").toLowerCase().includes("xg"),
  );

  const filtered = hasExpectedGoals
    ? selected.filter((item) => !String(item.name || "").toLowerCase().includes("corners"))
    : selected;

  return filtered.slice(0, 4);
}

function CompactStatTile({ label, home, away }) {
  const total = home + away || 1;
  const homeWidth = (home / total) * 100;

  return (
    <div className="flex min-h-[74px] flex-col justify-between rounded-[24px] border border-white/6 bg-black/10 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-lg font-black text-white">{home}</span>
        <span className="line-clamp-2 text-center text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
          {formatCompactLabel(label)}
        </span>
        <span className="text-lg font-black text-white">{away}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900/70">
        <div className="flex h-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{ width: `${homeWidth}%` }}
          />
          <div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-400"
            style={{ width: `${100 - homeWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function formatCompactLabel(label) {
  const raw = String(label || "").toLowerCase();

  if (raw.includes("ball possession") || raw.includes("possession")) return "Topa sahip olma";
  if (raw.includes("shots on target")) return "Isabetli sut";
  if (raw.includes("shots total") || raw.includes("total shots") || raw.includes("goal attempts")) return "Toplam sut";
  if (raw.includes("big chances created") || raw.includes("big chances")) return "Buyuk sans";
  if (raw.includes("expected goals") || raw.includes("xg") || raw.includes("expected goal")) return "Beklenen gol";
  if (raw.includes("corners")) return "Korner";
  if (raw.includes("fouls")) return "Faul";

  return label;
}

function StatBar({ label, home, away }) {
  const total = home + away || 1;
  const homeWidth = (home / total) * 100;

  return (
    <div className="group space-y-2">
      <div className="flex items-center justify-between">
        <span className="w-12 text-xl font-black text-white">{home}</span>
        <span className="flex-1 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-blue-400">
          {label}
        </span>
        <span className="w-12 text-right text-xl font-black text-white">{away}</span>
      </div>
      <div className="flex h-2 gap-1 rounded-full border border-white/5 bg-slate-950 p-0.5">
        <div
          className="h-full rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all"
          style={{ width: `${homeWidth}%` }}
        ></div>
        <div
          className="h-full rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all"
          style={{ width: `${100 - homeWidth}%` }}
        ></div>
      </div>
    </div>
  );
}
