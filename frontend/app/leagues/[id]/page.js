'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Loader2,
  Radio,
  Shield,
  Trophy,
} from "lucide-react";
import { leagueConfig } from "@/lib/leagueConfig";
import { formatLeagueName, formatMatchDateTime, formatTeamName } from "@/lib/text";

function LeagueMatchRow({ match, router }) {
  const dateLabel = formatMatchDateTime(match.startTime || match.date) || "-";

  return (
    <button
      type="button"
      onClick={() => router.push(`/matches/${match._id}`)}
      className="w-full rounded-[22px] border border-slate-700/50 bg-[#111827] px-4 py-4 text-left transition-colors hover:bg-[#1e293b]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            {dateLabel}
          </div>
          <div className="mt-2 text-sm font-black text-white">
            {formatTeamName(match.homeTeam?.name)} vs {formatTeamName(match.awayTeam?.name)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="rounded-xl border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm font-black text-blue-300">
            {match.status === "scheduled"
              ? "- : -"
              : `${match.score?.home ?? 0} : ${match.score?.away ?? 0}`}
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            {match.status === "live" ? "Canli" : match.status === "finished" ? "Tamamlandi" : "Yakinda"}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function LeagueOverviewPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const current = leagueConfig[id] || null;

  useEffect(() => {
    const fetchOverview = async () => {
      if (!current) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/teams/league-overview/${current.key}`);
        const data = await res.json();
        setOverview(res.ok ? data : null);
      } catch (error) {
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [apiBase, current]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a]">
        <Loader2 className="animate-spin text-blue-500" size={60} />
      </div>
    );
  }

  if (!current || !overview) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white font-bold">
        Lig verisi bulunamadi.
      </div>
    );
  }

  const standings = Array.isArray(overview.standings) ? overview.standings : [];
  const topScorers = Array.isArray(overview.topscorers) ? overview.topscorers : [];
  const champions = Array.isArray(overview.champions) ? overview.champions : [];
  const recentMatches = Array.isArray(overview.recentMatches) ? overview.recentMatches : [];
  const upcomingMatches = Array.isArray(overview.upcomingMatches) ? overview.upcomingMatches : [];

  return (
    <div className="bg-[#0f172a] min-h-screen p-8 text-slate-300">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/leagues')}
          className="mb-6 text-blue-400 font-black text-[11px] uppercase flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Tum Liglere Don
        </button>

        <div className="rounded-[42px] border border-slate-700/50 bg-[#1e293b] p-10 shadow-2xl">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-slate-700 bg-white p-4">
                <img src={current.logo} alt={current.title} className="max-h-full object-contain" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-400">
                  League Overview
                </div>
                <h1 className="mt-2 text-4xl font-black italic tracking-tight text-white">
                  {current.title}
                </h1>
                <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  <span className="rounded-2xl border border-slate-700 bg-[#0f172a] px-4 py-2">
                    {overview.league?.country || current.country}
                  </span>
                  {overview.league?.seasonName ? (
                    <span className="rounded-2xl border border-slate-700 bg-[#0f172a] px-4 py-2">
                      {overview.league.seasonName}
                    </span>
                  ) : null}
                  {overview.league?.currentStage ? (
                    <span className="rounded-2xl border border-slate-700 bg-[#0f172a] px-4 py-2">
                      {overview.league.currentStage}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/leagues/${current.key}/teams`)}
              className="inline-flex items-center gap-3 self-start rounded-[24px] border border-blue-500/20 bg-blue-500/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-blue-300 transition-colors hover:bg-blue-500/15"
            >
              Takimlar
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[26px] border border-slate-700/50 bg-[#111827] p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Lig Takimlari</div>
              <div className="mt-3 text-3xl font-black text-white">{overview.stats?.teamsCount ?? 0}</div>
            </div>
            <div className="rounded-[26px] border border-slate-700/50 bg-[#111827] p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Aktif Canli Mac</div>
              <div className="mt-3 text-3xl font-black text-red-400">{overview.stats?.liveCount ?? 0}</div>
            </div>
            <div className="rounded-[26px] border border-slate-700/50 bg-[#111827] p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Yaklasan Mac</div>
              <div className="mt-3 text-3xl font-black text-amber-300">{overview.stats?.upcomingCount ?? 0}</div>
            </div>
            <div className="rounded-[26px] border border-slate-700/50 bg-[#111827] p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Tamamlanan Mac</div>
              <div className="mt-3 text-3xl font-black text-emerald-300">{overview.stats?.finishedCount ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <section className="rounded-[36px] border border-slate-700/50 bg-[#1e293b] p-8">
              <div className="mb-5 flex items-center gap-3">
                <Shield className="text-cyan-400" size={20} />
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Puan Tablosu</h2>
              </div>
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {standings.map((entry) => (
                  <div key={entry.team?._id || entry.position} className="flex items-center justify-between rounded-[22px] border border-slate-700/50 bg-[#111827] px-4 py-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-sm font-black text-blue-400">
                        {entry.position}
                      </div>
                      <img src={entry.team?.logo} alt={entry.team?.name} className="h-9 w-9 object-contain" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-white">{formatTeamName(entry.team?.name)}</div>
                      </div>
                    </div>
                    <div className="text-lg font-black text-blue-300">{entry.points}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[36px] border border-slate-700/50 bg-[#1e293b] p-8">
              <div className="mb-5 flex items-center gap-3">
                <Trophy className="text-amber-300" size={20} />
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Son Sampiyonlar</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {champions.length > 0 ? champions.map((entry) => (
                  <div key={entry.teamId} className="rounded-[24px] border border-slate-700/50 bg-[#111827] p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-white p-2">
                        <img src={entry.logo} alt={entry.name} className="max-h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-white">{formatTeamName(entry.name)}</div>
                        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
                          {entry.titles} Sampiyonluk
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[22px] border border-dashed border-slate-700/50 px-5 py-10 text-center text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 md:col-span-2">
                    Sampiyonluk verisi su an kullanilabilir degil
                  </div>
                )}
              </div>
              {overview.championsCoverage?.processedSeasons ? (
                <div className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  Gecmis 2 sezonun sampiyonlari
                </div>
              ) : null}
            </section>

            <section className="rounded-[36px] border border-slate-700/50 bg-[#1e293b] p-8">
              <div className="mb-5 flex items-center gap-3">
                <Calendar className="text-blue-400" size={20} />
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Yaklasan Maclar</h2>
              </div>
              <div className="space-y-3">
                {upcomingMatches.length > 0 ? upcomingMatches.map((match) => (
                  <LeagueMatchRow key={match._id} match={match} router={router} />
                )) : (
                  <div className="rounded-[22px] border border-dashed border-slate-700/50 px-5 py-10 text-center text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                    Yaklasan mac verisi yok
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="rounded-[36px] border border-slate-700/50 bg-[#1e293b] p-8">
            <div className="mb-5 flex items-center gap-3">
              <Radio className="text-red-400" size={20} />
              <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Son Oynanan Maclar</h2>
            </div>
            <div className="space-y-3">
              {recentMatches.length > 0 ? recentMatches.map((match) => (
                <LeagueMatchRow key={match._id} match={match} router={router} />
              )) : (
                <div className="rounded-[22px] border border-dashed border-slate-700/50 px-5 py-10 text-center text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Gecmis mac verisi yok
                </div>
              )}
            </div>

            <div className="mt-8 rounded-[36px] border border-slate-700/50 bg-[#111827] p-8">
              <div className="mb-5 flex items-center gap-3">
                <Trophy className="text-blue-400" size={20} />
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Gol Kralligi</h2>
              </div>
              <div className="space-y-3">
                {topScorers.length > 0 ? topScorers.map((entry, index) => (
                  <div key={`${entry.playerId || entry.name}-${index}`} className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-700/50 bg-[#0f172a] px-4 py-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-sm font-black text-blue-400">
                        {index + 1}
                      </div>
                      <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-700 bg-[#1e293b]">
                        {entry.image ? (
                          <img src={entry.image} alt={entry.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-black text-blue-300">
                            {String(entry.name || "?").slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-white">{entry.name}</div>
                        <div className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                          {formatTeamName(entry.teamName || "")}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-[#1e293b] px-4 py-2 text-lg font-black text-amber-300">
                      {entry.goals}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[22px] border border-dashed border-slate-700/50 px-5 py-10 text-center text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                    Gol kralligi verisi bulunamadi
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-[26px] border border-slate-700/50 bg-[#111827] p-5">
              <div className="flex items-center gap-3">
                <Shield className="text-purple-400" size={18} />
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Lig Ozeti
                </div>
              </div>
              <div className="mt-4 text-sm leading-7 text-slate-300">
                {formatLeagueName(current.title)} icin aktif sezon, lider takimlar, son oynanan maclar ve en yakin fikstur burada toplanir.
                Takim kadrolarina gecmek icin yukaridaki <span className="font-black text-blue-300">Takimlar</span> butonunu kullanabilirsin.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
