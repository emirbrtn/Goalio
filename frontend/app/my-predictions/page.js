"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Loader2,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";
import { leagueList } from "@/lib/leagueConfig";
import { formatLeagueName, formatMatchDateTime, formatTeamName } from "@/lib/text";

function getPredictionLabel(result) {
  if (result === "homeWin") return "1";
  if (result === "awayWin") return "2";
  return "X";
}

function getPredictionLongLabel(result, match) {
  if (result === "homeWin") return `1 (${formatTeamName(match?.homeTeam?.name || "Ev Sahibi")})`;
  if (result === "awayWin") return `2 (${formatTeamName(match?.awayTeam?.name || "Deplasman")})`;
  return "X (Beraberlik)";
}

function getActualResult(match) {
  const home = Number(match?.score?.home);
  const away = Number(match?.score?.away);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
  if (home > away) return "homeWin";
  if (away > home) return "awayWin";
  return "draw";
}

function getPredictionState(prediction) {
  const status = prediction?.match?.status;
  if (status !== "finished") return "current";
  return getActualResult(prediction?.match) === prediction?.predictedResult ? "correct" : "wrong";
}

function normalizeLeagueKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getLeagueLogo(leagueName) {
  const normalized = normalizeLeagueKey(formatLeagueName(leagueName));
  const match = leagueList.find((league) => {
    const candidates = [league.name, league.title, league.country, league.key].map(normalizeLeagueKey);
    return candidates.some((candidate) => candidate && (candidate === normalized || normalized.includes(candidate) || candidate.includes(normalized)));
  });
  return match?.logo || null;
}

function SummaryCard({ title, value, subtitle, tone = "blue", icon }) {
  const tones = {
    blue: "border-blue-400/20 bg-blue-500/8 text-blue-300",
    emerald: "border-emerald-400/20 bg-emerald-500/8 text-emerald-300",
    red: "border-red-400/20 bg-red-500/8 text-red-300",
    amber: "border-amber-400/20 bg-amber-500/8 text-amber-300",
  };

  return (
    <div className="rounded-[30px] border border-slate-800/90 bg-[#0d1526] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.26)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{title}</div>
          <div className="mt-3 text-4xl font-black tracking-tight text-white">{value}</div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{subtitle}</div>
        </div>
        <div className={`rounded-2xl border px-3 py-3 ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function PredictionCard({ prediction, onDelete, router, highlight = "current" }) {
  const isCurrent = highlight === "current";
  const leagueLogo = getLeagueLogo(prediction?.match?.league);
  const styleMap = {
    current: {
      container:
        "border-blue-400/28 bg-[linear-gradient(145deg,rgba(15,23,42,0.84),rgba(19,50,102,0.56))] backdrop-blur-xl shadow-[0_26px_70px_rgba(10,37,90,0.28)] hover:-translate-y-1 hover:border-blue-300/35 hover:shadow-[0_30px_80px_rgba(22,78,160,0.36)]",
      badge: "border-blue-400/25 bg-blue-500/12 text-blue-200",
      glow: "bg-blue-500/14",
      resultTone: "text-blue-200",
      panel: "border-blue-300/12 bg-[linear-gradient(145deg,rgba(14,25,48,0.72),rgba(28,58,112,0.36))]",
      scorePanel: "border-blue-300/14 bg-[linear-gradient(145deg,rgba(10,18,36,0.78),rgba(25,48,92,0.42))]",
      logoPanel: "border-blue-300/12 bg-[linear-gradient(145deg,rgba(10,18,36,0.72),rgba(26,46,86,0.4))]",
      button:
        "border-blue-300/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(59,130,246,0.08))] hover:border-blue-400/40 hover:bg-blue-600 hover:text-white",
    },
    correct: {
      container:
        "border-emerald-400/22 bg-[linear-gradient(145deg,rgba(10,18,33,0.96),rgba(17,44,38,0.54))] shadow-[0_24px_60px_rgba(2,6,23,0.24)]",
      badge: "border-emerald-400/24 bg-emerald-500/10 text-emerald-300",
      glow: "bg-emerald-500/10",
      resultTone: "text-emerald-300",
      panel: "border-white/8 bg-[#060913]/88",
      scorePanel: "border-white/10 bg-[#050816]/88",
      logoPanel: "border-white/10 bg-[#050816]/88",
      button: "border-slate-700 bg-slate-800/65 hover:border-emerald-400/35 hover:bg-emerald-600 hover:text-white",
    },
    wrong: {
      container:
        "border-red-400/18 bg-[linear-gradient(145deg,rgba(10,18,33,0.96),rgba(51,20,29,0.42))] shadow-[0_24px_60px_rgba(2,6,23,0.24)]",
      badge: "border-red-400/24 bg-red-500/10 text-red-300",
      glow: "bg-red-500/10",
      resultTone: "text-red-300",
      panel: "border-white/8 bg-[#060913]/88",
      scorePanel: "border-white/10 bg-[#050816]/88",
      logoPanel: "border-white/10 bg-[#050816]/88",
      button: "border-slate-700 bg-slate-800/65 hover:border-red-400/35 hover:bg-red-600 hover:text-white",
    },
  };

  const badgeLabel =
    highlight === "correct" ? "Doğru Tahmin" : highlight === "wrong" ? "Hatalı Tahmin" : "Güncel Tahmin";

  const actualResult = getActualResult(prediction.match);
  const scoreText =
    prediction?.match?.status === "scheduled"
      ? "- : -"
      : `${prediction?.match?.score?.home ?? "-"} : ${prediction?.match?.score?.away ?? "-"}`;

  const activeStyle = styleMap[highlight] || styleMap.current;

  return (
    <div className={`group relative overflow-hidden rounded-[34px] border p-6 transition-all duration-300 ${activeStyle.container}`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${activeStyle.glow}`} />
      {isCurrent ? (
        <>
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-blue-400/8 via-transparent to-transparent opacity-80" />
          <div className="pointer-events-none absolute -right-16 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-blue-400/10 blur-3xl transition-transform duration-500 group-hover:scale-110" />
        </>
      ) : null}

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {leagueLogo ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-1.5">
                <img
                  src={leagueLogo}
                  alt={formatLeagueName(prediction?.match?.league) || "Lig"}
                  className="max-h-full object-contain"
                />
              </div>
            ) : null}
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              {formatLeagueName(prediction?.match?.league) || "Bilinmeyen Lig"}
            </div>
          </div>
          <div className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
            {formatMatchDateTime(prediction?.match?.startTime || prediction?.createdOn) || "Tarih bilinmiyor"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${activeStyle.badge} ${
              isCurrent ? "shadow-[0_0_0_1px_rgba(96,165,250,0.12)]" : ""
            }`}
          >
            {badgeLabel}
          </span>
          <button
            onClick={() => onDelete(prediction._id || prediction.id)}
            className="rounded-xl bg-red-500/10 p-2.5 text-red-400 transition-all hover:bg-red-500 hover:text-white active:scale-90"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <div className="text-xl font-black tracking-tight text-white">
              {formatTeamName(prediction?.match?.homeTeam?.name || "Ev Sahibi")}
            </div>
          </div>
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border p-2 shadow-[0_12px_30px_rgba(2,6,23,0.22)] ${activeStyle.logoPanel}`}>
            <img
              src={prediction?.match?.homeTeam?.logo || "https://cdn.sportmonks.com/images/soccer/team_placeholder.png"}
              className="max-h-full object-contain"
              alt={prediction?.match?.homeTeam?.name || "Ev Sahibi"}
            />
          </div>
        </div>

        <div
          className={`rounded-[22px] border px-5 py-4 text-center shadow-[0_18px_40px_rgba(2,6,23,0.28)] ${activeStyle.scorePanel} ${
            isCurrent ? "ring-1 ring-blue-300/10" : ""
          }`}
        >
          <div className="text-3xl font-black tracking-tight text-white">{scoreText}</div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            {prediction?.match?.status === "live"
              ? "Canlı"
              : prediction?.match?.status === "finished"
                ? "Tamamlandı"
                : "Yakında"}
          </div>
        </div>

        <div className="flex items-center justify-start gap-3 text-left">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border p-2 shadow-[0_12px_30px_rgba(2,6,23,0.22)] ${activeStyle.logoPanel}`}>
            <img
              src={prediction?.match?.awayTeam?.logo || "https://cdn.sportmonks.com/images/soccer/team_placeholder.png"}
              className="max-h-full object-contain"
              alt={prediction?.match?.awayTeam?.name || "Deplasman"}
            />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-black tracking-tight text-white">
              {formatTeamName(prediction?.match?.awayTeam?.name || "Deplasman")}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-2">
        <div className={`rounded-[22px] border px-4 py-4 ${activeStyle.panel}`}>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Senin Tahminin</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-2xl font-black text-white">{getPredictionLabel(prediction.predictedResult)}</span>
            <span className="text-right text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">
              {getPredictionLongLabel(prediction.predictedResult, prediction.match)}
            </span>
          </div>
        </div>

        <div className={`rounded-[22px] border px-4 py-4 ${activeStyle.panel}`}>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Maç Sonucu</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-2xl font-black text-white">
              {prediction?.match?.status === "finished" ? getPredictionLabel(actualResult) : "--"}
            </span>
            <span className={`text-right text-[11px] font-black uppercase tracking-[0.18em] ${prediction?.match?.status === "finished" ? activeStyle.resultTone : "text-slate-400"}`}>
              {prediction?.match?.status === "finished"
                ? getPredictionLongLabel(actualResult, prediction.match)
                : "Sonuç henüz netleşmedi"}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push(`/matches/${prediction.matchId}`)}
        className={`relative z-10 mt-6 flex w-full items-center justify-center gap-3 rounded-[22px] border px-4 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-100 transition-all ${activeStyle.button}`}
      >
        Maç Detayına Git
        <ArrowRight size={18} className={isCurrent ? "transition-transform duration-300 group-hover:translate-x-1" : ""} />
      </button>
    </div>
  );
}

function PredictionSection({ title, subtitle, items, tone, emptyText, router, onDelete }) {
  const icon =
    tone === "correct" ? (
      <CheckCircle2 className="text-emerald-400" size={20} />
    ) : tone === "wrong" ? (
      <XCircle className="text-red-400" size={20} />
    ) : (
      <Clock3 className="text-blue-400" size={20} />
    );

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-slate-700 bg-[#101827] p-3">{icon}</div>
        <div>
          <h3 className="text-2xl font-black italic tracking-tight text-white">{title}</h3>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{subtitle}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {items.map((prediction) => (
            <PredictionCard
              key={prediction._id || prediction.id}
              prediction={prediction}
              highlight={tone}
              router={router}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[34px] border border-dashed border-slate-700 bg-[#101827]/60 px-6 py-14 text-center text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
          {emptyText}
        </div>
      )}
    </section>
  );
}

export default function MyPredictions() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {
    const userStr = localStorage.getItem("goalio_user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userStr);
    const token = localStorage.getItem("goalio_token");

    try {
      const res = await fetch(`${api}/users/${user.id || user._id}/predictions`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      const safeData = Array.isArray(data) ? data : [];
      safeData.sort((a, b) => new Date(b.createdOn || 0).getTime() - new Date(a.createdOn || 0).getTime());
      setPredictions(safeData);
    } catch (error) {
      console.error("Tahminler çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(predId) {
    const user = JSON.parse(localStorage.getItem("goalio_user"));
    const token = localStorage.getItem("goalio_token");

    try {
      await fetch(`${api}/users/${user.id || user._id}/predictions/${predId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPredictions((prev) => prev.filter((prediction) => prediction._id !== predId && prediction.id !== predId));
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  }

  const currentPredictions = useMemo(
    () => predictions.filter((prediction) => getPredictionState(prediction) === "current"),
    [predictions],
  );
  const correctPredictions = useMemo(
    () => predictions.filter((prediction) => getPredictionState(prediction) === "correct"),
    [predictions],
  );
  const wrongPredictions = useMemo(
    () => predictions.filter((prediction) => getPredictionState(prediction) === "wrong"),
    [predictions],
  );

  const finishedCount = correctPredictions.length + wrongPredictions.length;
  const accuracy =
    finishedCount > 0 ? `${Math.round((correctPredictions.length / finishedCount) * 100)}%` : "--";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09111f]">
        <Loader2 className="animate-spin text-blue-500" size={50} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09111f] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="border-b border-slate-800 pb-8">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3">
              <Target className="text-blue-400" size={28} />
            </div>
            <div>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                Senin Tahminlerin
              </h2>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                Güncel tahminlerini ve kapanan maç performansını tek merkezden takip et
              </p>
            </div>
          </div>
        </div>

        {predictions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[45px] border border-slate-800/60 bg-[#101827] py-32 text-center text-slate-500 shadow-2xl">
            <BrainCircuit size={60} className="text-slate-700" />
            <p className="text-sm font-bold uppercase tracking-widest">Henüz hiçbir maça tahmin yapmadın.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Toplam Tahmin"
                value={predictions.length}
                subtitle="Sisteme kaydedilen tüm seçimlerin"
                tone="blue"
                icon={<Target size={22} />}
              />
              <SummaryCard
                title="Güncel Tahmin"
                value={currentPredictions.length}
                subtitle="Henüz sonucu netleşmeyen maçlar"
                tone="amber"
                icon={<Clock3 size={22} />}
              />
              <SummaryCard
                title="Doğru Tahmin"
                value={correctPredictions.length}
                subtitle="Biten maçlarda tutan seçimler"
                tone="emerald"
                icon={<CheckCircle2 size={22} />}
              />
              <SummaryCard
                title="Başarı Oranı"
                value={accuracy}
                subtitle="Kapanan maçlar baz alınır"
                tone="red"
                icon={<BrainCircuit size={22} />}
              />
            </div>

            <PredictionSection
              title="Güncel Tahminler"
              subtitle="Başlamamış veya henüz sonucu kesinleşmemiş maçlar"
              items={currentPredictions}
              tone="current"
              emptyText="Güncel tahmin bulunmuyor"
              router={router}
              onDelete={handleDelete}
            />

            <PredictionSection
              title="Doğru Tahminler"
              subtitle="Biten maçlarda doğru çıkan seçimlerin"
              items={correctPredictions}
              tone="correct"
              emptyText="Doğru tahmin bulunmuyor"
              router={router}
              onDelete={handleDelete}
            />

            <PredictionSection
              title="Hatalı Tahminler"
              subtitle="Biten maçlarda sonucu kaçıran seçimlerin"
              items={wrongPredictions}
              tone="wrong"
              emptyText="Hatalı tahmin bulunmuyor"
              router={router}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>
    </div>
  );
}
