'use client';

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Award,
  BrainCircuit,
  Calendar,
  Loader2,
  MapPin,
  PieChart,
  Radio,
  Search,
  Shield,
  Star,
  X,
} from "lucide-react";
import MatchList from "../components/MatchList";
import HeaderActions from "../components/HeaderActions";
import PlayerProfileModal from "../components/PlayerProfileModal";
import StatsCard from "../components/StatsCard";
import { filterActiveLiveMatches, selectHeroMatch, sortLiveMatches } from "@/lib/matchPriority";
import { formatLeagueName, formatLiveMinute, formatMatchDateTime, formatTeamName, getLeagueLogo, parseMatchDate } from "@/lib/text";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const autoSearchParam = searchParams.get("search");
  const autoTeamId = searchParams.get("teamId");

  const [allMatches, setAllMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [historyMatches, setHistoryMatches] = useState([]);
  const [heroMatch, setHeroMatch] = useState(null);
  const [heroStatsMatch, setHeroStatsMatch] = useState(null);
  const [heroStatsLoading, setHeroStatsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [teamSuggestions, setTeamSuggestions] = useState([]);
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [searchedTeam, setSearchedTeam] = useState(null);
  const [teamSquad, setTeamSquad] = useState([]);
  const [teamStandings, setTeamStandings] = useState([]);
  const [teamHistory, setTeamHistory] = useState([]);
  const [teamUpcoming, setTeamUpcoming] = useState([]);
  const [teamTopScorers, setTeamTopScorers] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [matchesTab, setMatchesTab] = useState("results");
  const [mainTab, setMainTab] = useState("squad");

  const [user, setUser] = useState(null);
  const [favTeams, setFavTeams] = useState([]);
  const [favPlayers, setFavPlayers] = useState([]);
  const [activePlayer, setActivePlayer] = useState(null);
  const teamProfileCacheRef = useRef(new Map());
  const heroMatchIdRef = useRef(null);

  const normalizeName = (value) =>
    String(value || "")
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

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

  const syncUserFavorites = () => {
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
    syncUserFavorites();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncUserFavorites();
      }
    };

    const handleStorage = (event) => {
      if (!event.key || event.key.startsWith("goalio_user") || event.key.startsWith("goalio_fav_")) {
        syncUserFavorites();
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    loadHomeData();

    const intervalId = setInterval(() => {
      loadHomeData({ silent: true });
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadHomeData({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [apiBase]);

  useEffect(() => {
    const syncTeamFromUrl = async () => {
      if (!autoSearchParam && !autoTeamId) {
        clearTeamState();
        return;
      }

      const currentTeamId = String(searchedTeam?._id || searchedTeam?.id || "");
      const currentTeamName = normalizeName(searchedTeam?.name);
      const targetTeamName = normalizeName(autoSearchParam || "");

      if ((autoTeamId && currentTeamId === String(autoTeamId)) || (!autoTeamId && searchedTeam && currentTeamName === targetTeamName)) {
        return;
      }

      let selectedTeam = null;
      if (autoTeamId) {
        try {
          const teamRes = await fetch(`${apiBase}/teams/${autoTeamId}`);
          const teamData = await teamRes.json();
          if (teamRes.ok) {
            selectedTeam = {
              id: teamData._id || autoTeamId,
              _id: teamData._id || autoTeamId,
              name: teamData.name || autoSearchParam || "",
              logo: teamData.logo || "",
              country: teamData.country || "",
            };
          }
        } catch (error) {}
      }

      await handleSearch(autoSearchParam || selectedTeam?.name, selectedTeam, { updateUrl: false });
    };

    syncTeamFromUrl();
  }, [apiBase, autoSearchParam, autoTeamId]);

  useEffect(() => {
    const term = String(searchTerm || "").trim();
    if (!term || (searchedTeam?.name && searchedTeam.name.toLowerCase() === term.toLowerCase())) {
      setTeamSuggestions([]);
      setPlayerSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const [teamRes, playerRes] = await Promise.all([
          fetch(`${apiBase}/teams/search?q=${encodeURIComponent(term)}`, {
            signal: controller.signal,
          }),
          fetch(`${apiBase}/players/search?q=${encodeURIComponent(term)}`, {
            signal: controller.signal,
          }),
        ]);
        const [teamData, playerData] = await Promise.all([teamRes.json(), playerRes.json()]);
        if (!controller.signal.aborted) {
          const nextTeams = Array.isArray(teamData) ? teamData : [];
          const nextPlayers = Array.isArray(playerData) ? playerData : [];
          setTeamSuggestions(nextTeams);
          setPlayerSuggestions(nextPlayers);
          setShowSuggestions(nextTeams.length > 0 || nextPlayers.length > 0);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setTeamSuggestions([]);
          setPlayerSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [apiBase, searchTerm, searchedTeam]);

  async function loadHomeData(options = {}) {
    const { silent = false } = options;
    if (!silent) setLoading(true);
    try {
      const [allRes, liveRes, historyRes] = await Promise.all([
        fetch(`${apiBase}/matches?limit=100`, { cache: "no-store" }),
        fetch(`${apiBase}/matches/live?limit=100`, { cache: "no-store" }),
        fetch(`${apiBase}/matches/history?limit=100`, { cache: "no-store" }),
      ]);

      const all = (await allRes.json()) || [];
      const live = (await liveRes.json()) || [];
      const history = (await historyRes.json()) || [];
      const safeAll = Array.isArray(all) ? all : [];
      const safeLive = filterActiveLiveMatches(Array.isArray(live) ? live : []);
      const safeHistory = Array.isArray(history) ? history : [];

      setAllMatches(safeAll);
      setLiveMatches(safeLive);
      setHistoryMatches(safeHistory);

      const nextHero = selectHeroMatch(safeAll, safeLive, safeHistory);

      setHeroMatch(nextHero);
      if (nextHero?.status === "live" || nextHero?.status === "finished") {
        setHeroStatsLoading(true);
        try {
          const heroDetailRes = await fetch(`${apiBase}/matches/${nextHero._id}`, { cache: "no-store" });
          if (heroDetailRes.ok) {
            setHeroStatsMatch(await heroDetailRes.json());
          } else {
            setHeroStatsMatch(null);
          }
        } catch (error) {
          setHeroStatsMatch(null);
        } finally {
          setHeroStatsLoading(false);
        }
      } else {
        setHeroStatsMatch(null);
        setHeroStatsLoading(false);
      }

      if (nextHero) {
        if (heroMatchIdRef.current !== String(nextHero._id)) {
          heroMatchIdRef.current = String(nextHero._id);
          await tryLoadPrediction(nextHero._id);
        }
      } else {
        heroMatchIdRef.current = null;
        setPrediction(null);
      }
    } catch (error) {
      setLiveMatches([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function clearTeamState() {
    setSearchedTeam(null);
    setTeamSquad([]);
    setTeamStandings([]);
    setTeamHistory([]);
    setTeamUpcoming([]);
    setTeamTopScorers([]);
    setMatchesTab("results");
    setMainTab("squad");
  }

  function resetSearchState() {
    setSearchTerm("");
    setTeamSuggestions([]);
    setPlayerSuggestions([]);
    setShowSuggestions(false);
    setProfileLoading(false);
    setActivePlayer(null);
    clearTeamState();
    router.push("/");
  }

  function clearSearchInputState() {
    setSearchTerm("");
    setTeamSuggestions([]);
    setPlayerSuggestions([]);
    setShowSuggestions(false);
    setLoadingSuggestions(false);
  }

  function openPlayerProfile(player) {
    if (!player) return;
    clearSearchInputState();
    setActivePlayer({
      id: player.id || player._id || player.player_id || player.player?.id || null,
      _id: player._id || player.id || player.player_id || player.player?.id || null,
      name: player.name || player.player_name || player.player?.display_name || "Futbolcu",
      image: player.image || player.player?.image_path || "",
      position: player.position || player.player?.position?.name || "",
      teamName: player.teamName || searchedTeam?.name || "",
      teamLogo: player.teamLogo || searchedTeam?.logo || "",
      number: player.jersey_number || player.number || null,
    });
  }

  async function handleSearch(termOverride, selectedTeam, options = {}) {
    const { updateUrl = true } = options;
    const term = String(termOverride || searchTerm || "").trim();
    if (!term) return;

    clearSearchInputState();

    let fallbackTeam = selectedTeam ? {
      ...selectedTeam,
      id: selectedTeam.id || selectedTeam._id,
      _id: selectedTeam._id || selectedTeam.id,
    } : null;

    try {
      if (!fallbackTeam) {
        const teamRes = await fetch(`${apiBase}/teams/search?q=${encodeURIComponent(term)}`);
        const teamData = await teamRes.json();
        const safeTeams = Array.isArray(teamData) ? teamData : [];
        const normalizedTerm = normalizeName(term);
        fallbackTeam =
          safeTeams.find((team) => normalizeName(team.name) === normalizedTerm) ||
          safeTeams.find((team) => normalizeName(team.name).includes(normalizedTerm)) ||
          safeTeams[0] ||
          null;
      }

      if (!fallbackTeam) {
        const searchRes = await fetch(`${apiBase}/matches/search?q=${encodeURIComponent(term)}&limit=50`);
        const searchData = await searchRes.json();
        const safeMatches = Array.isArray(searchData) ? searchData : [];
        const normalizedTerm = normalizeName(term);
        for (const match of safeMatches) {
          if (normalizeName(match.homeTeam?.name).includes(normalizedTerm)) {
            fallbackTeam = match.homeTeam;
            break;
          }
          if (normalizeName(match.awayTeam?.name).includes(normalizedTerm)) {
            fallbackTeam = match.awayTeam;
            break;
          }
        }
      }

      if (!fallbackTeam) {
        try {
          const playerRes = await fetch(`${apiBase}/players/search?q=${encodeURIComponent(term)}`);
          const playerData = await playerRes.json();
          const safePlayers = Array.isArray(playerData) ? playerData : [];
          const normalizedTerm = normalizeName(term);
          const fallbackPlayer =
            safePlayers.find((player) => normalizeName(player.name) === normalizedTerm) ||
            safePlayers.find((player) => normalizeName(player.name).includes(normalizedTerm)) ||
            safePlayers[0] ||
            null;

          if (fallbackPlayer) {
            openPlayerProfile(fallbackPlayer);
            return;
          }
        } catch (error) {}

        clearTeamState();
        return;
      }
      const fallbackResults = [...historyMatches, ...allMatches]
        .filter((match) => match.homeTeam?.name === fallbackTeam.name || match.awayTeam?.name === fallbackTeam.name)
        .filter((match) => match.status === "finished")
        .sort((a, b) => (parseMatchDate(b.startTime || b.date)?.getTime() || 0) - (parseMatchDate(a.startTime || a.date)?.getTime() || 0));
      const fallbackFixtures = allMatches
        .filter((match) => match.homeTeam?.name === fallbackTeam.name || match.awayTeam?.name === fallbackTeam.name)
        .filter((match) => match.status === "scheduled" || match.status === "live")
        .sort((a, b) => (parseMatchDate(a.startTime || a.date)?.getTime() || 0) - (parseMatchDate(b.startTime || b.date)?.getTime() || 0));

      const immediateTeam = {
        ...fallbackTeam,
        id: fallbackTeam.id || fallbackTeam._id,
        _id: fallbackTeam._id || fallbackTeam.id,
      };

      setProfileLoading(true);
      setSearchedTeam(immediateTeam);
      setTeamHistory(fallbackResults);
      setTeamUpcoming(fallbackFixtures);
      setTeamSquad([]);
      setTeamStandings([]);
      setTeamTopScorers([]);
      setMatchesTab(fallbackResults.length > 0 ? "results" : "fixtures");
      setMainTab("squad");

      const cacheKey = String(immediateTeam._id || immediateTeam.id || normalizeName(immediateTeam.name));
      let profileData = teamProfileCacheRef.current.get(cacheKey) || null;

      if (!profileData) {
        const profileRes = await fetch(`${apiBase}/matches/team-profile/${encodeURIComponent(immediateTeam.name)}`);
        profileData = profileRes.ok ? await profileRes.json() : null;
        if (profileData) {
          teamProfileCacheRef.current.set(cacheKey, profileData);
        }
      }

      const nextTeam = {
        ...immediateTeam,
        ...(profileData?.team || {}),
        id: profileData?.team?.id || profileData?.team?._id || immediateTeam.id || immediateTeam._id,
        _id: profileData?.team?._id || profileData?.team?.id || immediateTeam._id || immediateTeam.id,
      };

      setSearchedTeam(nextTeam);
      setTeamSquad(Array.isArray(profileData?.squad) ? profileData.squad : []);
      setTeamStandings(Array.isArray(profileData?.standings) ? profileData.standings : []);
      setTeamHistory(Array.isArray(profileData?.results) && profileData.results.length > 0 ? profileData.results : fallbackResults);
      setTeamUpcoming(Array.isArray(profileData?.fixtures) && profileData.fixtures.length > 0 ? profileData.fixtures : fallbackFixtures);
      setTeamTopScorers(Array.isArray(profileData?.topScorers) ? profileData.topScorers : []);
      setMatchesTab(
        (Array.isArray(profileData?.results) && profileData.results.length > 0) || fallbackResults.length > 0
          ? "results"
          : "fixtures",
      );

      if (updateUrl) {
        const nextQuery = `/?search=${encodeURIComponent(nextTeam.name)}&teamId=${encodeURIComponent(nextTeam._id || nextTeam.id || "")}`;
        const currentQuery = `/?search=${encodeURIComponent(autoSearchParam || "")}&teamId=${encodeURIComponent(autoTeamId || "")}`;
        if (nextQuery !== currentQuery) {
          router.push(nextQuery);
        }
      }
    } catch (error) {
      clearTeamState();
    } finally {
      setProfileLoading(false);
    }
  }

  function handleQuickTeamOpen(teamName, teamId, teamData) {
    handleSearch(
      teamName,
      teamData || {
        id: teamId,
        _id: teamId,
        name: teamName,
      },
      { updateUrl: true },
    );
  }

  async function tryLoadPrediction(matchId) {
    const token = localStorage.getItem("goalio_token");
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/predictions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPrediction({
          homeWin: Math.round(data.probabilities.homeWin * 100),
          draw: Math.round(data.probabilities.draw * 100),
          awayWin: Math.round(data.probabilities.awayWin * 100),
          confidence: Math.round(Math.max(data.probabilities.homeWin, data.probabilities.draw, data.probabilities.awayWin) * 100),
        });
      }
    } catch (error) {}
  }

  async function toggleFavTeam(team) {
    if (!getUserStorageId()) {
      router.push("/login");
      return;
    }

    let next = [...favTeams];
    if (next.some((entry) => entry.name === team.name)) next = next.filter((entry) => entry.name !== team.name);
    else next.push({ name: team.name, logo: team.logo });
    setFavTeams(next);
    writeFavoriteStorage("teams", next);
    await persistFavoritesForUser(next, favPlayers);
  }

  async function toggleFavPlayer(player, teamName) {
    if (!getUserStorageId()) {
      router.push("/login");
      return;
    }

    let next = [...favPlayers];
    const playerName = player.name || player.player_name;
    if (next.some((entry) => entry.name === playerName)) next = next.filter((entry) => entry.name !== playerName);
    else next.push({ name: playerName, image: player.image, jersey_number: player.jersey_number, teamName });
    setFavPlayers(next);
    writeFavoriteStorage("players", next);
    await persistFavoritesForUser(favTeams, next);
  }

  const getFormattedDate = (match) => formatMatchDateTime(match.startTime || match.date || match.starting_at) || "-";

  const sortedLiveMatches = sortLiveMatches(liveMatches, heroMatch?._id);

  const heroHomeScore = heroMatch?.status === "scheduled" ? "-" : (heroMatch?.score?.home ?? 0);
  const heroAwayScore = heroMatch?.status === "scheduled" ? "-" : (heroMatch?.score?.away ?? 0);
  const displaySearchedTeamName = formatTeamName(searchedTeam?.name || "");
  const displayHeroHomeTeamName = formatTeamName(heroMatch?.homeTeam?.name || "");
  const displayHeroAwayTeamName = formatTeamName(heroMatch?.awayTeam?.name || "");
  const heroLiveMinuteLabel = formatLiveMinute(heroMatch);
  const heroDateTimeLabel = heroMatch ? getFormattedDate(heroMatch) : "";
  const heroLeagueLogo = getLeagueLogo(heroMatch?.league);
  const formatCapacity = (value) => {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) && numericValue > 0
      ? new Intl.NumberFormat("tr-TR").format(numericValue)
      : "";
  };
  const locationLabel = [searchedTeam?.country, searchedTeam?.city].filter(Boolean).join(", ");
  const stadiumLabel = searchedTeam?.stadium
    ? [searchedTeam.stadium, searchedTeam?.capacity ? formatCapacity(searchedTeam.capacity) : ""]
        .filter(Boolean)
        .join(" • ")
    : "";
  const teamInfoItems = [
    locationLabel ? { key: "location", label: locationLabel, icon: MapPin, color: "text-blue-500" } : null,
    searchedTeam?.leagueName ? { key: "league", label: formatLeagueName(searchedTeam.leagueName), icon: Shield, color: "text-yellow-500" } : null,
    stadiumLabel ? { key: "stadium", label: stadiumLabel, emoji: "🏟️" } : null,
    searchedTeam?.founded ? { key: "founded", label: `Kurulus ${searchedTeam.founded}`, icon: Calendar, color: "text-violet-400" } : null,
  ].filter(Boolean);
  const formSummary = teamHistory
    .slice(0, 5)
    .map((match) => {
      const isHome = String(match.homeTeam?._id || "") === String(searchedTeam?._id || searchedTeam?.id || "");
      const teamGoals = Number(isHome ? match.score?.home ?? 0 : match.score?.away ?? 0);
      const opponentGoals = Number(isHome ? match.score?.away ?? 0 : match.score?.home ?? 0);
      const result = teamGoals > opponentGoals ? "G" : teamGoals < opponentGoals ? "M" : "B";

      return {
        id: match._id,
        result,
        opponent: formatTeamName(isHome ? match.awayTeam?.name : match.homeTeam?.name),
        score: `${teamGoals}-${opponentGoals}`,
        date: getFormattedDate(match),
      };
    });
  const teamDetailPanel =
    mainTab === "squad" ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {teamSquad.map((player, index) => {
          const isFav = favPlayers.some((entry) => entry.name === (player.name || player.player_name));
          return (
            <div key={index} className="relative min-h-[108px] bg-[#1e293b] border border-slate-700/50 p-4 rounded-[20px] flex items-start gap-4 hover:border-blue-500/30 transition-colors">
              <button onClick={(event) => { event.stopPropagation(); toggleFavPlayer(player, searchedTeam.name); }} className="absolute top-2 right-2 p-1 text-slate-500 hover:text-yellow-500">
                <Star size={16} className={isFav ? "fill-yellow-500 text-yellow-500" : ""} />
              </button>
              <div className="w-12 h-12 rounded-full bg-[#0f172a] border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 mt-1">
                {player.image ? <img src={player.image} className="w-full h-full object-cover" alt={player.name || player.player_name} /> : <span className="text-blue-500 font-black">{player.jersey_number || "-"}</span>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col pr-6">
                <button type="button" onClick={() => openPlayerProfile({ ...player, teamName: searchedTeam?.name, teamLogo: searchedTeam?.logo })} className="text-left text-[14px] font-bold text-white leading-[1.15] transition-colors hover:text-blue-300 break-words whitespace-normal">
                  {String(player.name || player.player_name || "")}
                </button>
                <span className="mt-2 text-[9px] text-blue-400 font-bold tracking-[0.2em] uppercase leading-tight break-words whitespace-normal">{player.position || "Oyuncu"}</span>
              </div>
            </div>
          );
        })}
      </div>
    ) : mainTab === "standings" ? (
      <div className="bg-[#1e293b] rounded-[25px] border border-slate-700/50 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#0f172a] text-slate-400 font-black uppercase text-[10px]">
            <tr>
              <th className="p-4 pl-6">#</th>
              <th className="p-4">Takim</th>
              <th className="p-4 text-center">O</th>
              <th className="p-4 text-center">G</th>
              <th className="p-4 text-center">B</th>
              <th className="p-4 text-center">M</th>
              <th className="p-4 pr-6 text-center text-blue-400">P</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {teamStandings.map((standing, index) => (
              <tr key={index} className={standing.team_name === searchedTeam.name ? "bg-blue-600/20" : ""}>
                <td className="p-4 pl-6 font-black">{standing.position}</td>
                <td className="p-4 font-black flex items-center gap-3">
                  <img src={standing.logo} className="w-6 h-6 object-contain" alt={standing.team_name} />
                  <span className={standing.team_name === searchedTeam.name ? "text-blue-400" : "text-slate-200"}>{formatTeamName(standing.team_name)}</span>
                </td>
                <td className="p-4 text-center font-bold">{standing.played}</td>
                <td className="p-4 text-center font-bold text-green-400">{standing.won}</td>
                <td className="p-4 text-center font-bold text-slate-400">{standing.draw}</td>
                <td className="p-4 text-center font-bold text-red-400">{standing.lost}</td>
                <td className="p-4 pr-6 text-center font-black text-blue-500">{standing.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : mainTab === "form" ? (
      <div className="space-y-6">
        {formSummary.length > 0 ? (
          <>
            <div className="grid grid-cols-5 gap-3">
              {formSummary.map((entry) => (
                <div key={entry.id} className={`rounded-[20px] border px-4 py-5 text-center ${entry.result === "G" ? "border-emerald-500/30 bg-emerald-500/10" : entry.result === "M" ? "border-red-500/30 bg-red-500/10" : "border-slate-600/40 bg-slate-500/10"}`}>
                  <div className={`text-2xl font-black ${entry.result === "G" ? "text-emerald-300" : entry.result === "M" ? "text-red-300" : "text-slate-200"}`}>{entry.result}</div>
                  <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{entry.date}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {formSummary.map((entry) => (
                <div key={`${entry.id}-detail`} className="rounded-[22px] border border-slate-700/50 bg-[#1e293b] px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-black text-white">{entry.opponent}</div>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{entry.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-blue-300">{entry.score}</div>
                      <div className={`mt-1 text-[10px] font-black uppercase tracking-[0.2em] ${entry.result === "G" ? "text-emerald-300" : entry.result === "M" ? "text-red-300" : "text-slate-300"}`}>{entry.result === "G" ? "Galibiyet" : entry.result === "M" ? "Maglubiyet" : "Beraberlik"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full min-h-[220px] flex items-center justify-center rounded-[25px] border border-dashed border-slate-700/50 text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Form verisi bulunamadi</div>
        )}
      </div>
    ) : (
      <div className="space-y-3">
        {teamTopScorers.length > 0 ? teamTopScorers.map((scorer, index) => (
          <div key={`${scorer.id || scorer.name}-${index}`} className="rounded-[22px] border border-slate-700/50 bg-[#1e293b] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-sm font-black text-blue-400">{index + 1}</div>
                <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-700 bg-[#0f172a]">
                  {scorer.image ? <img src={scorer.image} alt={scorer.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm font-black text-blue-300">{String(scorer.name || "?").slice(0, 1)}</div>}
                </div>
                <div className="min-w-0">
                  <button type="button" onClick={() => openPlayerProfile({ ...scorer, teamName: searchedTeam?.name, teamLogo: searchedTeam?.logo })} className="text-left text-sm font-black text-white hover:text-blue-300 transition-colors">
                    {scorer.name}
                  </button>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sezon golleri</div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-lg font-black text-amber-300">{scorer.goals}</div>
            </div>
          </div>
        )) : <div className="h-full min-h-[220px] flex items-center justify-center rounded-[25px] border border-dashed border-slate-700/50 text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Gol kralligi verisi bulunamadi</div>}
      </div>
    );

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#0f172a]"><Loader2 className="animate-spin text-blue-500" size={64} /></div>;
  }

  return (
    <div className="bg-[#0f172a] min-h-screen w-full flex flex-col text-slate-300">
      <header className="flex items-center justify-between p-8 pb-3 border-b border-slate-700/50">
        <div>
          <span className="px-3 py-1 text-[9px] font-black bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 tracking-[0.2em] mb-2 inline-block">GOALIO INTELLIGENCE SYSTEM</span>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 italic uppercase tracking-tighter">GOALIO DASHBOARD</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 120)} onKeyDown={(event) => event.key === "Enter" && handleSearch()} placeholder="Takım veya futbolcu ara..." className="pl-12 pr-12 py-3 bg-[#1e293b] border border-slate-700/50 rounded-2xl text-sm text-white w-full focus:outline-none focus:border-blue-500" />
            {searchTerm && <button onClick={resetSearchState} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={18} /></button>}
            {showSuggestions && searchTerm.trim() && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-30">
                {loadingSuggestions ? <div className="px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Sonuçlar hazırlanıyor...</div> : <>
                  {teamSuggestions.length > 0 ? <div className="px-4 pt-4 pb-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Takımlar</div> : null}
                  {teamSuggestions.map((team) => (
                    <button key={`team-${team._id || team.name}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSearch(team.name, team)} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#1e293b] border-b border-slate-800/70">
                      {team.logo ? <img src={team.logo} alt={team.name} className="w-8 h-8 rounded-full bg-white object-contain p-1" /> : <div className="w-8 h-8 rounded-full bg-slate-800" />}
                      <div className="min-w-0"><p className="text-sm font-bold text-white truncate">{formatTeamName(team.name)}</p><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Takım Profili</p></div>
                    </button>
                  ))}
                  {playerSuggestions.length > 0 ? <div className="px-4 pt-4 pb-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Futbolcular</div> : null}
                  {playerSuggestions.map((player) => (
                    <button key={`player-${player._id || player.name}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => openPlayerProfile(player)} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#1e293b] border-b border-slate-800/70 last:border-b-0">
                      {player.image ? <img src={player.image} alt={player.name} className="w-8 h-8 rounded-full bg-slate-900 object-cover" /> : <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-blue-300">{String(player.name || "?").slice(0, 1)}</div>}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{player.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 truncate">{player.teamName || player.position || "Oyuncu Profili"}</p>
                      </div>
                    </button>
                  ))}
                  {teamSuggestions.length === 0 && playerSuggestions.length === 0 ? <div className="px-4 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Sonuç bulunamadı</div> : null}
                </>}
              </div>
            )}
          </div>
          <button onClick={() => handleSearch()} className="border border-blue-400/20 bg-blue-500/12 hover:bg-blue-500/20 text-blue-100 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors">Ara</button>
            <HeaderActions inline />
        </div>
      </header>

      <main className="p-8 flex-1 bg-[#0f172a]">
        {searchedTeam ? (
          <div className="max-w-7xl mx-auto">
            <button onClick={resetSearchState} className="mb-6 flex items-center gap-3 text-blue-400 font-black text-[11px] uppercase tracking-[0.3em]"><ArrowLeft size={16} /> Dashboard'a Dön</button>
            <div className="bg-[#1e293b] border border-slate-700/50 rounded-[45px] p-10 flex flex-col md:flex-row items-center md:items-stretch gap-10 mb-8">
              <div className="bg-white rounded-[35px] p-8 w-40 h-40 flex items-center justify-center shrink-0 shadow-2xl border-4 border-[#0f172a]">
                <img src={searchedTeam.logo} className="max-h-full object-contain" alt={searchedTeam.name} />
              </div>
              <div className="flex-1 flex items-stretch justify-between gap-8">
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-5xl md:text-[4.5rem] font-extrabold leading-none tracking-[-0.06em] text-white">{displaySearchedTeamName}</h2>
                    {profileLoading ? <span className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300"><Loader2 size={14} className="animate-spin" /> Profil yükleniyor</span> : null}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                    {teamInfoItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <span
                          key={item.key}
                          className="flex items-center gap-2 bg-[#0f172a] px-5 py-2.5 rounded-2xl border border-slate-700"
                        >
                          {item.emoji ? (
                            <span className="text-[15px] leading-none">{item.emoji}</span>
                          ) : (
                            <Icon size={16} className={item.color} />
                          )}
                          {item.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex min-w-[210px] flex-col items-end justify-between">
                  <button onClick={() => toggleFavTeam(searchedTeam)} className={`self-end p-4 rounded-2xl border ${favTeams.some((entry) => entry.name === searchedTeam.name) ? "bg-yellow-500/10 border-yellow-500/30" : "bg-[#0f172a] border-slate-700 hover:bg-[#24334d]"}`}><Star size={30} className={favTeams.some((entry) => entry.name === searchedTeam.name) ? "fill-yellow-500 text-yellow-500" : "text-slate-500"} /></button>
                  {searchedTeam?.coach?.name ? (
                    <div className="mt-6 inline-flex min-w-[260px] items-center gap-4 rounded-[24px] border border-slate-700 bg-[#0f172a] px-4 py-3">
                      <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-700 bg-[#1e293b] shrink-0">
                        {searchedTeam.coach.image ? (
                          <img
                            src={searchedTeam.coach.image}
                            alt={searchedTeam.coach.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[22px]">
                            {String.fromCodePoint(0x1F464)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-500">
                          Teknik Direktör
                        </div>
                        <div className="mt-1 break-words text-sm font-black normal-case tracking-normal text-white">
                          {searchedTeam.coach.name}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 pb-10">
              <div className="w-full lg:w-[40%] bg-[#1e293b] border border-slate-700/50 rounded-[45px] h-[600px] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-700/50"><div className="flex bg-[#0f172a] rounded-2xl p-2 border border-slate-700"><button onClick={() => setMatchesTab("results")} className={`flex-1 py-3 text-[11px] font-black uppercase rounded-xl ${matchesTab === "results" ? "bg-[#1e293b] text-white" : "text-slate-500"}`}>Sonuçlar</button><button onClick={() => setMatchesTab("fixtures")} className={`flex-1 py-3 text-[11px] font-black uppercase rounded-xl ${matchesTab === "fixtures" ? "bg-[#1e293b] text-white" : "text-slate-500"}`}>Fikstürler</button></div></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {(matchesTab === "results" ? teamHistory : teamUpcoming).length > 0 ? (matchesTab === "results" ? teamHistory : teamUpcoming).map((match) => (
                    <button key={match._id} type="button" onClick={() => router.push(`/matches/${match._id}`)} className="w-full bg-[#1e293b]/60 border border-slate-700/30 p-5 rounded-[25px] flex items-center gap-5 hover:bg-[#24334d] text-left">
                      <span className="text-[11px] font-black text-slate-500 uppercase">{getFormattedDate(match)}</span>
                      <div className="flex-1 flex flex-col gap-2 text-sm font-black text-slate-300">
                        <div className="flex justify-between items-center gap-3"><span className="truncate">{formatTeamName(match.homeTeam.name)}</span><span className="text-blue-500">{match.status === "scheduled" ? "-" : (match.score?.home ?? "-")}</span></div>
                        <div className="flex justify-between items-center gap-3"><span className="truncate">{formatTeamName(match.awayTeam.name)}</span><span className="text-blue-500">{match.status === "scheduled" ? "-" : (match.score?.away ?? "-")}</span></div>
                      </div>
                    </button>
                  )) : <div className="h-full min-h-[220px] flex items-center justify-center rounded-[25px] border border-dashed border-slate-700/50 text-slate-500 text-xs font-black uppercase tracking-[0.2em]">{matchesTab === "results" ? "Geçmiş maç bulunamadı" : "Yaklaşan maç bulunamadı"}</div>}
                </div>
              </div>

                <div className="w-full lg:w-[60%] bg-[#1e293b] border border-slate-700/50 rounded-[45px] h-[600px] flex flex-col overflow-hidden">
                <div className="grid grid-cols-4 border-b border-slate-700/50 px-6 pt-4">
                  <button onClick={() => setMainTab("squad")} className={`min-w-0 whitespace-nowrap px-3 py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.08em] border-b-4 text-center ${mainTab === "squad" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500"}`}>Oyuncular</button>
                  <button onClick={() => setMainTab("standings")} className={`min-w-0 whitespace-nowrap px-3 py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.08em] border-b-4 text-center ${mainTab === "standings" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500"}`}>Puan Durumu</button>
                  <button onClick={() => setMainTab("form")} className={`min-w-0 whitespace-nowrap px-3 py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.08em] border-b-4 text-center ${mainTab === "form" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500"}`}>Form Durumu</button>
                  <button onClick={() => setMainTab("topscorers")} className={`min-w-0 whitespace-nowrap px-3 py-5 text-[11px] md:text-[12px] font-black uppercase tracking-[0.08em] border-b-4 text-center ${mainTab === "topscorers" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500"}`}>En Golculer</button>
                </div>
                  <div className="flex-1 overflow-y-auto p-10 bg-[#0f172a]/30">
                    {teamDetailPanel}
                  </div>
                </div>
            </div>
          </div>
        ) : heroMatch ? (
          <>
            <div
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/matches/${heroMatch._id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/matches/${heroMatch._id}`);
                }
              }}
              className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] rounded-[30px] p-5 shadow-2xl border border-slate-700/50 mb-5 flex items-center justify-between cursor-pointer transition-all hover:border-blue-500/40 hover:shadow-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <div className="flex items-center gap-10 w-full">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-xl border border-indigo-500/20"><Star size={14} className="fill-indigo-400" /> Haftanın Vitrini</div>
                  {heroLeagueLogo ? (
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                      <img src={heroLeagueLogo} alt={formatLeagueName(heroMatch?.league) || "Lig"} className="h-5 w-5 object-contain" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                        {formatLeagueName(heroMatch?.league) || "Bilinmeyen Lig"}
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center justify-center gap-8 w-full">
                  <button type="button" onClick={(event) => { event.stopPropagation(); handleSearch(heroMatch.homeTeam?.name, heroMatch.homeTeam); }} className="flex items-center gap-6 flex-1 justify-end">
                    <img src={heroMatch.homeTeam?.logo} className="w-14 h-14 object-contain" alt={heroMatch.homeTeam?.name} />
                    <span className="text-3xl md:text-4xl font-extrabold tracking-[-0.05em] text-white pr-4 whitespace-nowrap hover:text-blue-400 transition-colors">{displayHeroHomeTeamName}</span>
                  </button>
                  <div className="text-blue-500 bg-black/40 px-10 py-3 rounded-[25px] border border-white/5 text-4xl font-black">{heroHomeScore} : {heroAwayScore}</div>
                  <button type="button" onClick={(event) => { event.stopPropagation(); handleSearch(heroMatch.awayTeam?.name, heroMatch.awayTeam); }} className="flex items-center gap-6 flex-1 justify-start">
                    <span className="text-3xl md:text-4xl font-extrabold tracking-[-0.05em] text-white whitespace-nowrap pr-4 hover:text-blue-400 transition-colors">{displayHeroAwayTeamName}</span>
                    <img src={heroMatch.awayTeam?.logo} className="w-14 h-14 object-contain" alt={heroMatch.awayTeam?.name} />
                  </button>
                </div>
              </div>
              <div className="hidden pr-6 text-right lg:block">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${heroMatch.status === "live" ? "bg-red-500 animate-pulse" : heroMatch.status === "scheduled" ? "bg-amber-400" : "bg-slate-500"}`}></div>
                  <span className="text-[12px] font-black text-blue-400 uppercase italic tracking-[0.2em]">
                    {heroMatch.status === "live" ? "CANLI" : heroMatch.status === "scheduled" ? "YAKINDA" : "FINAL"}
                  </span>
                </div>
                {heroMatch.status === "live" && heroLiveMinuteLabel ? (
                  <div className="mt-2 text-[24px] font-black italic tracking-tight text-red-400">{heroLiveMinuteLabel}</div>
                ) : null}
                {heroMatch.status !== "live" && heroDateTimeLabel ? (
                  <div className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {heroDateTimeLabel}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <AIPredictionCard prediction={prediction} homeTeam={displayHeroHomeTeamName} awayTeam={displayHeroAwayTeamName} />
              <div className="bg-gradient-to-br from-[#1e293b] to-[#2e1065] p-6 rounded-[40px] border border-purple-500/20 shadow-3xl h-[250px] flex flex-col"><div className="flex items-center justify-between mb-4"><h4 className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[#d4bfa6] font-black text-xl uppercase tracking-tighter italic">İstatistikler</h4><PieChart size={20} className="text-blue-400 opacity-60" /></div><div className="flex-1 flex items-center justify-center">{heroMatch.status === "scheduled" ? <div className="text-center opacity-50"><Activity size={30} className="mx-auto text-blue-400 animate-pulse" /><p className="text-[10px] font-black uppercase tracking-widest mt-2">Maç başladığında aktif olacak</p></div> : heroStatsLoading ? <div className="text-center opacity-70"><Loader2 size={28} className="mx-auto text-blue-400 animate-spin" /><p className="text-[10px] font-black uppercase tracking-widest mt-2">İstatistikler yükleniyor</p></div> : <StatsCard match={heroStatsMatch || heroMatch} compact />}</div></div>
                <div className="bg-gradient-to-br from-[#1e293b] to-[#2e1065] p-6 rounded-[40px] border border-purple-500/20 shadow-3xl h-[250px] flex flex-col justify-between"><div className="flex items-center justify-between border-b border-white/5 pb-3"><h4 className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[#d4bfa6] font-black text-xl uppercase tracking-tighter italic">Genel Rapor</h4><Activity size={22} className="text-blue-400 opacity-60" /></div><div className="space-y-4 pt-2"><ReportRow label="Veri Tabanı Hacmi" value={`${allMatches.length} MAÇ`} /><ReportRow label="Aktif Canlı Maç" value={`${liveMatches.length} CANLI`} /><ReportRow label="Arşiv Kaydı" value={`${historyMatches.length} BİTEN`} /></div></div>
            </div>

            {liveMatches.length > 0 ? (
              <section className="mb-10">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="flex items-center gap-4 border-l-4 border-red-600 pl-4 text-[12px] font-black uppercase italic tracking-[0.4em] text-red-500">
                    <Radio size={18} className="animate-pulse" /> CANLI MAÇLAR
                  </h3>
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-red-300">
                    {liveMatches.length} aktif karsilasma
                  </div>
                </div>
                <div className="max-h-[620px] overflow-y-auto pr-2 custom-scrollbar">
                  <MatchList title="" matches={sortedLiveMatches} variant="live-home" onTeamSelect={handleQuickTeamOpen} />
                </div>
              </section>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                {null}
                <h3 className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[#d4bfa6] font-black uppercase tracking-[0.4em] flex items-center gap-4 text-[12px] italic border-l-4 border-blue-500 pl-4"><Award size={18} className="text-blue-500" /> TAMAMLANAN MAÇLAR</h3>
                <MatchList title="" matches={historyMatches.slice(0, 20)} onTeamSelect={handleQuickTeamOpen} />
              </div>
              <div className="space-y-6">
                <h3 className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[#d4bfa6] font-black uppercase tracking-[0.4em] flex items-center gap-4 text-[12px] italic border-l-4 border-purple-500 pl-4"><Calendar size={18} className="text-purple-500" /> YAKLAŞAN MAÇLAR</h3>
                <MatchList title="" matches={allMatches.filter((match) => match.status === "scheduled").slice(0, 20)} onTeamSelect={handleQuickTeamOpen} />
              </div>
            </div>
          </>
        ) : <div className="text-center py-40 bg-[#1e293b]/20 border-2 border-dashed border-slate-800 rounded-[80px] font-black uppercase tracking-[0.6em] text-sm italic">SİNYAL BEKLENİYOR...</div>}
        <footer className="mt-16 border-t border-slate-800/80 pt-8 pb-10">
          <div className="grid gap-6 rounded-[28px] border border-slate-700/40 bg-[#111827]/55 px-6 py-6 backdrop-blur-sm md:grid-cols-3 md:items-center">
            <div className="text-left">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Yapımcılar</div>
              <p className="mt-2 text-sm font-bold text-slate-200">
                Murat Koçgürbüz, Onur Eken, Emircan Bartan
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black tracking-[0.08em] text-slate-200">
                ©2026 Emotion – Tüm Hakları Saklıdır.
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Veri Sağlayıcı</div>
              <p className="mt-2 text-sm font-bold text-blue-300">
                Maç verileri SportMonks altyapısı ile sunulmaktadır.
              </p>
            </div>
          </div>
        </footer>
      </main>
      <PlayerProfileModal isOpen={Boolean(activePlayer)} player={activePlayer} onClose={() => setActivePlayer(null)} apiBase={apiBase} />
    </div>
  );
}

function AIPredictionCard({ prediction, homeTeam, awayTeam }) {
  const options = prediction
    ? [
        { label: homeTeam || "Ev Sahibi", short: "1", value: prediction.homeWin, color: "from-blue-500 to-cyan-400" },
        { label: "Beraberlik", short: "X", value: prediction.draw, color: "from-slate-500 to-slate-300" },
        { label: awayTeam || "Deplasman", short: "2", value: prediction.awayWin, color: "from-amber-500 to-yellow-300" },
      ]
    : [];

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_40%),linear-gradient(145deg,#111827,#0b1220)] p-6 rounded-[40px] border border-blue-500/20 shadow-3xl h-[250px] flex flex-col justify-between">
      <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-blue-500/10 blur-2xl" />
      <div className="absolute -left-10 bottom-0 w-28 h-28 rounded-full bg-cyan-400/10 blur-2xl" />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h4 className="text-blue-300 font-black text-xl uppercase tracking-tighter italic">AI Tahmin</h4>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mt-1">Maçın olasılık dağılımı</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
          <BrainCircuit size={18} className="text-blue-300 animate-pulse" />
        </div>
      </div>

      {prediction ? (
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {options.map((option) => (
            <div key={option.short} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{option.short}</span>
                <span className="text-base font-black text-white">%{option.value}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800/80">
                <div className={`h-full rounded-full bg-gradient-to-r ${option.color}`} style={{ width: `${option.value}%` }} />
              </div>
              <p className="mt-3 text-[11px] font-bold text-slate-300 leading-4 line-clamp-2 min-h-[32px]">{option.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative z-10 rounded-[28px] border border-dashed border-blue-400/20 bg-black/10 px-5 py-8 text-center">
          <p className="text-lg font-black text-white">Hazırlanıyor</p>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mt-2">Analiz verisi bekleniyor</p>
        </div>
      )}
    </div>
  );
}

function ReportRow({ label, value }) {
  return <div className="flex justify-between items-center"><span className="text-slate-400 uppercase font-black text-[9px] tracking-widest">{label}</span><span className="text-white bg-black/40 border border-white/5 px-4 py-1.5 rounded-xl font-black text-[10px]">{value}</span></div>;
}

export default function HomePage() {
  return <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0f172a]"><Loader2 className="animate-spin text-blue-500" size={64} /></div>}><HomeContent /></Suspense>;
}
