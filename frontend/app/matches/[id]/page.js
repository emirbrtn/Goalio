"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, BrainCircuit, Loader2, Trophy, Users, Clock, Target, Zap } from "lucide-react";
import MatchFormationPitch from "@/components/MatchFormationPitch";
import PlayerProfileModal from "@/components/PlayerProfileModal";
import StatsCard from "@/components/StatsCard";
import { formatLiveMinute, formatMatchDateTime, formatMinuteLabel, formatTeamName, sortMatchEvents } from "@/lib/text";

function resolvePlayerId(player) {
  return player?.player?.id || player?.player_id || player?._id || player?.id || null;
}

export default function MatchDetailPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const params = useParams();
  const router = useRouter();

  const [match, setMatch] = useState(null);
  const [stats, setStats] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [userSelection, setUserSelection] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);

  useEffect(() => {
    if (params?.id) loadAllData();
  }, [params?.id]);

  useEffect(() => {
    if (!params?.id || !match || (match.status !== "scheduled" && match.status !== "live")) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadAllData({ silent: true });
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadAllData({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [match, params?.id]);

  async function loadAllData(options = {}) {
    const { silent = false } = options;
    if (!silent) setLoading(true);
    const token = localStorage.getItem("goalio_token");
    const userStr = localStorage.getItem("goalio_user");
    const matchId = Array.isArray(params.id) ? params.id[0] : params.id;

    try {
      const user = userStr ? JSON.parse(userStr) : null;
      const [matchRes, statsRes, predictionsRes] = await Promise.all([
        fetch(`${api}/matches/${matchId}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch(`${api}/matches/${matchId}/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        user
          ? fetch(`${api}/users/${user.id || user._id}/predictions`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
          : Promise.resolve(null),
      ]);

      if (matchRes.ok) setMatch(await matchRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (predictionsRes?.ok) {
        const predictions = await predictionsRes.json();
        const existingPrediction = Array.isArray(predictions)
          ? predictions.find((entry) => String(entry.matchId) === String(matchId))
          : null;
        setUserSelection(existingPrediction?.predictedResult || null);
      } else if (!user) {
        setUserSelection(null);
      }
    } catch (error) {
      console.error("Match detail error:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleUserPrediction(result) {
    const userStr = localStorage.getItem("goalio_user");
    if (!userStr) {
      setMessage("Tahmin yapmak için giriş yapmalısınız.");
      return;
    }

    const user = JSON.parse(userStr);
    const token = localStorage.getItem("goalio_token");

    try {
      const res = await fetch(`${api}/users/${user.id || user._id}/predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matchId: String(match._id), predictedResult: result }),
      });

      if (res.ok) {
        setMessage("Tahmininiz kaydedildi. Tahminlerim ekranından görebilirsiniz.");
        setUserSelection((await res.clone().json())?.predictedResult || result);
      } else {
        setMessage("Tahmin kaydedilemedi.");
      }
    } catch (error) {
      setMessage("Sunucu hatası.");
    }
  }

  function openPlayerProfile(player) {
    if (!player) return;
    setActivePlayer({
      id: resolvePlayerId(player),
      _id: resolvePlayerId(player),
      name: player.name || player.player_name || player.player?.display_name || "Futbolcu",
      image: player.image || player.player?.image_path || "",
      position: player.position || player.player?.position?.name || "",
      teamName: player.teamName || "",
      number: player.jersey_number || player.number || null,
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#050509]">
        <div className="relative">
          <Loader2 className="animate-spin text-yellow-400" size={60} />
          <div className="absolute inset-0 blur-xl bg-red-600/20 animate-pulse"></div>
        </div>
        <p className="mt-6 text-slate-500 font-black tracking-widest uppercase italic animate-pulse">Maç verileri çekiliyor...</p>
      </div>
    );
  }

  if (!match) {
    return <div className="text-white text-center mt-20">Maç bulunamadı.</div>;
  }

  const sortLineup = (players) =>
    [...players].sort(
      (a, b) =>
        Number(a.formation_position || a.formation_field || a.jersey_number || 99) -
        Number(b.formation_position || b.formation_field || b.jersey_number || 99),
    );

  const getStartingLineup = (teamId) =>
    sortLineup(
      (match.lineups || []).filter(
        (player) => String(player.team_id) === String(teamId) && Number(player.type_id) === 11,
      ),
    );

  const getSubstitutions = (teamId) =>
    sortMatchEvents(
      (match.events || []).filter(
        (event) =>
          String(event.participant_id) === String(teamId) &&
          (Number(event.type_id) === 18 || event.type?.name === "Substitution"),
      ),
    );

  const homeLineup = getStartingLineup(match.homeTeam._id);
  const awayLineup = getStartingLineup(match.awayTeam._id);
  const homeSubstitutions = getSubstitutions(match.homeTeam._id);
  const awaySubstitutions = getSubstitutions(match.awayTeam._id);
  const orderedEvents = sortMatchEvents(match.events || []);
  const liveMinuteLabel = formatLiveMinute(match);
  const homeScoreText = match.status === "scheduled" ? "-" : (match.score?.home ?? 0);
  const awayScoreText = match.status === "scheduled" ? "-" : (match.score?.away ?? 0);
  const isProbableLineup = match.status === "scheduled" && (homeLineup.length > 0 || awayLineup.length > 0);
  const featuredStats = getFeaturedMatchStats(match.statistics || [], match.homeTeam?._id, match.awayTeam?._id);
  const matchHighlights = getMatchHighlights(match.events || [], match.lineups || [], match.homeTeam, match.awayTeam);
  const canPredict = match.status === "scheduled";
  const matchDateTimeLabel = formatMatchDateTime(match.startTime || match.date);

  return (
    <div className="min-h-full bg-[#050509] p-4 md:p-10 space-y-8 overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
        <button onClick={() => router.back()} className="group p-4 bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-2xl transition-all shadow-lg active:scale-95">
          <ArrowLeft size={20} className="text-slate-400 group-hover:text-red-400 group-hover:-translate-x-1 transition-all" />
        </button>
        {message && (
          <div className="bg-gradient-to-r from-red-600/20 to-yellow-500/10 border border-red-500/30 px-6 py-3 rounded-2xl text-yellow-300 text-sm font-bold animate-in slide-in-from-top flex items-center gap-2">
            <Zap size={16} /> {message}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto bg-gradient-to-br from-[#111827] to-[#0a0a14] rounded-[50px] p-12 border border-slate-800 shadow-3xl shadow-red-900/10 relative">
        <div className="flex flex-col lg:flex-row items-center justify-around gap-12 relative z-10">
          <div className="flex flex-col items-center gap-6">
            <div className="bg-[#050509] p-6 rounded-3xl border border-slate-800 shadow-xl">
              <img src={match.homeTeam?.logo} className="w-24 h-24 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" alt="home" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{formatTeamName(match.homeTeam?.name)}</h2>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">{homeScoreText}</span>
              <span className="text-4xl text-red-500 animate-pulse">:</span>
              <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">{awayScoreText}</span>
            </div>
            <span className={`px-6 py-2 border rounded-full text-xs font-black uppercase tracking-widest ${
              match.status === "live"
                ? "bg-red-500/20 border-red-500/50 text-red-400"
                : match.status === "finished"
                  ? "bg-slate-900 border-slate-700 text-slate-400"
                  : "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
            }`}>
              {match.status === "live" ? "Canlı" : match.status === "finished" ? "Tamamlandı" : "Başlamadı"}
            </span>
            {matchDateTimeLabel ? (
              <span className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">
                {matchDateTimeLabel}
              </span>
            ) : null}
            {match.status === "live" && liveMinuteLabel ? <span className="text-3xl font-black italic tracking-tight text-red-400">{liveMinuteLabel}</span> : null}
          </div>
          <div className="flex flex-col items-center gap-6">
            <div className="bg-[#050509] p-6 rounded-3xl border border-slate-800 shadow-xl">
              <img src={match.awayTeam?.logo} className="w-24 h-24 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" alt="away" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{formatTeamName(match.awayTeam?.name)}</h2>
          </div>
        </div>
      </div>

      <MatchFormationPitch
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        events={orderedEvents}
        matchStatus={match.status}
        isProbable={isProbableLineup}
        onPlayerSelect={(player) => openPlayerProfile(player)}
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="bg-[#111827]/60 border border-slate-800 rounded-[35px] p-8 shadow-2xl">
          <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
            <Users className="text-red-500" /> {isProbableLineup ? "Probable XI" : "İlk 11 ve Değişiklikler"}
          </h3>
          {isProbableLineup ? <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300/80">Match has not started yet. Displayed lineups are probable.</p> : null}
          <div className="flex justify-between gap-4">
            <TeamLineupColumn teamName={match.homeTeam?.name} starters={homeLineup} substitutions={homeSubstitutions} align="left" accent="home" isProbable={isProbableLineup} onPlayerSelect={(player) => openPlayerProfile({ ...player, teamName: match.homeTeam?.name })} />
            <div className="w-[1px] bg-slate-800"></div>
            <TeamLineupColumn teamName={match.awayTeam?.name} starters={awayLineup} substitutions={awaySubstitutions} align="right" accent="away" isProbable={isProbableLineup} onPlayerSelect={(player) => openPlayerProfile({ ...player, teamName: match.awayTeam?.name })} />
          </div>
        </div>

          <div className="bg-[#111827]/60 border border-slate-800 rounded-[35px] p-8 h-[720px] shadow-2xl flex flex-col">
          <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
            <Clock className="text-yellow-500" /> Maç Olayları
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {orderedEvents.length > 0 ? orderedEvents.map((event, index) => (
              <div key={index} className="flex items-center gap-4 bg-[#050509] p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <span className="font-black text-red-500 text-lg min-w-[52px]">{formatMinuteLabel(event)}</span>
                <div className="flex-1 min-w-0 text-sm text-slate-300 font-medium truncate">
                  {event.type?.name === "Substitution" ? (
                    <div className="flex items-center gap-2 truncate">
                      <button type="button" onClick={() => openPlayerProfile({ id: event.player_id, name: event.player_name, teamName: String(event.participant_id) === String(match.homeTeam?._id) ? match.homeTeam?.name : match.awayTeam?.name })} className="truncate text-left transition-colors hover:text-blue-400">{event.player_name || "Bilinmiyor"}</button>
                      <span className="text-slate-500">-&gt;</span>
                      <button type="button" onClick={() => openPlayerProfile({ id: event.related_player_id, name: event.related_player_name, teamName: String(event.participant_id) === String(match.homeTeam?._id) ? match.homeTeam?.name : match.awayTeam?.name })} className="truncate text-left transition-colors hover:text-blue-400">{event.related_player_name || "Bilinmiyor"}</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => openPlayerProfile({ id: event.player_id, name: event.player_name, teamName: String(event.participant_id) === String(match.homeTeam?._id) ? match.homeTeam?.name : match.awayTeam?.name })} className="truncate text-left transition-colors hover:text-blue-400">
                      {event.player_name || "Bilinmiyor"}
                    </button>
                  )}
                </div>
                <span className="text-[10px] font-black px-3 py-1.5 bg-slate-800 rounded-lg text-yellow-500 uppercase tracking-widest">{event.type?.name || "Olay"}</span>
              </div>
            )) : <div className="text-sm text-slate-600 italic flex h-full items-center justify-center">Henüz önemli bir olay yok.</div>}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <StatsCard match={match} stats={stats} />

        <div className={`flex flex-col gap-6 ${match.status === "scheduled" ? "" : "lg:-mt-28 xl:-mt-32"}`}>
          <div className="bg-[#111827]/80 border border-slate-800 rounded-[35px] p-8 shadow-2xl">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3"><BarChart3 className="text-blue-400" size={18} /> Öne Çıkan İstatistikler</h4>
            {featuredStats.length > 0 ? (
              <div className="space-y-4">
                {featuredStats.map((statItem) => (
                  <div key={statItem.label} className="rounded-[22px] border border-slate-800 bg-[#050509] px-5 py-4">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-lg font-black text-white tabular-nums">{formatStatValue(statItem.home, statItem.suffix)}</span>
                      <span className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{statItem.label}</span>
                      <span className="text-lg font-black text-white tabular-nums">{formatStatValue(statItem.away, statItem.suffix)}</span>
                    </div>
                    <div className="flex gap-1 rounded-full border border-white/5 bg-slate-950 p-0.5">
                      <div className="h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: `${statItem.homeWidth}%` }}></div>
                      <div className="h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" style={{ width: `${100 - statItem.homeWidth}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="flex min-h-[160px] items-center justify-center rounded-[28px] border border-slate-800 bg-[#050509] px-6 text-center text-sm font-medium text-slate-500">Maç istatistikleri geldikçe burada öne çıkan veriler görünecek.</div>}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-[#0a0a14] border border-slate-800 rounded-[35px] p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6"><Trophy className="text-yellow-400" size={18} /><h3 className="text-sm font-black text-white uppercase tracking-widest">Maçın Öne Çıkanları</h3></div>
            {matchHighlights.length > 0 ? (
              <div className="space-y-3">
                {matchHighlights.map((player) => (
                  <button key={`${player.id || player.name}-${player.teamName}`} type="button" onClick={() => openPlayerProfile(player)} className="flex w-full items-center gap-4 rounded-[22px] border border-slate-800 bg-[#050509] px-4 py-3 text-left transition-colors hover:border-blue-500/30">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                      {player.image ? <img src={player.image} alt={player.name} className="h-full w-full object-cover" /> : <span className="text-sm font-black text-blue-400">{getInitials(player.name)}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-white">{player.name}</div>
                      <div className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{formatTeamName(player.teamName)}</div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {player.goals > 0 ? <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Gol {player.goals}</span> : null}
                      {player.assists > 0 ? <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-300">Asist {player.assists}</span> : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : <div className="flex min-h-[160px] items-center justify-center rounded-[28px] border border-slate-800 bg-[#050509] px-6 text-center text-sm font-medium text-slate-500">Maç olayları geldikçe öne çıkan oyuncular burada listelenecek.</div>}
          </div>
          {canPredict ? <div className="bg-[#111827]/80 border border-slate-800 rounded-[35px] p-8 shadow-2xl">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3"><Target className="text-red-500" /> Kendi Tahminini Yap</h4>
            <div className="flex gap-2 bg-[#050509] p-1.5 rounded-2xl border border-slate-800">
              <button disabled={Boolean(userSelection)} onClick={() => handleUserPrediction("homeWin")} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${userSelection === "homeWin" ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20 border border-red-500" : "text-slate-400 hover:bg-slate-800"} ${userSelection ? "cursor-not-allowed opacity-70" : ""}`}>1 ({formatTeamName(match.homeTeam?.name).substring(0, 3)})</button>
              <button disabled={Boolean(userSelection)} onClick={() => handleUserPrediction("draw")} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${userSelection === "draw" ? "bg-slate-600 text-white shadow-lg shadow-slate-600/20 border border-slate-500" : "text-slate-400 hover:bg-slate-800"} ${userSelection ? "cursor-not-allowed opacity-70" : ""}`}>X (Berabere)</button>
              <button disabled={Boolean(userSelection)} onClick={() => handleUserPrediction("awayWin")} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${userSelection === "awayWin" ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/20 border border-yellow-400" : "text-slate-400 hover:bg-slate-800"} ${userSelection ? "cursor-not-allowed opacity-70" : ""}`}>2 ({formatTeamName(match.awayTeam?.name).substring(0, 3)})</button>
            </div>
            {userSelection ? <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Bu maç için kayıtlı tahminin: {userSelection === "homeWin" ? "1" : userSelection === "draw" ? "X" : "2"}</p> : null}
          </div> : null}

          {canPredict ? <div className="bg-gradient-to-br from-slate-900 to-[#0a0a14] border border-slate-800 rounded-[35px] p-8 flex flex-col flex-1 justify-between shadow-2xl">
            <div className="flex items-center gap-4 mb-6"><BrainCircuit className="text-yellow-400" size={28} /><h3 className="text-xl font-black text-white italic uppercase">AI Predictor</h3></div>
            {prediction ? (
              <div className="space-y-6">
                <PredictionBar label={formatTeamName(match.homeTeam.name)} value={prediction.probabilities?.homeWin || 0} color="from-red-600" />
                <PredictionBar label="Beraberlik" value={prediction.probabilities?.draw || 0} color="from-slate-600" />
                <PredictionBar label={formatTeamName(match.awayTeam.name)} value={prediction.probabilities?.awayWin || 0} color="from-yellow-500" />
              </div>
            ) : <div className="flex-1 text-center text-slate-500 py-10 text-sm font-medium uppercase tracking-widest">Analizi görmek için butona tıklayın.</div>}

            <button
              onClick={async () => {
                setGenerating(true);
                setMessage("");

                try {
                  const token = localStorage.getItem("goalio_token");
                  if (!token) {
                    setMessage("AI tahmini görmek için giriş yapmalısınız.");
                    return;
                  }

                  const res = await fetch(`${api}/predictions/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ matchId: String(match._id) }),
                  });

                  const data = await res.json().catch(() => ({}));
                  if (!res.ok || !data?.probabilities) {
                    setMessage(data?.message || "AI tahmini şu anda üretilemiyor.");
                    return;
                  }

                  setPrediction(data);
                } catch (error) {
                  setMessage("AI tahmini şu anda üretilemiyor.");
                } finally {
                  setGenerating(false);
                }
              }}
              disabled={generating}
              className="mt-6 relative group w-full py-5 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 text-black rounded-[20px] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-red-600/20 active:scale-95 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              {generating ? <Loader2 className="animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-2 relative z-10"><Zap size={16} /> Analizi Gerçekleştir</div>}
            </button>
          </div> : null}
        </div>
      </div>
      <PlayerProfileModal isOpen={Boolean(activePlayer)} player={activePlayer} onClose={() => setActivePlayer(null)} apiBase={api} />
    </div>
  );
}

function TeamLineupColumn({ teamName, starters, substitutions, align, accent, isProbable, onPlayerSelect }) {
  const isRight = align === "right";
  const badgeClass = accent === "away" ? "bg-yellow-900/30 text-yellow-500" : "bg-red-950/50 text-red-400";

  return (
    <div className="flex-1 space-y-2">
      <div className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 truncate ${isRight ? "text-right" : ""}`}>{formatTeamName(teamName)}</div>
      {starters.length > 0 ? starters.map((player, index) => (
        <div key={`starter-${index}`} className={`flex items-center gap-3 bg-[#050509] p-2.5 rounded-xl border border-slate-800 ${isRight ? "justify-end" : ""}`}>
          {!isRight && <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${badgeClass}`}>{player.jersey_number || "-"}</span>}
          <button type="button" onClick={() => onPlayerSelect(player)} className="truncate text-left text-xs font-medium text-slate-300 transition-colors hover:text-blue-400">{player.player?.display_name || player.player_name || "Bilinmiyor"}</button>
          {isRight && <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${badgeClass}`}>{player.jersey_number || "-"}</span>}
        </div>
      )) : <div className={`text-xs text-slate-600 italic ${isRight ? "text-right" : ""}`}>{isProbable ? "Muhtemel 11 verisi yok" : "İlk 11 açıklanmadı"}</div>}

      {!isProbable ? <div className="pt-4 mt-4 border-t border-slate-800/80">
        <div className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ${isRight ? "text-right" : ""}`}>Değişiklikler</div>
        {substitutions.length > 0 ? substitutions.map((event, index) => (
          <div key={`sub-${index}`} className={`bg-[#050509] p-3 rounded-xl border border-slate-800 space-y-1 ${isRight ? "text-right" : ""}`}>
            <div className={`flex items-center justify-between gap-3 ${isRight ? "flex-row-reverse" : ""}`}>
              <span className="text-[10px] font-black text-yellow-400">{formatMinuteLabel(event)}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Oyuna Giren</span>
            </div>
            <button type="button" onClick={() => onPlayerSelect({ id: event.player_id, name: event.player_name })} className={`block w-full truncate text-xs font-semibold text-slate-200 transition-colors hover:text-blue-400 ${isRight ? "text-right" : "text-left"}`}>{event.player_name || "Bilinmiyor"}</button>
            <button type="button" onClick={() => onPlayerSelect({ id: event.related_player_id, name: event.related_player_name })} className={`block w-full truncate text-[11px] text-slate-500 transition-colors hover:text-blue-300 ${isRight ? "text-right" : "text-left"}`}>Çıkan: {event.related_player_name || "Bilinmiyor"}</button>
          </div>
        )) : <div className={`text-xs text-slate-600 italic ${isRight ? "text-right" : ""}`}>Değişiklik verisi yok</div>}
      </div> : null}
    </div>
  );
}

function PredictionBar({ label, value, color }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{label}</span>
        <span className="text-lg font-black text-white tabular-nums">%{pct}</span>
      </div>
      <div className="h-2 bg-[#050509] rounded-full overflow-hidden border border-white/5">
        <div className={`h-full bg-gradient-to-r ${color} to-slate-900 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.2)]`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

function normalizeStatName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function readNumericStatValue(stat) {
  const rawValue = stat?.data?.value ?? stat?.value ?? 0;
  if (typeof rawValue === "string") {
    return Number(rawValue.replace("%", "").replace(",", ".")) || 0;
  }
  return Number(rawValue) || 0;
}

function getFeaturedMatchStats(statistics = [], homeId, awayId) {
  const safeStatistics = Array.isArray(statistics) ? statistics : [];
  if (safeStatistics.length === 0) return [];

  const grouped = new Map();

  safeStatistics.forEach((stat) => {
    const label = String(stat?.type?.name || "").trim();
    if (!label) return;

    const key = label.toLowerCase();
    if (!grouped.has(key)) {
      grouped.set(key, {
        label,
        home: 0,
        away: 0,
      });
    }

    const current = grouped.get(key);
    const value = readNumericStatValue(stat);
    if (String(stat?.participant_id) === String(homeId)) current.home = value;
    if (String(stat?.participant_id) === String(awayId)) current.away = value;
  });

  const priorities = [
    { matchers: ["ball possession", "possession"], label: "Topa Sahip Olma", suffix: "%" },
    { matchers: ["shots on target", "shotsontarget"], label: "İsabetli Şut", suffix: "" },
    { matchers: ["goal attempts", "goalattempts", "attempts on goal"], label: "Gol Girişimi", suffix: "" },
    { matchers: ["big chances created", "big chances", "bigchancescreated"], label: "Büyük Şans", suffix: "" },
    { matchers: ["fouls"], label: "Faul", suffix: "" },
  ];

  const usedKeys = new Set();

  return priorities
    .map((priority) => {
      const found = [...grouped.values()].find((item) => {
        if (usedKeys.has(item.label.toLowerCase())) return false;
        const normalized = normalizeStatName(item.label);
        return priority.matchers.some((matcher) => normalized.includes(normalizeStatName(matcher)));
      });

      if (!found) return null;
      usedKeys.add(found.label.toLowerCase());
      const total = found.home + found.away || 1;
      return {
        label: priority.label,
        home: found.home,
        away: found.away,
        suffix: priority.suffix,
        homeWidth: (found.home / total) * 100,
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function isGoalEvent(typeName) {
  const normalized = normalizeStatName(typeName);
  return normalized.includes("goal") && !normalized.includes("goal kick") && !normalized.includes("own goal");
}

function getMatchHighlights(events = [], lineups = [], homeTeam = {}, awayTeam = {}) {
  const safeEvents = Array.isArray(events) ? events : [];
  const safeLineups = Array.isArray(lineups) ? lineups : [];
  const playerMap = new Map();
  const lineupPlayerMap = new Map();

  safeLineups.forEach((entry) => {
    const playerId = resolvePlayerId(entry);
    const playerName = entry?.player?.display_name || entry?.player_name || entry?.name;
    if (!playerId && !playerName) return;

    const key = String(playerId || playerName).toLowerCase();
    lineupPlayerMap.set(key, {
      image: entry?.player?.image_path || entry?.image || "",
      position: entry?.player?.position?.name || entry?.position || "",
      number: entry?.jersey_number || entry?.number || null,
    });
  });

  const ensurePlayer = ({ id, name, teamName }) => {
    if (!name) return null;
    const key = `${id || name}-${teamName || ""}`;
    if (!playerMap.has(key)) {
      const lineupMatch =
        lineupPlayerMap.get(String(id || "").toLowerCase()) ||
        lineupPlayerMap.get(String(name || "").toLowerCase()) ||
        {};

      playerMap.set(key, {
        id: id || null,
        _id: id || null,
        name,
        teamName: teamName || "",
        image: lineupMatch.image || "",
        position: lineupMatch.position || "",
        number: lineupMatch.number || null,
        goals: 0,
        assists: 0,
      });
    }
    return playerMap.get(key);
  };

  safeEvents.forEach((event) => {
    const typeName = event?.type?.name || "";
    const teamName =
      String(event?.participant_id) === String(homeTeam?._id)
        ? homeTeam?.name
        : String(event?.participant_id) === String(awayTeam?._id)
          ? awayTeam?.name
          : "";

    const player = ensurePlayer({
      id: event?.player_id,
      name: event?.player_name,
      teamName,
    });

    if (player && isGoalEvent(typeName)) player.goals += 1;
    if (isGoalEvent(typeName) && event?.related_player_name) {
      const assister = ensurePlayer({
        id: event?.related_player_id,
        name: event?.related_player_name,
        teamName,
      });
      if (assister) assister.assists += 1;
    }
  });

  return [...playerMap.values()]
    .filter((player) => player.goals > 0 || player.assists > 0)
    .sort((a, b) => {
      const scoreA = a.goals * 6 + a.assists * 4;
      const scoreB = b.goals * 6 + b.assists * 4;
      return scoreB - scoreA;
    })
    .slice(0, 5);
}

function formatStatValue(value, suffix = "") {
  return `${value}${suffix}`;
}

function getInitials(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
