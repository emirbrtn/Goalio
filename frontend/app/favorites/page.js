'use client';

import { useEffect, useState } from "react";
import { Star, Shield, User, ArrowLeft, HeartOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PlayerProfileModal from "../../components/PlayerProfileModal";

export default function FavoritesPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [favTeams, setFavTeams] = useState([]);
  const [favPlayers, setFavPlayers] = useState([]);
  const [activePlayer, setActivePlayer] = useState(null);

  const readCurrentUser = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("goalio_user");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }              
  };

  const getUserStorageId = (targetUser = user) =>
    String((targetUser || readCurrentUser())?.id || (targetUser || readCurrentUser())?._id || "").trim();

  const getFavoriteStorageKey = (type, targetUser = user) => {
    const userId = getUserStorageId(targetUser);
    return userId ? `goalio_fav_${type}_user_${userId}` : null;
  };

  const readFavoriteStorage = (type, targetUser = user) => {
    if (typeof window === "undefined") return [];
    const storageKey = getFavoriteStorageKey(type, targetUser);
    if (!storageKey) return [];

    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  };

  const writeFavoriteStorage = (type, value, targetUser = user) => {
    if (typeof window === "undefined") return;
    const storageKey = getFavoriteStorageKey(type, targetUser);
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(value));
  };

  const persistFavoritesForUser = async (nextTeams, nextPlayers, targetUser = user) => {
    const currentUser = targetUser || readCurrentUser();
    const userId = getUserStorageId(currentUser);
    const token = typeof window !== "undefined" ? localStorage.getItem("goalio_token") : null;
    if (!userId || !token) return false;

    try {
      const response = await fetch(`${apiBase}/users/${userId}/favorites-data`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teams: nextTeams,
          players: nextPlayers,
        }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const syncFavorites = () => {
    const nextUser = readCurrentUser();
    setUser(nextUser);
    const userId = getUserStorageId(nextUser);
    const token = typeof window !== "undefined" ? localStorage.getItem("goalio_token") : null;

    if (userId && token) {
      fetch(`${apiBase}/users/${userId}/favorites-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("favorites-fetch-failed");
          const data = await response.json();
          const nextTeams = Array.isArray(data?.teams) ? data.teams : [];
          const nextPlayers = Array.isArray(data?.players) ? data.players : [];
          setFavTeams(nextTeams);
          setFavPlayers(nextPlayers);
          writeFavoriteStorage("teams", nextTeams, nextUser);
          writeFavoriteStorage("players", nextPlayers, nextUser);
        })
        .catch(() => {
          setFavTeams(readFavoriteStorage("teams", nextUser));
          setFavPlayers(readFavoriteStorage("players", nextUser));
        });
      return;
    }

    setFavTeams([]);
    setFavPlayers([]);
  };

  useEffect(() => {
    syncFavorites();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncFavorites();
      }
    };

    const handleStorage = (event) => {
      if (!event.key || event.key.startsWith("goalio_user") || event.key.startsWith("goalio_fav_")) {
        syncFavorites();
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const removeTeam = (name) => {
    const updated = favTeams.filter(t => t.name !== name);
    setFavTeams(updated);
    writeFavoriteStorage("teams", updated);
    persistFavoritesForUser(updated, favPlayers);
  };

  const removePlayer = (name) => {
    const updated = favPlayers.filter(p => p.name !== name);
    setFavPlayers(updated);
    writeFavoriteStorage("players", updated);
    persistFavoritesForUser(favTeams, updated);
  };

  const openPlayerProfile = (player) => {
    if (!player) return;
    setActivePlayer({
      id: player.id || player._id || player.player_id || null,
      _id: player._id || player.id || player.player_id || null,
      name: player.name || player.player_name || "Futbolcu",
      image: player.image || "",
      position: player.position || "",
      teamName: player.teamName || "",
      teamLogo: player.teamLogo || "",
      number: player.jersey_number || player.number || null,
    });
  };

  return (
    <div className="bg-[#0f172a] min-h-screen p-8 text-slate-300 font-sans selection:bg-yellow-500/30">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push('/')} className="mb-8 flex items-center gap-3 text-yellow-500 font-black text-[11px] uppercase tracking-[0.3em] group hover:text-yellow-400 transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> DASHBOARD'A DÖN
        </button>

        <div className="flex items-center gap-4 mb-12 border-b border-slate-700/50 pb-6">
            <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-2 rounded-full bg-yellow-500/12 blur-xl animate-pulse" />
                <Star size={34} className="relative fill-yellow-500 text-yellow-500 drop-shadow-[0_0_12px_rgba(234,179,8,0.35)] transition-all duration-300 animate-pulse" />
            </div>
            <div>
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Favorilerim</h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Takım ve Oyuncu Koleksiyonu</p>
            </div>
        </div>

        <h3 className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[#d4bfa6] font-black uppercase tracking-[0.4em] flex items-center gap-4 text-[12px] italic border-l-4 border-yellow-500 pl-4 mb-6"><Shield size={18} className="text-yellow-500" /> TAKIMLAR ({favTeams.length})</h3>

        {!getUserStorageId() ? (
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs mb-16 italic border border-dashed border-slate-700/50 p-10 rounded-3xl text-center">Favorileri gormek icin giris yapmalisin.</p>
        ) : favTeams.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-16">
                {favTeams.map((team, idx) => (
                    <div key={idx} onClick={() => router.push(`/?search=${encodeURIComponent(team.name)}`)} className="relative flex cursor-pointer flex-col items-center gap-4 rounded-[30px] p-6 transition-all duration-200 hover:-translate-y-2 hover:bg-white/[0.03] group">
                        <button onClick={(e) => { e.stopPropagation(); removeTeam(team.name); }} className="absolute top-3 right-3 text-slate-600 hover:text-red-500 transition-colors z-20">
                            <HeartOff size={16} />
                        </button>
                        <div className="w-20 h-20 bg-white rounded-[20px] p-3 shadow-inner flex items-center justify-center border-4 border-[#0f172a]">
                            <img src={team.logo} alt={team.name} className="max-h-full object-contain" />
                        </div>
                        <span className="text-[13px] font-black text-white text-center uppercase italic leading-tight group-hover:text-yellow-500 transition-colors">{team.name}</span>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs mb-16 italic border border-dashed border-slate-700/50 p-10 rounded-3xl text-center">Favori takım bulunmuyor.</p>
        )}

        <h3 className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[#d4bfa6] font-black uppercase tracking-[0.4em] flex items-center gap-4 text-[12px] italic border-l-4 border-blue-500 pl-4 mb-6"><User size={18} className="text-blue-500" /> OYUNCULAR ({favPlayers.length})</h3>

        {!getUserStorageId() ? (
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs italic border border-dashed border-slate-700/50 p-10 rounded-3xl text-center">Favori oyuncular icin once giris yapmalisin.</p>
        ) : favPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favPlayers.map((p, idx) => (
                    <div key={idx} role="button" tabIndex={0} onClick={() => openPlayerProfile(p)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPlayerProfile(p); } }} className="group relative flex cursor-pointer items-start gap-5 rounded-[25px] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.03]">
                        <button onClick={(e) => { e.stopPropagation(); removePlayer(p.name); }} className="absolute top-3 right-3 text-slate-600 hover:text-red-500 transition-colors z-20">
                            <HeartOff size={16} />
                        </button>
                        <div className="w-14 h-14 rounded-full bg-[#0f172a] border-2 border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {p.image ? (<img src={p.image} className="w-full h-full object-cover" />) : (<span className="text-sm font-black text-blue-500">{p.jersey_number || "-"}</span>)}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center pr-6">
                            <span className="text-[14px] font-bold text-white leading-[1.15] break-words whitespace-normal">{String(p.name || "")}</span>
                            <span className="mt-2 text-[10px] font-semibold text-blue-400 uppercase tracking-[0.18em] leading-tight break-words whitespace-normal">{p.teamName}</span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs italic border border-dashed border-slate-700/50 p-10 rounded-3xl text-center">Favori oyuncu bulunmuyor.</p>
        )}

        <PlayerProfileModal
          isOpen={Boolean(activePlayer)}
          player={activePlayer}
          onClose={() => setActivePlayer(null)}
          apiBase={apiBase}
        />
      </div>
    </div>
  );
}
