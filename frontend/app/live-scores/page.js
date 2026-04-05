"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Radio, Timer } from "lucide-react";
import MatchList from "../../components/MatchList";
import { leagueList } from "@/lib/leagueConfig";
import { filterActiveLiveMatches, sortLiveMatches, sortMatchesByStart } from "@/lib/matchPriority";

function LiveScoresContent() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLeague = searchParams.get("league") || "all";

  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches(activeLeague);

    const intervalId = setInterval(() => {
      loadMatches(activeLeague, { silent: true });
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadMatches(activeLeague, { silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeLeague]);

  async function loadMatches(leagueKey, options = {}) {
    const { silent = false } = options;
    if (!silent) setLoading(true);
    setMessage("");

    try {
      const suffix = leagueKey && leagueKey !== "all" ? `?league=${leagueKey}` : "";
      const [liveRes, allRes] = await Promise.all([
        fetch(`${api}/matches/live${suffix}`, { cache: "no-store" }),
        fetch(`${api}/matches${suffix}`, { cache: "no-store" }),
      ]);

      const [liveData, allData] = await Promise.all([liveRes.json(), allRes.json()]);

      if (!liveRes.ok || !allRes.ok) {
        setMessage("Canlı skor verileri alınamadı");
        setLiveMatches([]);
        setUpcomingMatches([]);
        return;
      }

      const safeLive = filterActiveLiveMatches(Array.isArray(liveData) ? liveData : []);
      const safeAll = Array.isArray(allData) ? allData : [];
      const scheduled = safeAll.filter((match) => match?.status === "scheduled");

      setLiveMatches(sortLiveMatches(safeLive));
      setUpcomingMatches(sortMatchesByStart(scheduled, "asc"));
    } catch (error) {
      setMessage("Canlı skor verileri alınamadı");
      setLiveMatches([]);
      setUpcomingMatches([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  const filters = [{ key: "all", title: "Tüm Ligler" }, ...leagueList.map((league) => ({ key: league.key, title: league.title }))];
  const hasAnyMatches = liveMatches.length > 0 || upcomingMatches.length > 0;

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 md:p-10 text-slate-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-6 border-b border-slate-700/40 pb-8">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <Radio className="text-red-400 animate-pulse" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Canlı Sonuçlar</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => router.push(filter.key === "all" ? "/live-scores" : `/live-scores?league=${filter.key}`)}
                className={`px-4 py-2 rounded-2xl text-xs font-black tracking-[0.2em] border transition-all ${
                  activeLeague === filter.key
                    ? "bg-red-600/20 border-red-500/40 text-red-300"
                    : "bg-[#1e293b] border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-500"
                }`}
              >
                {filter.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-[28px] border border-red-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.16),_transparent_35%),linear-gradient(145deg,#111827,#0b1220)] px-5 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Aktif canlı maç</div>
              <div className="mt-3 text-3xl font-black text-white">{liveMatches.length}</div>
            </div>
            <div className="rounded-[28px] border border-blue-500/20 bg-blue-500/5 px-5 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Sıradaki maçlar</div>
              <div className="mt-3 text-3xl font-black text-white">{upcomingMatches.length}</div>
            </div>
            <div className="rounded-[28px] border border-slate-700/50 bg-[#111827]/70 px-5 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Filtre</div>
              <div className="mt-3 text-lg font-black text-white">{filters.find((filter) => filter.key === activeLeague)?.title || "Tüm Ligler"}</div>
            </div>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="h-[320px] rounded-[35px] bg-[#1e293b]/40 border border-slate-700/50 flex items-center justify-center text-slate-400 font-bold animate-pulse">
            Canlı skorlar yükleniyor...
          </div>
        ) : hasAnyMatches ? (
          <div className="space-y-8">
            {liveMatches.length > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center gap-4 border-l-4 border-red-600 pl-4 text-[12px] font-black uppercase italic tracking-[0.4em] text-red-500">
                  <Radio size={18} className="animate-pulse" /> Canlı Maçlar
                </div>
                <div className="max-h-[760px] overflow-y-auto pr-2 custom-scrollbar">
                  <MatchList title="" matches={liveMatches} variant="live" />
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <div className="flex items-center gap-4 border-l-4 border-blue-500 pl-4 text-[12px] font-black uppercase italic tracking-[0.4em] text-blue-400">
                {liveMatches.length > 0 ? <Calendar size={18} className="text-blue-400" /> : <Timer size={18} className="text-blue-400" />}
                {liveMatches.length > 0 ? "Sıradaki Maçlar" : "Yaklaşan Maçlar"}
              </div>
              <MatchList title="" matches={upcomingMatches} variant="scoreboard" showScheduleMeta />
            </section>
          </div>
        ) : (
          <div className="h-[320px] rounded-[35px] bg-[#1e293b]/40 border border-dashed border-slate-700/50 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Radio size={36} />
            <p className="text-sm font-black uppercase tracking-[0.3em]">Bu filtrede canlı veya yaklaşan maç yok</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveScoresPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f172a] p-6 md:p-10 text-slate-300">
          <div className="max-w-7xl mx-auto h-[320px] rounded-[35px] bg-[#1e293b]/40 border border-slate-700/50 flex items-center justify-center text-slate-400 font-bold animate-pulse">
            Canlı skorlar yükleniyor...
          </div>
        </div>
      }
    >
      <LiveScoresContent />
    </Suspense>
  );
}
