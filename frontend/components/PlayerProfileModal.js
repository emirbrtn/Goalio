"use client";

import { useEffect, useState } from "react";
import { Activity, CalendarDays, Flag, Footprints, Gauge, Ruler, Shield, Target, Timer, Weight, X } from "lucide-react";

const playerProfileCache = new Map();

function resolvePlayerId(player) {
  return player?.player?.id || player?.player_id || player?._id || player?.id || null;
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function choosePlayer(players, target) {
  const safePlayers = Array.isArray(players) ? players : [];
  if (!target) return safePlayers[0] || null;

  const targetName = normalize(target.name);
  const targetTeam = normalize(target.teamName);

  return (
    safePlayers.find((player) => normalize(player.name) === targetName && (!targetTeam || normalize(player.teamName) === targetTeam)) ||
    safePlayers.find((player) => normalize(player.name) === targetName) ||
    safePlayers.find((player) => normalize(player.name).includes(targetName)) ||
    safePlayers[0] ||
    null
  );
}

function DetailPill({ icon: Icon, label, value, tone = "blue" }) {
  const toneClass = {
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  }[tone];

  if (!value) return null;
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${toneClass}`}>
      <Icon size={16} />
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</div>
        <div className="text-sm font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = "blue" }) {
  const accentClass = {
    blue: "from-blue-500/20 to-cyan-400/5 border-blue-500/20",
    amber: "from-amber-500/20 to-yellow-300/5 border-amber-500/20",
    red: "from-red-500/20 to-rose-300/5 border-red-500/20",
  }[accent];

  return (
    <div className={`rounded-[24px] border bg-gradient-to-br ${accentClass} px-4 py-5`}>
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value ?? "--"}</div>
    </div>
  );
}

function InfoBadge({ image, label, value }) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-3">
      {image ? (
        <img src={image} alt={value} className="h-9 w-9 rounded-full bg-white/90 object-contain p-1" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-300">
          <Flag size={15} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</div>
        <div className="truncate text-sm font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

export default function PlayerProfileModal({ isOpen, player, onClose, apiBase }) {
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !player) return;

    let cancelled = false;

    async function loadPlayer() {
      const resolvedInitialId = resolvePlayerId(player);
      const cacheKey = String(resolvedInitialId || `${player.name}-${player.teamName || ""}`);
      if (playerProfileCache.has(cacheKey)) {
        setPlayerData(playerProfileCache.get(cacheKey));
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      setPlayerData(null);

      try {
        let resolvedPlayer = player;
        const initialPlayerId = resolvedInitialId;

        if (!initialPlayerId && player.name) {
          const searchRes = await fetch(`${apiBase}/players/search?q=${encodeURIComponent(player.name)}`);
          const searchData = await searchRes.json();
          resolvedPlayer = choosePlayer(searchData, player) || player;
        }

        const resolvedId = resolvePlayerId(resolvedPlayer);
        let profile = resolvedPlayer;

        if (resolvedId) {
          const detailRes = await fetch(`${apiBase}/players/${resolvedId}`);
          if (detailRes.ok) {
            profile = await detailRes.json();
          }
        }

        if (!cancelled) {
          const cleanProfile = {
            ...profile,
            stats: profile?.stats || {},
          };
          playerProfileCache.set(cacheKey, cleanProfile);
          setPlayerData(cleanProfile);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError("Oyuncu bilgisi su an yuklenemedi.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlayer();

    return () => {
      cancelled = true;
    };
  }, [apiBase, isOpen, player]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !player) return null;

  const profile = {
    ...player,
    ...playerData,
    number: playerData?.number ?? player?.number ?? player?.jersey_number ?? null,
    stats: playerData?.stats || player?.stats || {},
  };
  const displayStats = profile.stats || {};
  const statBlocks = [
    { label: "Mac", value: displayStats?.appearances, accent: "blue" },
    { label: "Dakika", value: displayStats?.minutes, accent: "blue" },
    { label: "Gol", value: displayStats?.goals, accent: "amber" },
    { label: "Asist", value: displayStats?.assists, accent: "amber" },
    { label: "Pas", value: displayStats?.passes, accent: "blue" },
    { label: "Pas %", value: displayStats?.passAccuracy != null ? `%${displayStats.passAccuracy}` : null, accent: "blue" },
    { label: "Sari Kart", value: displayStats?.yellowCards, accent: "red" },
    { label: "Kirmizi Kart", value: displayStats?.redCards, accent: "red" },
  ];
  const summaryParts = [
    profile.teamName ? `${profile.teamName} formasiyla` : null,
    profile.seasonName ? `${profile.seasonName} sezonunda` : null,
    displayStats?.appearances != null ? `${displayStats.appearances} mac` : null,
    displayStats?.goals != null ? `${displayStats.goals} gol` : null,
    displayStats?.assists != null ? `${displayStats.assists} asist` : null,
  ].filter(Boolean);
  const summaryText = summaryParts.length > 0 ? summaryParts.join(", ") + "." : "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-700/60 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(160deg,#0b1120,#111827_45%,#09101c)] shadow-[0_30px_120px_rgba(2,6,23,0.65)]">
        <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-16 bottom-8 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 border-b border-slate-700/50 px-6 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">Goalio Player Window</div>
              <div className="mt-1 text-2xl font-black uppercase tracking-tight text-white">Oyuncu Profili</div>
            </div>
            <button onClick={onClose} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 text-slate-400 transition-colors hover:border-blue-500/40 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="relative z-10 max-h-[82vh] overflow-y-auto">
        <div className="grid gap-5 p-5 md:grid-cols-[1.1fr,0.9fr] md:p-6">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-700/50 bg-slate-950/45 p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[24px] border border-slate-700 bg-[linear-gradient(145deg,#111827,#1e293b)] shadow-2xl">
                  {profile.image ? (
                    <img src={profile.image} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-4xl font-black uppercase text-blue-300">{String(profile.name || "?").slice(0, 1)}</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">{profile.name}</h3>
                    {profile.number ? <span className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-300">#{profile.number}</span> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {profile.position ? <span className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">{profile.position}</span> : null}
                    {profile.detailedPosition ? <span className="rounded-2xl border border-slate-600 bg-slate-800/60 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-200">{profile.detailedPosition}</span> : null}
                    {profile.seasonName ? <span className="rounded-2xl border border-slate-600 bg-slate-800/60 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-200">{profile.seasonName}</span> : null}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-1">
                    <InfoBadge image={profile.teamLogo} label="Takim" value={profile.teamName} />
                    <InfoBadge image={profile.leagueLogo} label="Lig" value={profile.leagueName} />
                    <InfoBadge image={profile.nationalityFlag || profile.countryFlag} label="Ulke" value={profile.nationality || profile.country} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailPill icon={CalendarDays} label="Yas" value={profile.age} tone="emerald" />
                    <DetailPill icon={Footprints} label="Ayak" value={profile.preferredFoot} tone="blue" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-700/50 bg-slate-950/35 p-5">
              <div className="mb-4 flex items-center gap-3">
                <Activity size={18} className="text-blue-400" />
                <h4 className="text-sm font-black uppercase tracking-[0.22em] text-white">Performans Ozeti</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {statBlocks.map((block) => (
                  <StatCard key={block.label} label={block.label} value={block.value} accent={block.accent} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-700/50 bg-slate-950/45 p-5">
              <div className="mb-4 flex items-center gap-3">
                <Target size={18} className="text-amber-300" />
                <h4 className="text-sm font-black uppercase tracking-[0.22em] text-white">Hizli Bilgiler</h4>
              </div>
              <div className="space-y-3">
                <DetailPill icon={CalendarDays} label="Dogum Tarihi" value={profile.dateOfBirth} tone="blue" />
                <DetailPill icon={Ruler} label="Boy" value={profile.height ? `${profile.height} cm` : ""} tone="emerald" />
                <DetailPill icon={Weight} label="Kilo" value={profile.weight ? `${profile.weight} kg` : ""} tone="emerald" />
                <DetailPill icon={Gauge} label="Pozisyon" value={profile.position} tone="blue" />
                <DetailPill icon={Timer} label="Detay Pozisyon" value={profile.detailedPosition} tone="amber" />
                <DetailPill icon={Shield} label="Sezon" value={profile.seasonName} tone="blue" />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-700/50 bg-[linear-gradient(145deg,rgba(15,23,42,0.85),rgba(30,41,59,0.65))] p-5">
              {summaryText ? (
                <>
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Sezon Ozeti</div>
                  <div className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
                    {profile.teamName || profile.leagueName || profile.name}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{summaryText}</p>
                </>
              ) : loading ? (
                <p className="text-sm leading-7 text-slate-300">Oyuncu profili derleniyor. API'den gelen ek bilgiler bu pencereye anlik olarak islenecek.</p>
              ) : null}
              {error ? <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div> : null}
              <button onClick={onClose} className="mt-5 w-full rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-blue-300 transition-colors hover:bg-blue-500/20 hover:text-white">
                Pencereyi Kapat
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
