"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { History, Trophy } from "lucide-react";
import MatchList from "../../components/MatchList";
import { leagueList } from "@/lib/leagueConfig";

function HistoryContent() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLeague = searchParams.get("league") || "all";

  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory(activeLeague);
  }, [activeLeague]);

  async function loadHistory(leagueKey) {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("goalio_token");
      const suffix = leagueKey && leagueKey !== "all" ? `?league=${leagueKey}` : "";
      const res = await fetch(`${api}/matches/history${suffix}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Geçmiş maçlar alınamadı");
        setMatches([]);
        return;
      }

      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage("Geçmiş maçlar alınamadı");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  const filters = [{ key: "all", title: "Tüm Ligler" }, ...leagueList.map((league) => ({ key: league.key, title: league.title }))];

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 md:p-10 text-slate-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-6 border-b border-slate-700/40 pb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <History className="text-blue-400" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Geçmiş Maçlar</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => router.push(filter.key === "all" ? "/history" : `/history?league=${filter.key}`)}
                className={`px-4 py-2 rounded-2xl text-xs font-black tracking-[0.2em] border transition-all ${
                  activeLeague === filter.key
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-[#1e293b] border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-500"
                }`}
              >
                {filter.title}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-4 text-sm font-bold">
            {message}
          </div>
        )}

        {loading ? (
          <div className="h-[300px] rounded-[35px] bg-[#1e293b]/40 border border-slate-700/50 flex items-center justify-center text-slate-400 font-bold animate-pulse">
            Maçlar yükleniyor...
          </div>
        ) : matches.length > 0 ? (
          <MatchList title="Tamamlanan Maçlar" matches={matches} variant="history" />
        ) : (
          <div className="h-[300px] rounded-[35px] bg-[#1e293b]/40 border border-dashed border-slate-700/50 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Trophy size={36} />
            <p className="text-sm font-black uppercase tracking-[0.3em]">Bu filtrede maç bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f172a] p-6 md:p-10 text-slate-300">
          <div className="max-w-7xl mx-auto h-[300px] rounded-[35px] bg-[#1e293b]/40 border border-slate-700/50 flex items-center justify-center text-slate-400 font-bold animate-pulse">
            Maçlar yükleniyor...
          </div>
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}
