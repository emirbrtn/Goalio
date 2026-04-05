"use client";

import { formatTeamName } from "@/lib/text";

function getPlayerId(player) {
  const raw = player?.player_id || player?.player?.id || player?.id || player?._id || "";
  return raw ? String(raw) : "";
}

function parseFormationField(player) {
  const raw = String(player?.formation_field || "").trim();
  const [rowPart, colPart] = raw.split(":");
  const row = Number(rowPart);
  const col = Number(colPart);

  if (!Number.isFinite(row) || !Number.isFinite(col) || row < 1 || col < 1) {
    return null;
  }

  return { row, col };
}

function canRenderLineup(lineup = []) {
  return (
    Array.isArray(lineup) &&
    lineup.length === 11 &&
    lineup.every((player) => parseFormationField(player))
  );
}

function buildFormationLabel(lineup = []) {
  const counts = new Map();

  lineup.forEach((player) => {
    const coords = parseFormationField(player);
    if (!coords) return;
    counts.set(coords.row, (counts.get(coords.row) || 0) + 1);
  });

  const rows = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map((entry) => entry[1]);

  if (rows.length <= 1 || rows[0] !== 1) return null;
  return rows.slice(1).join("-");
}

function buildTeamNodes(lineup = [], side) {
  const groupedRows = new Map();

  lineup.forEach((player) => {
    const coords = parseFormationField(player);
    if (!coords) return;

    if (!groupedRows.has(coords.row)) {
      groupedRows.set(coords.row, []);
    }

    groupedRows.get(coords.row).push({ player, coords });
  });

  const rows = [...groupedRows.entries()].sort((a, b) => a[0] - b[0]);
  const totalRows = rows.length;
  const startY = side === "home" ? 10 : 90;
  const endY = side === "home" ? 44 : 56;

  return rows.flatMap(([rowNumber, players], rowIndex) => {
    const sortedPlayers = [...players].sort((a, b) => {
      const colDiff = a.coords.col - b.coords.col;
      if (colDiff !== 0) return colDiff;
      return Number(a.player?.formation_position || 0) - Number(b.player?.formation_position || 0);
    });

    const y =
      totalRows === 1
        ? (startY + endY) / 2
        : startY + ((endY - startY) * rowIndex) / (totalRows - 1);
    const horizontalPadding = sortedPlayers.length >= 5 ? 8 : sortedPlayers.length === 4 ? 12 : 18;

    return sortedPlayers.map(({ player }, index) => {
      const x =
        sortedPlayers.length === 1
          ? 50
          : horizontalPadding + ((100 - horizontalPadding * 2) * index) / (sortedPlayers.length - 1);

      return {
        id: `${side}-${player.id || player.player_id || player.player?.id || player.jersey_number || index}`,
        x,
        y,
        player,
        playerId: getPlayerId(player),
        rowNumber,
      };
    });
  });
}

function buildPlayerEventMap(events = [], matchStatus) {
  if ((matchStatus !== "finished" && matchStatus !== "live") || !Array.isArray(events) || events.length === 0) {
    return new Map();
  }

  const summary = new Map();

  const ensure = (playerId) => {
    if (!playerId) return null;
    const key = String(playerId);
    if (!summary.has(key)) {
      summary.set(key, { goals: 0, assists: 0, yellow: 0, red: 0 });
    }
    return summary.get(key);
  };

  events.forEach((event) => {
    const typeName = String(event?.type?.name || "").toLowerCase().replace(/\s+/g, "");
    const typeId = Number(event?.type_id || 0);
    const playerStats = ensure(event?.player_id);

    const isGoalEvent =
      typeId === 14 ||
      typeName === "goal" ||
      typeName === "owngoal" ||
      (typeName.includes("goal") && !typeName.includes("goalkick"));

    if (isGoalEvent && playerStats) {
      playerStats.goals += 1;
      const assisterStats = ensure(event?.related_player_id);
      if (assisterStats) {
        assisterStats.assists += 1;
      }
    }

    if ((typeId === 19 || typeName.includes("yellow")) && playerStats) {
      playerStats.yellow += 1;
    }

    if ((typeName.includes("red") || typeId === 20 || typeId === 21) && playerStats) {
      playerStats.red += 1;
    }
  });

  return summary;
}

function PlayerEventBadges({ stats }) {
  if (!stats || (!stats.goals && !stats.assists && !stats.yellow && !stats.red)) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute -top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-slate-950/80 px-1.5 py-0.5 shadow-[0_10px_18px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      {stats.goals > 0 ? (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-white" title={`${stats.goals} gol`}>
          <span>⚽</span>
          {stats.goals > 1 ? <span>{stats.goals}</span> : null}
        </span>
      ) : null}
      {stats.assists > 0 ? (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-cyan-200" title={`${stats.assists} asist`}>
          <span>↗</span>
          {stats.assists > 1 ? <span>{stats.assists}</span> : null}
        </span>
      ) : null}
      {stats.yellow > 0 ? (
        <span
          className="inline-flex h-3.5 min-w-[10px] items-center justify-center rounded-[3px] bg-yellow-400 px-0.5 text-[8px] font-black text-black"
          title={`${stats.yellow} sari kart`}
        >
          {stats.yellow > 1 ? stats.yellow : ""}
        </span>
      ) : null}
      {stats.red > 0 ? (
        <span
          className="inline-flex h-3.5 min-w-[10px] items-center justify-center rounded-[3px] bg-red-500 px-0.5 text-[8px] font-black text-white"
          title={`${stats.red} kirmizi kart`}
        >
          {stats.red > 1 ? stats.red : ""}
        </span>
      ) : null}
    </div>
  );
}

function TeamMarker({ node, side, onPlayerSelect, teamName, teamLogo, eventStats }) {
  const player = node.player;
  const image = player?.player?.image_path || player?.image || "";
  const name = player?.player?.display_name || player?.player_name || player?.name || "Player";
  const jersey = player?.jersey_number || player?.number || "?";
  const badgeClass =
    side === "away"
      ? "border-amber-400/40 bg-amber-500/20 text-amber-100"
      : "border-sky-400/40 bg-sky-500/20 text-sky-100";

  return (
    <button
      type="button"
      onClick={() => onPlayerSelect({ ...player, name, image, teamName, teamLogo, jersey_number: jersey })}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <div className="flex flex-col items-center gap-1.5">
        <div className={`relative h-10 w-10 rounded-full border shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-105 ${badgeClass}`}>
          <PlayerEventBadges stats={eventStats} />
          {image ? (
            <img src={image} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full text-sm font-black">
              {String(name).slice(0, 1)}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-1 text-[10px] font-black text-white">
            {jersey}
          </span>
        </div>
        <span className="max-w-[84px] truncate text-[8px] font-bold leading-none text-white/90 group-hover:text-cyan-200">
          {name}
        </span>
      </div>
    </button>
  );
}

function TeamInfoCard({ side, team, formation, isProbable }) {
  const cardClass =
    side === "away"
      ? "border-amber-400/20 bg-amber-500/10"
      : "border-sky-400/20 bg-sky-500/10";
  const accentClass = side === "away" ? "text-amber-300" : "text-sky-300";

  return (
    <div className={`min-w-[260px] rounded-[26px] border px-5 py-4 backdrop-blur-sm ${cardClass}`}>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl border border-white/10 bg-slate-950/60 p-2">
          {team?.logo ? <img src={team.logo} alt={team?.name} className="h-full w-full object-contain" /> : null}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">
            {side === "away" ? "Away Side" : "Home Side"}
          </p>
          <h4 className="truncate text-lg font-black text-white">{formatTeamName(team?.name)}</h4>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
        <span className={`inline-flex items-center rounded-full px-3 py-1 ${accentClass} bg-slate-950/40`}>
          {formation ? `${formation} Shape` : isProbable ? "Probable XI" : "Starting XI"}
        </span>
      </div>

      {team?.coach?.name ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-slate-900">
            {team.coach.image ? (
              <img src={team.coach.image} alt={team.coach.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-black text-white">
                {String(team.coach.name).slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-500">Coach</p>
            <p className="truncate text-sm font-bold text-white">{team.coach.name}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MatchFormationPitch({
  homeTeam,
  awayTeam,
  homeLineup = [],
  awayLineup = [],
  events = [],
  matchStatus,
  isProbable = false,
  onPlayerSelect,
}) {
  const safeHome = canRenderLineup(homeLineup);
  const safeAway = canRenderLineup(awayLineup);

  if (!safeHome || !safeAway) {
    return null;
  }

  const homeNodes = buildTeamNodes(homeLineup, "home");
  const awayNodes = buildTeamNodes(awayLineup, "away");
  const homeFormation = buildFormationLabel(homeLineup);
  const awayFormation = buildFormationLabel(awayLineup);
  const playerEventMap = buildPlayerEventMap(events, matchStatus);

  return (
    <div className="max-w-6xl mx-auto relative z-10">
      <div className="bg-[#111827]/60 border border-slate-800 rounded-[35px] p-8 shadow-2xl overflow-hidden">
        <div className="flex flex-col gap-5 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300/80">Match Shape</p>
            <h3 className="text-2xl font-black text-white tracking-tight">{isProbable ? "Probable XI Formation" : "Starting XI Formation"}</h3>
            {isProbable ? <p className="mt-2 text-[11px] font-bold tracking-[0.18em] text-amber-300/80">PRE-MATCH LINEUPS ARE SHOWN AS PROBABLE, NOT OFFICIAL.</p> : null}
          </div>
          <div className="flex justify-center">
            <TeamInfoCard side="home" team={homeTeam} formation={homeFormation} isProbable={isProbable} />
          </div>
        </div>

        <div className="relative h-[820px] rounded-[32px] border border-emerald-200/10 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.12),_transparent_45%),linear-gradient(180deg,rgba(22,101,52,0.95),rgba(18,74,41,0.98))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.03)_12.5%,transparent_12.5%,transparent_25%,rgba(255,255,255,0.03)_25%,rgba(255,255,255,0.03)_37.5%,transparent_37.5%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_62.5%,transparent_62.5%,transparent_75%,rgba(255,255,255,0.03)_75%,rgba(255,255,255,0.03)_87.5%,transparent_87.5%,transparent_100%)]" />
          <div className="absolute inset-6 rounded-[28px] border border-white/20" />
          <div className="absolute left-6 right-6 top-1/2 h-px -translate-y-1/2 bg-white/25" />
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
          <div className="absolute left-1/2 top-[18%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />
          <div className="absolute left-1/2 top-[82%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />
          <div className="absolute left-1/2 top-6 h-[16%] w-[44%] -translate-x-1/2 rounded-b-[26px] border-x border-b border-white/20" />
          <div className="absolute left-1/2 top-6 h-[7%] w-[20%] -translate-x-1/2 rounded-b-[18px] border-x border-b border-white/20" />
          <div className="absolute left-1/2 bottom-6 h-[16%] w-[44%] -translate-x-1/2 rounded-t-[26px] border-x border-t border-white/20" />
          <div className="absolute left-1/2 bottom-6 h-[7%] w-[20%] -translate-x-1/2 rounded-t-[18px] border-x border-t border-white/20" />
          <div className="pointer-events-none absolute left-1/2 top-[25%] -translate-x-1/2 -translate-y-1/2 text-[42px] font-black uppercase tracking-[0.35em] text-white/[0.045] whitespace-nowrap">
            {formatTeamName(homeTeam?.name)}
          </div>
          <div className="pointer-events-none absolute left-1/2 top-[75%] -translate-x-1/2 -translate-y-1/2 text-[42px] font-black uppercase tracking-[0.35em] text-white/[0.045] whitespace-nowrap">
            {formatTeamName(awayTeam?.name)}
          </div>

          {homeNodes.map((node) => (
            <TeamMarker
              key={node.id}
              node={node}
              side="home"
              eventStats={playerEventMap.get(node.playerId)}
              onPlayerSelect={onPlayerSelect}
              teamName={homeTeam?.name}
              teamLogo={homeTeam?.logo}
            />
          ))}

          {awayNodes.map((node) => (
            <TeamMarker
              key={node.id}
              node={node}
              side="away"
              eventStats={playerEventMap.get(node.playerId)}
              onPlayerSelect={onPlayerSelect}
              teamName={awayTeam?.name}
              teamLogo={awayTeam?.logo}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <TeamInfoCard side="away" team={awayTeam} formation={awayFormation} isProbable={isProbable} />
        </div>
      </div>
    </div>
  );
}
