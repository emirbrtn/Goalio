"use client";

import { useRouter } from "next/navigation";
import { formatLeagueName, formatLiveMinute, formatMatchDateTime, formatTeamName, getLeagueLogo } from "@/lib/text";

export default function MatchList({
  title,
  matches = [],
  variant = "default",
  className = "",
  showScheduleMeta = false,
  onTeamSelect = null,
}) {
  const router = useRouter();

  if (!matches || matches.length === 0) return null;

  const isLiveVariant = variant === "live";
  const isLiveHomeVariant = variant === "live-home";
  const isAnyLiveVariant = isLiveVariant || isLiveHomeVariant;
  const isHistoryVariant = variant === "history";
  const isScoreboardVariant = variant === "scoreboard";

  const wrapperClass = isAnyLiveVariant
    ? "bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.16),_transparent_32%),linear-gradient(145deg,#111827,#0b1220)] border-red-500/20 shadow-[0_24px_60px_rgba(127,29,29,0.18)]"
    : "bg-[#1e293b]/60 border-slate-700/50";

  const itemClass = isAnyLiveVariant
    ? "bg-[#0b1220]/80 hover:bg-[#111827] border-red-500/10 hover:border-red-500/40"
    : isScoreboardVariant
      ? "bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(20,31,54,0.96))] hover:bg-[#13203a] border-slate-700/50 hover:border-blue-500/50"
      : isHistoryVariant
        ? "bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(20,31,54,0.95))] hover:bg-[#13203a] border-slate-700/50 hover:border-blue-500/50"
        : "bg-[#0f172a]/50 hover:bg-[#0f172a] border-slate-700/50 hover:border-blue-500/50";

  const scoreClass = isAnyLiveVariant
    ? "text-white bg-red-500/10 border-red-500/20"
    : isScoreboardVariant
      ? "text-white bg-[linear-gradient(145deg,rgba(30,41,59,0.95),rgba(15,23,42,0.95))] border-blue-500/20 shadow-[0_10px_30px_rgba(30,64,175,0.12)]"
      : isHistoryVariant
        ? "text-white bg-[linear-gradient(145deg,rgba(30,41,59,0.95),rgba(15,23,42,0.95))] border-blue-500/20 shadow-[0_10px_30px_rgba(30,64,175,0.12)]"
        : "text-white bg-slate-800/80 border-slate-700/50";

  const getScoreText = (match) => {
    if (match?.status === "scheduled") return "- : -";
    return `${match?.score?.home ?? "-"} : ${match?.score?.away ?? "-"}`;
  };

  const getScheduleText = (match) => formatMatchDateTime(match?.startTime || match?.date);

  const goToTeamPage = (event, teamName, teamId, teamData = null) => {
    event.stopPropagation();
    if (typeof onTeamSelect === "function") {
      onTeamSelect(teamName, teamId, teamData);
      return;
    }

    const query = new URLSearchParams({ search: teamName });
    if (teamId) query.set("teamId", String(teamId));
    router.push(`/?${query.toString()}`);
  };

  return (
    <div className={`border rounded-2xl p-6 ${wrapperClass} ${className}`}>
      {title ? (
        <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-white">
          <span className={`h-6 w-1.5 rounded-full ${isAnyLiveVariant ? "bg-red-500" : "bg-blue-500"}`}></span>
          {title}
        </h3>
      ) : null}

      <div className="space-y-3">
        {matches.map((match) => {
          const matchId = match._id || match.id || match.sportsmonkData?.id;
          const liveMinuteLabel = formatLiveMinute(match);
          const leagueLogo = getLeagueLogo(match?.league);

          if (isAnyLiveVariant) {
            return (
              <div
                key={matchId || `${match.homeTeam?.name}-${match.awayTeam?.name}-${match.startTime}`}
                onClick={() => {
                  if (matchId) {
                    router.push(`/matches/${matchId}`);
                  } else {
                    alert("Bu maçın ID'si bulunamadı!");
                  }
                }}
                className={`group cursor-pointer rounded-[24px] border transition-all ${itemClass} ${
                  isLiveHomeVariant ? "p-4 md:p-5" : "p-6 md:p-7"
                }`}
              >
                <div className={`flex flex-col ${isLiveHomeVariant ? "gap-4" : "gap-5"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-2">
                      {leagueLogo ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-1">
                          <img src={leagueLogo} alt={formatLeagueName(match.league) || "Lig"} className="max-h-full object-contain" />
                        </div>
                      ) : null}
                      <div className={`min-w-0 font-black uppercase tracking-[0.18em] text-slate-400 ${isLiveHomeVariant ? "text-[11px]" : "text-[13px]"}`}>
                        {formatLeagueName(match.league) || "Bilinmeyen Lig"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
                      <span className={`font-black uppercase tracking-[0.22em] text-red-400 ${isLiveHomeVariant ? "text-[10px]" : "text-[11px]"}`}>Canlı</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <button
                      type="button"
                      onClick={(event) => goToTeamPage(event, match.homeTeam?.name || "Ev Sahibi", match.homeTeam?._id, match.homeTeam)}
                      className="flex min-w-0 items-center justify-end gap-3 text-right"
                    >
                      <div className="min-w-0">
                        <div className={`truncate font-black tracking-tight text-white ${isLiveHomeVariant ? "text-base md:text-[18px]" : "text-lg md:text-[22px]"}`}>
                          {formatTeamName(match.homeTeam?.name || "Ev Sahibi")}
                        </div>
                      </div>
                      {match.homeTeam?.logo ? (
                        <img
                          src={match.homeTeam.logo}
                          alt="home"
                          className={`${isLiveHomeVariant ? "h-9 w-9" : "h-11 w-11"} rounded-full bg-slate-800 object-contain p-1 shadow-lg`}
                        />
                      ) : null}
                    </button>

                    <div className={`rounded-[20px] border border-red-500/20 bg-[linear-gradient(145deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] text-center shadow-[0_10px_30px_rgba(127,29,29,0.18)] ${isLiveHomeVariant ? "px-4 py-3" : "px-5 py-4"}`}>
                      <div className={`font-extrabold tracking-tight text-white ${isLiveHomeVariant ? "text-[30px] md:text-[34px]" : "text-3xl md:text-4xl"}`}>
                        {getScoreText(match)}
                      </div>
                      <div className={`mt-2 font-black italic tracking-tight text-red-400 ${isLiveHomeVariant ? "text-[12px]" : "text-[13px]"}`}>
                        {liveMinuteLabel || "Canlı"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => goToTeamPage(event, match.awayTeam?.name || "Deplasman", match.awayTeam?._id, match.awayTeam)}
                      className="flex min-w-0 items-center justify-start gap-3 text-left"
                    >
                      {match.awayTeam?.logo ? (
                        <img
                          src={match.awayTeam.logo}
                          alt="away"
                          className={`${isLiveHomeVariant ? "h-9 w-9" : "h-11 w-11"} rounded-full bg-slate-800 object-contain p-1 shadow-lg`}
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className={`truncate font-black tracking-tight text-white ${isLiveHomeVariant ? "text-base md:text-[18px]" : "text-lg md:text-[22px]"}`}>
                          {formatTeamName(match.awayTeam?.name || "Deplasman")}
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className={`flex items-center justify-between gap-4 border-t border-white/5 ${isLiveHomeVariant ? "pt-3" : "pt-4"}`}>
                    <div className={`font-black uppercase tracking-[0.2em] text-slate-500 ${isLiveHomeVariant ? "text-[10px]" : "text-[12px]"}`}>
                      {getScheduleText(match) || "Tarih bilinmiyor"}
                    </div>
                    <div className={`rounded-full border border-red-500/20 bg-red-500/10 font-black uppercase tracking-[0.22em] text-red-300 ${isLiveHomeVariant ? "px-2.5 py-1 text-[9px]" : "px-3 py-1 text-[10px]"}`}>
                      Maç merkezi açık
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={matchId || `${match.homeTeam?.name}-${match.awayTeam?.name}-${match.startTime}`}
              onClick={() => {
                if (matchId) {
                  router.push(`/matches/${matchId}`);
                } else {
                  alert("Bu maçın ID'si bulunamadı!");
                }
              }}
              className={`group flex cursor-pointer items-center justify-between rounded-xl border transition-all ${
                isHistoryVariant ? "p-6 md:p-7" : isScoreboardVariant ? "p-5 md:p-6" : "p-4"
              } ${itemClass}`}
            >
              <div className={`min-w-0 flex-1 ${isHistoryVariant || isScoreboardVariant ? "pr-6" : "pr-4"}`}>
                <div className={`flex flex-col ${isHistoryVariant || isScoreboardVariant ? "gap-4" : "gap-2"}`}>
                  <div className={`flex flex-wrap items-center ${isHistoryVariant || isScoreboardVariant ? "gap-3 md:gap-5" : "gap-2 md:gap-3"} text-slate-200`}>
                    <div className={`flex items-center ${isHistoryVariant || isScoreboardVariant ? "gap-3" : "gap-2"}`}>
                      {match.homeTeam?.logo ? (
                        <img
                          src={match.homeTeam.logo}
                          alt="home"
                          className={isHistoryVariant || isScoreboardVariant ? "h-10 w-10 rounded-full bg-slate-800 object-contain p-1 shadow-lg" : "h-6 w-6 rounded-full bg-slate-800 object-contain p-0.5"}
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={(event) => goToTeamPage(event, match.homeTeam?.name || "Ev Sahibi", match.homeTeam?._id, match.homeTeam)}
                        className={`text-left font-medium transition-colors hover:text-blue-400 ${
                          isHistoryVariant || isScoreboardVariant
                            ? "max-w-[220px] truncate text-lg font-black tracking-tight text-white md:max-w-sm"
                            : "max-w-[120px] truncate md:max-w-xs"
                        }`}
                      >
                        {formatTeamName(match.homeTeam?.name || "Ev Sahibi")}
                      </button>
                    </div>
                    <span className={`px-1 ${isHistoryVariant || isScoreboardVariant ? "text-sm font-black tracking-[0.25em] text-slate-500" : "text-[10px] text-slate-500 md:text-xs"}`}>VS</span>
                    <div className={`flex items-center ${isHistoryVariant || isScoreboardVariant ? "gap-3" : "gap-2"}`}>
                      {match.awayTeam?.logo ? (
                        <img
                          src={match.awayTeam.logo}
                          alt="away"
                          className={isHistoryVariant || isScoreboardVariant ? "h-10 w-10 rounded-full bg-slate-800 object-contain p-1 shadow-lg" : "h-6 w-6 rounded-full bg-slate-800 object-contain p-0.5"}
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={(event) => goToTeamPage(event, match.awayTeam?.name || "Deplasman", match.awayTeam?._id, match.awayTeam)}
                        className={`text-left font-medium transition-colors hover:text-blue-400 ${
                          isHistoryVariant || isScoreboardVariant
                            ? "max-w-[220px] truncate text-lg font-black tracking-tight text-white md:max-w-sm"
                            : "max-w-[120px] truncate md:max-w-xs"
                        }`}
                      >
                        {formatTeamName(match.awayTeam?.name || "Deplasman")}
                      </button>
                    </div>
                  </div>

                  <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${isHistoryVariant ? "text-sm" : ""}`}>
                    <div className={`flex items-center gap-2 truncate font-medium tracking-wide text-slate-400 ${
                      isHistoryVariant || isScoreboardVariant ? "text-[13px] font-bold uppercase tracking-[0.16em]" : "text-[10px] md:text-xs"
                    }`}>
                      {leagueLogo ? (
                        <div className={`${isHistoryVariant || isScoreboardVariant ? "h-7 w-7" : "h-5 w-5"} flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-0.5`}>
                          <img src={leagueLogo} alt={formatLeagueName(match.league) || "Lig"} className="max-h-full object-contain" />
                        </div>
                      ) : null}
                      {formatLeagueName(match.league) || "Bilinmeyen Lig"}
                    </div>
                    {getScheduleText(match) ? (
                      <div className={`truncate font-black uppercase text-blue-300/80 ${
                        isHistoryVariant || isScoreboardVariant ? "text-[12px] tracking-[0.2em]" : "text-[10px] tracking-[0.18em] md:text-[11px]"
                      }`}>
                        {getScheduleText(match)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={`flex flex-shrink-0 flex-col items-end ${isHistoryVariant || isScoreboardVariant ? "gap-2.5" : "gap-1.5"}`}>
                <div className={`rounded-lg border font-extrabold ${
                  isHistoryVariant || isScoreboardVariant
                    ? "min-w-[92px] px-5 py-3 text-3xl tracking-tight md:min-w-[108px]"
                    : "px-3 py-1.5 text-lg md:px-4 md:text-xl"
                } ${scoreClass}`}>
                  {getScoreText(match)}
                </div>
                <div className={`flex flex-col items-end whitespace-nowrap font-semibold ${isHistoryVariant || isScoreboardVariant ? "text-[11px] md:text-[13px]" : "text-[10px] md:text-xs"}`}>
                  {match.status === "live" && liveMinuteLabel ? (
                    <span className="mb-1 text-[13px] font-black italic tracking-tight text-red-400 md:text-[15px]">
                      {liveMinuteLabel}
                    </span>
                  ) : null}
                  {match.status === "live" ? (
                    <span className="flex items-center justify-end gap-1 text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      Canlı
                    </span>
                  ) : match.status === "finished" ? (
                    <span className="text-slate-400">Tamamlandı</span>
                  ) : (
                    <span className="text-blue-400">Yakında</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
