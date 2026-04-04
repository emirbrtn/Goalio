"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { filterActiveLiveMatches } from "@/lib/matchPriority";

const DEFAULT_NOTIFICATION_PREFS = {
  predictionResolved: true,
  favoriteMatchStart: true,
  favoriteMatchResult: true,
};

const NotificationsContext = createContext(null);

function readJsonStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function readCurrentUser() {
  return readJsonStorage("goalio_user", null);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatScore(match) {
  const home = match?.score?.home ?? "-";
  const away = match?.score?.away ?? "-";
  return `${home} - ${away}`;
}

function getActualResult(match) {
  const home = Number(match?.score?.home);
  const away = Number(match?.score?.away);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
  if (home > away) return "homeWin";
  if (away > home) return "awayWin";
  return "draw";
}

export function NotificationsProvider({ children, disabled = false }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const [notifications, setNotifications] = useState([]);
  const [prefs, setPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  async function fetchNotificationHistory(userId, token) {
    const response = await fetch(`${apiBase}/users/${userId}/notifications/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("notification-history-failed");
    }

    return response.json();
  }

  async function syncNotificationPayloads(userId, token, payloads) {
    const response = await fetch(`${apiBase}/users/${userId}/notifications/history/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notifications: payloads }),
    });

    if (!response.ok) {
      throw new Error("notification-sync-failed");
    }

    return response.json();
  }

  async function removeNotification(notificationId) {
    const storedUser = readCurrentUser();
    const token = typeof window !== "undefined" ? localStorage.getItem("goalio_token") : null;
    const userId = String(storedUser?.id || storedUser?._id || "").trim();
    if (!token || !userId || !notificationId) return;

    try {
      const response = await fetch(`${apiBase}/users/${userId}/notifications/history/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((current) => current.filter((item) => item.id !== notificationId && item._id !== notificationId));
      }
    } catch (error) {}
  }

  async function markAllAsRead() {
    const storedUser = readCurrentUser();
    const token = typeof window !== "undefined" ? localStorage.getItem("goalio_token") : null;
    const userId = String(storedUser?.id || storedUser?._id || "").trim();
    if (!token || !userId) return;

    try {
      const response = await fetch(`${apiBase}/users/${userId}/notifications/history/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {}
  }

  function syncStoredUser(nextPrefs) {
    const storedUser = readJsonStorage("goalio_user", null);
    if (!storedUser) return;
    writeJsonStorage("goalio_user", {
      ...storedUser,
      notifications: nextPrefs,
    });
  }

  async function syncNotifications() {
    if (disabled || typeof window === "undefined") return;

    const storedUser = readCurrentUser();
    const token = localStorage.getItem("goalio_token");
    const userId = String(storedUser?.id || storedUser?._id || "").trim();

    if (!storedUser || !token || !userId) {
      setPrefs(DEFAULT_NOTIFICATION_PREFS);
      setNotifications([]);
      return;
    }

    try {
      const [profileRes, predictionsRes, liveRes, historyRes] = await Promise.all([
        fetch(`${apiBase}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`${apiBase}/users/${userId}/predictions`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`${apiBase}/matches/live?limit=100`, { cache: "no-store" }),
        fetch(`${apiBase}/matches/history?limit=100`, { cache: "no-store" }),
      ]);

      const profileData = profileRes.ok ? await profileRes.json() : {};
      const predictionData = predictionsRes.ok ? await predictionsRes.json() : [];
      const liveData = liveRes.ok ? filterActiveLiveMatches(await liveRes.json()) : [];
      const historyData = historyRes.ok ? await historyRes.json() : [];

      const nextPrefs = {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...(profileData?.notifications || storedUser?.notifications || {}),
      };

      setPrefs(nextPrefs);
      syncStoredUser(nextPrefs);

      const favoriteTeams = Array.isArray(profileData?.favoriteTeams) ? profileData.favoriteTeams : [];
      const favoriteNames = favoriteTeams.map((team) => normalizeText(team?.name)).filter(Boolean);

      const payloads = [];
      const pushNotification = (key, payload) => {
        if (!key) return;
        payloads.push({
          key,
          createdAt: new Date().toISOString(),
          ...payload,
        });
      };

      if (Array.isArray(predictionData) && nextPrefs.predictionResolved) {
        predictionData.forEach((prediction) => {
          if (prediction?.match?.status !== "finished") return;

          const actual = getActualResult(prediction.match);
          if (!actual) return;

          const correct = actual === prediction.predictedResult;
          const key = `prediction:${prediction._id || prediction.id}:${correct ? "correct" : "wrong"}`;

          pushNotification(key, {
            type: correct ? "prediction-correct" : "prediction-wrong",
            matchId: prediction.matchId,
            title: correct ? "Doğru tahmin sonuçlandı" : "Tahmin sonucu kaçtı",
            message: `${prediction.match.homeTeam?.name || "Ev Sahibi"} ${formatScore(prediction.match)} ${prediction.match.awayTeam?.name || "Deplasman"}`,
          });
        });
      }

      const isFavoriteMatch = (match) => {
        const home = normalizeText(match?.homeTeam?.name);
        const away = normalizeText(match?.awayTeam?.name);
        return favoriteNames.includes(home) || favoriteNames.includes(away);
      };

      const getFavoriteName = (match) => {
        const home = normalizeText(match?.homeTeam?.name);
        const away = normalizeText(match?.awayTeam?.name);
        if (favoriteNames.includes(home)) return match?.homeTeam?.name || "Favori takım";
        if (favoriteNames.includes(away)) return match?.awayTeam?.name || "Favori takım";
        return "Favori takım";
      };

      if (Array.isArray(liveData) && nextPrefs.favoriteMatchStart) {
        liveData.forEach((match) => {
          if (!isFavoriteMatch(match)) return;
          const key = `favorite-start:${match._id || match.id}`;
          const favoriteName = getFavoriteName(match);
          pushNotification(key, {
            type: "favorite-start",
            matchId: match._id || match.id,
            title: `${favoriteName} maçı başlıyor...`,
            message: `${match.homeTeam?.name || "Ev Sahibi"} - ${match.awayTeam?.name || "Deplasman"}`,
          });
        });
      }

      if (Array.isArray(historyData) && nextPrefs.favoriteMatchResult) {
        historyData.forEach((match) => {
          if (!isFavoriteMatch(match)) return;
          const key = `favorite-result:${match._id || match.id}`;
          const favoriteName = getFavoriteName(match);
          pushNotification(key, {
            type: "favorite-result",
            matchId: match._id || match.id,
            title: `${favoriteName} maçı sonuçlandı`,
            message: `${match.homeTeam?.name || "Ev Sahibi"} ${formatScore(match)} ${match.awayTeam?.name || "Deplasman"}`,
          });
        });
      }

      const nextNotifications = payloads.length
        ? await syncNotificationPayloads(userId, token, payloads)
        : await fetchNotificationHistory(userId, token);

      setNotifications(Array.isArray(nextNotifications) ? nextNotifications : []);
    } catch (error) {}
  }

  useEffect(() => {
    if (!isReady || disabled) return;

    syncNotifications();

    const intervalId = setInterval(() => {
      syncNotifications();
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncNotifications();
      }
    };

    const handleStorage = () => {
      syncNotifications();
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [disabled, isReady]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      prefs,
      refreshNotifications: syncNotifications,
      removeNotification,
      markAllAsRead,
    }),
    [notifications, unreadCount, prefs],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
}
