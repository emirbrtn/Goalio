'use client';

import { useRouter } from "next/navigation";
import { Trophy, ArrowLeft } from "lucide-react";
import { leagueList } from "@/lib/leagueConfig";

export default function AllLeaguesPage() {
  const router = useRouter();

  return (
    <div className="bg-[#0f172a] min-h-screen p-8 text-slate-300">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-blue-400 font-black text-[11px] uppercase mb-8 hover:text-blue-300 transition-all"
        >
          <ArrowLeft size={16} /> DASHBOARD'A DON
        </button>

        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-12 flex items-center gap-4">
          <Trophy className="text-yellow-500" size={40} /> POPULER LIGLER
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leagueList.map((league) => (
            <div
              key={league.key}
              onClick={() => router.push(`/leagues/${league.key}`)}
              className="bg-[#1e293b] border border-slate-700/50 p-10 rounded-[40px] flex items-center gap-8 hover:bg-[#24334d] hover:scale-105 transition-all cursor-pointer group shadow-2xl"
            >
              <div className="w-20 h-20 bg-white rounded-[20px] p-3 flex items-center justify-center border-2 border-slate-700">
                <img src={league.logo} alt={league.title} className="max-h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white italic tracking-tight">{league.title}</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{league.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
