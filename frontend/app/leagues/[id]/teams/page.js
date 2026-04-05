'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Search, Activity } from "lucide-react";
import { leagueConfig } from "@/lib/leagueConfig";
import { formatTeamName } from "@/lib/text";

export default function LeagueTeamsPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
    <div className="bg-[#0f172a] min-h-screen p-8 text-slate-300">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push(`/leagues/${current.key}`)}
          className="mb-6 text-blue-400 font-black text-[11px] uppercase flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Lig Ozetine Don
        </button>

        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-700 p-3 flex items-center justify-center">
              <img src={current.logo} alt={current.title} className="max-h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white italic uppercase">{current.title}</h1>
              <p className="text-xs font-bold text-slate-500 uppercase">{current.country} • {teams.length} TAKIM</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Takim ara..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1e293b] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {filteredTeams.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredTeams.map((team) => (
              <div
                key={team._id}
                onClick={() => router.push(`/?search=${encodeURIComponent(team.name)}`)}
                className="bg-[#1e293b] p-8 rounded-[35px] flex flex-col items-center gap-4 hover:scale-105 transition-all cursor-pointer border border-slate-700/50 shadow-xl"
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
