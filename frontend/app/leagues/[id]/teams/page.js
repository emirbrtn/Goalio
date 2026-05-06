'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Search, Activity } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { leagueConfig } from "@/lib/leagueConfig";
import { formatTeamName } from "@/lib/text";

export default function LeagueTeamsPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const apiBase = getApiBaseUrl();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const current = leagueConfig[id] || null;

  useEffect(() => {
    const fetchLeagueData = async () => {
      if (!current) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/teams/league/${current.key}`);
        const data = await res.json();
        setTeams(Array.isArray(data.teams) ? data.teams : []);
      } catch (error) {
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [apiBase, current]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a]">
        <Loader2 className="animate-spin text-blue-500" size={60} />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white font-bold">
        Lig bulunamadi.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 text-slate-300 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push(`/leagues/${current.key}`)}
          className="mb-6 text-blue-400 font-black text-[11px] uppercase flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Lig Ozetine Don
        </button>

        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-white p-3">
              <img src={current.logo} alt={current.title} className="max-h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-black uppercase italic text-white sm:text-4xl">{current.title}</h1>
              <p className="text-xs font-bold text-slate-500 uppercase">{current.country} • {teams.length} TAKIM</p>
            </div>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Takim ara..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#1e293b] py-2 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5 xl:gap-6">
            {filteredTeams.map((team) => (
              <div
                key={team._id}
                onClick={() => router.push(`/?search=${encodeURIComponent(team.name)}`)}
                className="flex cursor-pointer flex-col items-center gap-4 rounded-[28px] border border-slate-700/50 bg-[#1e293b] p-6 shadow-xl transition-all hover:scale-105 sm:rounded-[35px] sm:p-8"
              >
                <div className="w-20 h-20 bg-white rounded-2xl p-4 flex items-center justify-center border-2 border-slate-800">
                  <img src={team.logo} alt={team.name} className="max-h-full object-contain" />
                </div>
                <p className="text-sm font-black text-white text-center">{formatTeamName(team.name)}</p>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Takim Sayfasi</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 border-2 border-dashed border-slate-800 rounded-[50px]">
            <Activity size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 font-black uppercase italic">TAKIM VERISI BULUNAMADI.</p>
          </div>
        )}
      </div>
    </div>
  );
}
