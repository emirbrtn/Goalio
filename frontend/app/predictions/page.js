"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  Zap,
  Star,
  Trophy,
  Loader2,
  ShieldCheck,
  Sparkles,
  Search,
} from "lucide-react";
import {
  formatLeagueName,
  formatLiveMinute,
  formatMatchDateTime,
  formatTeamName,
  getLeagueLogo,
  parseMatchDate,
} from "@/lib/text";

function getStatusLabel(status) {
  if (status === "live") return "Canli";
  if (status === "finished") return "Bitti";
  return "Yakinda";
}

function getStatusClasses(status, selected) {
  if (status === "live") {
    return selected ? "bg-black/20 text-white" : "bg-red-500/20 text-red-400";
  }
  if (status === "finished") {
    return selected ? "bg-black/20 text-white" : "bg-slate-700 text-slate-300";
  }
  return selected ? "bg-black/20 text-white" : "bg-blue-500/20 text-blue-400";
}

function formatMatchDate(date) {
  return formatMatchDateTime(date) || "Tarih bilinmiyor";
}

function getPrimaryPick(probabilities) {
  if (!probabilities) return null;
  const entries = [
    { key: "homeWin", code: "1", value: probabilities.homeWin ?? 0 },
    { key: "draw", code: "X", value: probabilities.draw ?? 0 },
    { key: "awayWin", code: "2", value: probabilities.awayWin ?? 0 },
  ];
  return entries.sort((a, b) => b.value - a.value)[0] || null;
}

function getLatestEventTotalMinute(match) {
  const events = Array.isArray(match?.sportsmonkData?.events) ? match.sportsmonkData.events : [];
  return events.reduce((max, event) => {
    const minute = Number(event?.minute || 0);
    const extraMinute = Number(event?.extra_minute || 0);
    return Math.max(max, minute + extraMinute);
  }, 0);
}

function getEstimatedFinishedAt(match) {
  if (match?.status !== "finished") return null;

  const startedAt = parseMatchDate(match?.startTime || match?.date || match?.sportsmonkData?.starting_at);
  if (!startedAt) return null;

  const regulationLength = Number(match?.sportsmonkData?.length || 90) || 90;
  const latestEventMinute = getLatestEventTotalMinute(match);
  const effectiveMatchMinutes = Math.max(regulationLength, latestEventMinute);
  const halftimeBreakMinutes = regulationLength >= 90 ? 15 : 0;
  const extraTimeBreakMinutes = effectiveMatchMinutes > 105 ? 5 : 0;

  return new Date(
    startedAt.getTime() + (effectiveMatchMinutes + halftimeBreakMinutes + extraTimeBreakMinutes) * 60000,
  );
}

function isVisiblePredictionMatch(match) {
  if (!match) return false;
  if (match.status !== "finished") return true;

  const estimatedFinishedAt = getEstimatedFinishedAt(match);
  if (!estimatedFinishedAt) return false;

  return Date.now() - estimatedFinishedAt.getTime() <= 60 * 60 * 1000;
}

function matchesPredictionSearch(match, query) {
  const normalizedQuery = String(query || "").trim().toLocaleLowerCase("tr-TR");
  if (!normalizedQuery) return true;

  const haystack = [
    match?.homeTeam?.name,
    match?.awayTeam?.name,
    match?.league,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR");

  return haystack.includes(normalizedQuery);
}

export default function PredictionsPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const [matchList, setMatchList] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMatches();

    const intervalId = setInterval(() => {
      loadMatches(true);
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadMatches(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  async function loadMatches(silent = false) {
    if (!silent) {
      setLoadingMatches(true);
      setMessage("");
    }
    try {
      const res = await fetch(`${api}/matches?limit=50`, { cache: "no-store" });
      const data = await res.json();
      const safeData = (Array.isArray(data) ? data : []).filter(isVisiblePredictionMatch);
      const currentSelectedId = selectedMatch?._id || null;
      const matchedSelection = currentSelectedId
        ? safeData.find((match) => match._id === currentSelectedId)
        : null;
      const nextSelection =
        matchedSelection || safeData.find((match) => match.status === "scheduled") || safeData[0] || null;

      setMatchList(safeData);
      setSelectedMatch(nextSelection);

      if (!matchedSelection && currentSelectedId) {
        setPrediction(null);
      }
    } catch (error) {
      if (!silent) {
        setMessage("Mac listesi yuklenemedi.");
      }
    } finally {
      if (!silent) {
        setLoadingMatches(false);
      }
    }
  }

  const filteredMatchList = useMemo(
    () => matchList.filter((match) => matchesPredictionSearch(match, searchTerm)),
    [matchList, searchTerm],
  );

  useEffect(() => {
    if (filteredMatchList.length === 0) {
      setSelectedMatch(null);
      setPrediction(null);
      return;
    }

    const hasSelected = filteredMatchList.some((match) => match._id === selectedMatch?._id);
    if (hasSelected) return;

    const nextSelection =
      filteredMatchList.find((match) => match.status === "scheduled") ||
      filteredMatchList.find((match) => match.status === "live") ||
      filteredMatchList[0] ||
      null;

    setSelectedMatch(nextSelection);
    setPrediction(null);
  }, [filteredMatchList, selectedMatch?._id]);

  async function generateAIPrediction() {
    if (!selectedMatch) return;

    if (selectedMatch.status !== "scheduled") {
      setPrediction(null);
      setMessage("AI tahmini sadece baslamamis maclarda olusturulabilir.");
      return;
    }

    const token = localStorage.getItem("goalio_token");
    if (!token) {
      setMessage("AI tahmini icin giris yapmaniz gerekli.");
      return;
    }

    setGenerating(true);
    setMessage("");
    setPrediction(null);

    try {
      const res = await fetch(`${api}/predictions/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matchId: String(selectedMatch._id) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Analiz olusturulamadi.");
        return;
      }

      setPrediction(data);
    } catch (error) {
      setMessage("Sunucu hatasi nedeniyle analiz tamamlanamadi.");
    } finally {
      setGenerating(false);
    }
  }

  const canPredict = selectedMatch?.status === "scheduled";
  const factors = prediction?.analysis?.factors || [];
  const primaryPick = useMemo(
    () => getPrimaryPick(prediction?.probabilities),
    [prediction],
  );

  if (loadingMatches) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-[#050509]">
        <div className="relative">
          <Loader2 className="animate-spin text-yellow-400" size={60} />
          <div className="absolute inset-0 animate-pulse bg-red-600/20 blur-xl" />
        </div>
        <p className="mt-6 text-slate-500 font-black uppercase tracking-widest italic">
          Veritabani taraniyor...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-x-hidden bg-[#050509] p-4 md:p-10">
      <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-red-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-yellow-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-red-500/20 bg-red-950/50 p-3">
                <BrainCircuit className="text-red-500" size={28} />
              </div>
              <h2 className="bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-4xl font-black italic tracking-tighter text-transparent">
                AI MATCH PREDICTION CENTER
              </h2>
            </div>
            <p className="mt-2 ml-16 max-w-2xl text-slate-400">
              Goalio AI, macin form durumu, puan tablosu, ic saha deplasman etkisi ve son performans
              verilerini analiz ederek aciklanabilir tahmin uretir.
            </p>
          </div>
          <div className="w-14" />
        </div>

        {message ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-600/20 to-yellow-500/10 p-4 text-sm font-bold text-yellow-300">
            <Zap size={18} />
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="flex h-[700px] flex-col rounded-[35px] border border-slate-800 bg-[#111827]/60 p-6 shadow-2xl">
            <h4 className="mb-6 flex items-center gap-3 border-b border-slate-700/50 pb-4 text-xl font-bold text-white">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              Mac Listesi
            </h4>

            <div className="relative mb-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Listedeki maclarda ara..."
                className="w-full rounded-2xl border border-slate-700 bg-[#0f172a] py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors focus:border-yellow-500/40"
              />
            </div>

            {filteredMatchList.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-center italic text-slate-600">
                {matchList.length === 0 ? "Analiz icin uygun mac bulunamadi." : "Aramaniza uygun mac bulunamadi."}
              </div>
            ) : (
              <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2">
                {filteredMatchList.map((match) => {
                  const isSelected = selectedMatch?._id === match._id;
                  const leagueLogo = getLeagueLogo(match.league);

                  return (
                    <button
                      key={match._id}
                      type="button"
                      onClick={() => {
                        setSelectedMatch(match);
                        setPrediction(null);
                        setMessage("");
                      }}
                      className={`flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-red-400 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white shadow-lg shadow-red-600/30"
                          : "border-slate-700 bg-[#0f172a] text-slate-300 hover:border-yellow-500/40 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-xs font-bold">
                        <span className="w-24 truncate">{formatTeamName(match.homeTeam?.name)}</span>
                        <span className={`text-xl font-black ${isSelected ? "text-white" : "text-yellow-400"}`}>
                          {match.score?.home ?? "-"} : {match.score?.away ?? "-"}
                        </span>
                        <span className="w-24 truncate text-right">{formatTeamName(match.awayTeam?.name)}</span>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className={`flex min-w-0 items-center gap-2 truncate text-[10px] ${isSelected ? "text-red-100" : "text-slate-500"}`}>
                          {leagueLogo ? (
                            <img
                              src={leagueLogo}
                              alt={formatLeagueName(match.league) || "Lig"}
                              className="h-4 w-4 flex-shrink-0 object-contain"
                            />
                          ) : null}
                          <span className="truncate">{formatLeagueName(match.league) || match.leagueId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${getStatusClasses(match.status, isSelected)}`}>
                            {getStatusLabel(match.status)}
                          </span>
                          {match.status === "live" && formatLiveMinute(match) ? (
                            <span className={`text-[10px] font-black ${isSelected ? "text-white" : "text-red-400"}`}>
                              {formatLiveMinute(match)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={`text-[10px] font-medium ${isSelected ? "text-red-100" : "text-slate-500"}`}>
                        {formatMatchDate(match.date || match.startTime)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-8 lg:col-span-2">
            <div className="flex flex-1 flex-col rounded-[45px] border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-950 p-10 shadow-2xl shadow-red-950/10">
              {selectedMatch ? (
                <>
                  <div className="mb-10 flex items-center justify-center gap-10">
                    <div className="flex flex-1 flex-col items-center gap-4 text-center">
                      <img
                        src={selectedMatch.homeTeam?.logo}
                        alt={selectedMatch.homeTeam?.name || "Ev sahibi logo"}
                        className="h-24 w-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                      />
                      <h3 className="text-center text-2xl font-black italic tracking-tighter text-white">
                        {formatTeamName(selectedMatch.homeTeam?.name)}
                      </h3>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="tabular-nums text-6xl font-black italic tracking-tighter text-white">
                        {selectedMatch.score?.home ?? "-"} : {selectedMatch.score?.away ?? "-"}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {getStatusLabel(selectedMatch.status)}
                      </span>
                      {selectedMatch.status === "live" && formatLiveMinute(selectedMatch) ? (
                        <span className="text-sm font-black text-red-400">
                          {formatLiveMinute(selectedMatch)}
                        </span>
                      ) : null}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        {getLeagueLogo(selectedMatch.league) ? (
                          <img
                            src={getLeagueLogo(selectedMatch.league)}
                            alt={formatLeagueName(selectedMatch.league) || "Lig"}
                            className="h-4 w-4 object-contain"
                          />
                        ) : null}
                        <span>{formatLeagueName(selectedMatch.league)}</span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col items-center gap-4 text-center">
                      <img
                        src={selectedMatch.awayTeam?.logo}
                        alt={selectedMatch.awayTeam?.name || "Deplasman logo"}
                        className="h-24 w-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                      />
                      <h3 className="text-center text-2xl font-black italic tracking-tighter text-white">
                        {formatTeamName(selectedMatch.awayTeam?.name)}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-center gap-8">
                    {prediction ? (
                      <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom duration-500">
                          <PredictionBar
                            label={formatTeamName(selectedMatch.homeTeam?.name)}
                            value={prediction.probabilities?.homeWin}
                            color="from-red-600"
                          />
                          <PredictionBar label="Beraberlik" value={prediction.probabilities?.draw} color="from-slate-600" />
                          <PredictionBar
                            label={formatTeamName(selectedMatch.awayTeam?.name)}
                            value={prediction.probabilities?.awayWin}
                            color="from-yellow-600"
                          />
                        </div>

                        <div className="rounded-[30px] border border-slate-700/60 bg-black/20 p-6">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                              <Sparkles className="text-yellow-400" size={20} />
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                                Analiz Ozeti
                              </div>
                              <div className="text-2xl font-black italic text-white">
                                {prediction.display?.favoriteLabel || prediction.favoredSide}
                              </div>
                            </div>
                          </div>

                          <p className="text-sm leading-7 text-slate-300">{prediction.summary}</p>

                          {prediction.reasonTags?.length ? (
                            <div className="mt-5 flex flex-wrap gap-2">
                              {prediction.reasonTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-red-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <div
                        className={`group my-6 flex flex-1 flex-col items-center justify-center rounded-[35px] border-2 border-dashed px-6 text-center transition-all duration-300 ${
                          canPredict
                            ? "cursor-pointer border-slate-700/60 bg-slate-950/20 hover:border-yellow-500/35 hover:bg-gradient-to-r hover:from-yellow-500/8 hover:via-red-500/8 hover:to-yellow-500/8 hover:shadow-[0_0_40px_rgba(245,158,11,0.08)]"
                            : "border-slate-700/60 bg-slate-950/10"
                        }`}
                      >
                        <BrainCircuit
                          size={45}
                          className={`mb-4 transition-all duration-300 ${
                            canPredict
                              ? "animate-pulse text-slate-700 group-hover:scale-110 group-hover:text-yellow-400"
                              : "text-slate-800"
                          }`}
                        />
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${canPredict ? "text-slate-500 group-hover:text-yellow-200" : "text-slate-700"}`}>
                          {canPredict
                            ? "Analizi baslatmak icin butona basin"
                            : "Bu mac icin AI tahmini yalnizca mac baslamadan once kullanilabilir"}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={generateAIPrediction}
                    disabled={generating || !canPredict}
                    className={`relative mt-10 w-full overflow-hidden rounded-[25px] py-6 font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 ${
                      canPredict
                        ? "bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 text-black shadow-red-600/30"
                        : "cursor-not-allowed bg-slate-800 text-slate-500 shadow-none"
                    }`}
                  >
                    {canPredict ? (
                      <>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                        {generating ? (
                          <div className="flex items-center justify-center gap-3">
                            <Loader2 className="animate-spin" />
                            Veriler analiz ediliyor...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <Zap />
                            TAHMINI OLUSTUR
                            <Zap />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <ShieldCheck size={18} />
                        SADECE BASLAMAMIS MACLARDA AKTIF
                      </div>
                    )}
                  </button>
                </>
              ) : (
                <div className="flex h-full flex-1 flex-col items-center justify-center rounded-[45px] border-4 border-dashed border-slate-700">
                  <BrainCircuit size={60} className="text-slate-800" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-700">
                    Analiz icin bir mac secin.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <InfoCard
                title="AI Guveni"
                icon={<Star className="text-yellow-400" />}
                value={prediction?.display?.confidenceLabel || "--"}
                detail={
                  prediction
                    ? prediction.analysis?.primaryFactor?.title || "Mac analizi tamamlandi"
                    : "Form, tablo ve performans dengesi"
                }
              />
              <InfoCard
                title="Onerilen Sonuc"
                icon={<Trophy className="text-red-500" />}
                value={primaryPick?.code || "--"}
                detail={
                  prediction
                    ? prediction.favoredSide || "Tahmin hazir"
                    : "Tahmin olusturuldugunda burada gosterilir"
                }
              />
            </div>

            <div className="rounded-[35px] border border-slate-800 bg-[#111827]/60 p-8 shadow-2xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
                  <BrainCircuit className="text-blue-400" size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Analiz Nedenleri</div>
                  <div className="text-2xl font-black italic text-white">Goalio yorum motoru</div>
                </div>
              </div>

              {prediction ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {factors.map((factor) => (
                    <div key={factor.title} className="rounded-[24px] border border-slate-700/60 bg-[#0f172a] p-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">{factor.title}</h4>
                        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-yellow-300">
                          Etki {factor.impact > 0 ? "+" : ""}
                          {factor.impact}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-slate-400">{factor.detail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-700/60 bg-[#0f172a] p-8 text-center text-sm text-slate-500">
                  Tahmin olusturuldugunda bu alanda macin neden o sonuca yakin gorundugu aciklanir.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionBar({ label, value = 0, color }) {
  const pct = Math.round((value || 0) * 100);

  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-end justify-between">
        <div className="max-w-[140px] truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </div>
        <div className="tabular-nums text-2xl font-black italic text-white">%{pct}</div>
      </div>
      <div className="h-3 rounded-full border border-white/5 bg-black p-0.5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} to-slate-900 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(239,68,68,0.3)]`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InfoCard({ title, icon, value, detail }) {
  return (
    <div className="flex items-center gap-6 rounded-[35px] border border-slate-800 bg-[#111827]/60 p-8 shadow-2xl">
      <div className="rounded-2xl border border-slate-700 bg-[#0a0a14] p-4">{icon}</div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</div>
        <div className="mt-1 text-4xl font-black italic tracking-tighter text-white tabular-nums">{value}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-600">{detail}</div>
      </div>
    </div>
  );
}
