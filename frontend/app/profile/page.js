"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Key,
  Save,
  ShieldAlert,
  Star,
  Trash2,
  User,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { useNotifications } from "@/components/NotificationsContext";
import { avatarPresets, defaultAvatarId } from "@/lib/avatarPresets";

const DEFAULT_NOTIFICATION_PREFS = {
  predictionResolved: true,
  favoriteMatchStart: true,
  favoriteMatchResult: true,
};

function formatNotificationDate(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    return "";
  }
}

function getNotificationMeta(type) {
  switch (type) {
    case "prediction-correct":
      return {
        icon: CheckCircle2,
        iconClass: "text-emerald-300",
        chipClass: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
        chipLabel: "Doğru Tahmin",
      };
    case "prediction-wrong":
      return {
        icon: ShieldAlert,
        iconClass: "text-rose-300",
        chipClass: "border-rose-400/20 bg-rose-500/10 text-rose-200",
        chipLabel: "Hatalı Tahmin",
      };
    case "favorite-start":
      return {
        icon: Clock3,
        iconClass: "text-amber-300",
        chipClass: "border-amber-400/20 bg-amber-500/10 text-amber-200",
        chipLabel: "Maç Başladı",
      };
    case "favorite-result":
      return {
        icon: Star,
        iconClass: "text-sky-300",
        chipClass: "border-sky-400/20 bg-sky-500/10 text-sky-200",
        chipLabel: "Maç Sonucu",
      };
    default:
      return {
        icon: Bell,
        iconClass: "text-blue-300",
        chipClass: "border-blue-400/20 bg-blue-500/10 text-blue-200",
        chipLabel: "Bildirim",
      };
  }
}

export default function ProfilePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    refreshNotifications,
    removeNotification,
    markAllAsRead,
  } = useNotifications();

  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    avatarId: defaultAvatarId,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("goalio_user") || "null");
    const token = localStorage.getItem("goalio_token");

    if (!storedUser || !token) {
      router.push("/login");
      return;
    }

    loadProfile(storedUser.id || storedUser._id, token);
  }, [router]);

  async function loadProfile(userId, token) {
    try {
      const response = await fetch(`${apiBase}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Profil yüklenemedi");
        setLoading(false);
        return;
      }

      const nextUser = {
        ...data,
        notifications: {
          ...DEFAULT_NOTIFICATION_PREFS,
          ...(data.notifications || {}),
        },
      };

      setUser(nextUser);
      localStorage.setItem("goalio_user", JSON.stringify(nextUser));
      setProfileForm({
        username: nextUser.username || "",
        email: nextUser.email || "",
        avatarId: nextUser.avatarId || defaultAvatarId,
      });
      setNotificationPrefs(nextUser.notifications);
    } catch (error) {
      setMessage("Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(event) {
    event.preventDefault();

    const token = localStorage.getItem("goalio_token");
    const storedUser = JSON.parse(localStorage.getItem("goalio_user") || "null");
    const userId = storedUser?.id || storedUser?._id;

    try {
      const response = await fetch(`${apiBase}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Profil güncellenemedi");
        return;
      }

      const nextUser = {
        ...data,
        notifications: {
          ...DEFAULT_NOTIFICATION_PREFS,
          ...(data.notifications || notificationPrefs),
        },
      };

      localStorage.setItem("goalio_user", JSON.stringify(nextUser));
      setUser(nextUser);
      setProfileForm({
        username: nextUser.username || "",
        email: nextUser.email || "",
        avatarId: nextUser.avatarId || defaultAvatarId,
      });
      setMessage("Profil başarıyla güncellendi");
    } catch (error) {
      setMessage("Profil güncellenemedi");
    }
  }

  async function changePassword(event) {
    event.preventDefault();

    const token = localStorage.getItem("goalio_token");
    const storedUser = JSON.parse(localStorage.getItem("goalio_user") || "null");
    const userId = storedUser?.id || storedUser?._id;

    try {
      const response = await fetch(`${apiBase}/users/${userId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      if (response.status === 204) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
        });
        setMessage("Şifre başarıyla değiştirildi");
        return;
      }

      const data = await response.json();
      setMessage(data.message || "Şifre değiştirilemedi");
    } catch (error) {
      setMessage("Şifre değiştirilemedi");
    }
  }

  async function updateNotifications(event) {
    event.preventDefault();

    const token = localStorage.getItem("goalio_token");
    const storedUser = JSON.parse(localStorage.getItem("goalio_user") || "null");
    const userId = storedUser?.id || storedUser?._id;

    try {
      const response = await fetch(`${apiBase}/users/${userId}/notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notificationPrefs),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Bildirim ayarları güncellenemedi");
        return;
      }

      const nextPrefs = {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...(data || {}),
      };

      setNotificationPrefs(nextPrefs);
      localStorage.setItem(
        "goalio_user",
        JSON.stringify({
          ...(storedUser || {}),
          notifications: nextPrefs,
        }),
      );

      await refreshNotifications();
      setMessage("Bildirim ayarları güncellendi");
    } catch (error) {
      setMessage("Bildirim ayarları güncellenemedi");
    }
  }

  async function deleteProfile() {
    const token = localStorage.getItem("goalio_token");
    const storedUser = JSON.parse(localStorage.getItem("goalio_user") || "null");
    const userId = storedUser?.id || storedUser?._id;

    const confirmed = window.confirm(
      "Profilini kalici olarak silmek istedigine emin misin? Bu islem geri alinamaz.",
    );

    if (!confirmed || !token || !userId) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(data?.message || "Profil silinemedi");
        return;
      }

      localStorage.removeItem("goalio_token");
      localStorage.removeItem("goalio_user");
      setMessage("Profilin silindi");
      router.push("/login");
    } catch (error) {
      setMessage("Profil silinemedi");
    }
  }

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      ),
    [notifications],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <div className="animate-pulse text-base font-semibold text-slate-400">Profil yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-8 p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-slate-700/50 pb-6">
        <UserAvatar avatarId={profileForm.avatarId || user.avatarId} size="md" className="shrink-0" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">Profil ve Bildirimler</h1>
          <p className="text-slate-400">Hesap bilgilerini, bildirim ayarlarını ve geçmiş uyarılarını yönet.</p>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm font-semibold text-blue-200">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.28fr_0.92fr]">
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.12fr_0.88fr]">
            <section className="rounded-[30px] border border-slate-700/50 bg-[#1e293b]/60 p-7 shadow-xl backdrop-blur-md">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                <User size={18} className="text-blue-400" />
                Kişisel Bilgiler
              </h3>
              <form onSubmit={updateProfile} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
                    Kullanıcı Adı
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-[#0f172a]/50 px-4 py-3 text-white outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Kullanıcı adı"
                    value={profileForm.username}
                    onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
                    E-posta
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-[#0f172a]/50 px-4 py-3 text-white outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="E-posta"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                  />
                </div>
                <div className="pt-2">
                  <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-slate-400">
                    Avatar Seçimi
                  </label>
                  <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2">
                    {avatarPresets.map((avatar) => {
                      const isSelected = profileForm.avatarId === avatar.id;

                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, avatarId: avatar.id })}
                          title={`${avatar.name} - ${avatar.role}`}
                          aria-label={`${avatar.name} - ${avatar.role}`}
                          className={`min-w-0 overflow-hidden rounded-[22px] border p-3 text-left transition-all sm:p-4 ${
                            isSelected
                              ? "border-blue-500/80 bg-blue-500/12 shadow-lg shadow-blue-500/10"
                              : "border-slate-700/80 bg-[#0f172a]/30 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-[#0f172a]/55"
                          }`}
                        >
                          <UserAvatar avatarId={avatar.id} size="sm" showLabel className="w-full" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-medium text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-500"
                >
                  <Save size={18} />
                  Profili Güncelle
                </button>

              </form>
            </section>

            <section className="rounded-[30px] border border-slate-700/50 bg-[#1e293b]/60 p-7 shadow-xl backdrop-blur-md">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                <Key size={18} className="text-blue-400" />
                Şifre Değiştir
              </h3>
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
                    Mevcut Şifre
                  </label>
                  <input
                    type="password"
                    placeholder="Mevcut şifre"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#0f172a]/50 px-4 py-3 text-white outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
                    Yeni Şifre
                  </label>
                  <input
                    type="password"
                    placeholder="Yeni şifre"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#0f172a]/50 px-4 py-3 text-white outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-700 py-3 font-medium text-white transition-colors hover:bg-slate-600"
                >
                  Şifreyi Değiştir
                </button>
                <div className="mt-8 rounded-2xl border border-rose-500/15 bg-rose-500/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">Profili Sil</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Hesabini ve tahmin gecmisini kalici olarak siler. Bu islem geri alinamaz.
                  </p>
                  <button
                    type="button"
                    onClick={deleteProfile}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-3 font-medium text-rose-200 transition-all hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-white"
                  >
                    <Trash2 size={18} />
                    Profili Sil
                  </button>
                </div>
              </form>
            </section>
          </div>

          <section className="rounded-[30px] border border-slate-700/50 bg-[#1e293b]/60 p-7 shadow-xl backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Bell size={18} className="text-blue-400" />
                  Bildirim Ayarları
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Tahmin sonuçlarını ve favori takım uyarılarını kontrol et.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-right">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  Okunmamış
                </div>
                <div className="mt-1 text-2xl font-black text-white">{unreadCount}</div>
              </div>
            </div>

            <form onSubmit={updateNotifications} className="space-y-4">
              <div className="space-y-3 rounded-2xl border border-slate-700/40 bg-[#0f172a]/30 p-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-white/[0.02] p-4 transition-all hover:border-slate-700 hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.predictionResolved}
                    aria-label="Tahmin sonucu bildirimlerini aç veya kapat"
                    onChange={(event) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        predictionResolved: event.target.checked,
                      })
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-600 bg-[#0f172a] text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-white">Tahmin Sonucu Bildirimleri</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Tahminin doğru veya hatalı sonuçlandığında haber ver.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-white/[0.02] p-4 transition-all hover:border-slate-700 hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.favoriteMatchStart}
                    aria-label="Favori takım maç başlangıcı bildirimlerini aç veya kapat"
                    onChange={(event) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        favoriteMatchStart: event.target.checked,
                      })
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-600 bg-[#0f172a] text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-white">Favori Takım Maç Başlangıcı</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Favori takımın maçı başladığında anında bildir.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-white/[0.02] p-4 transition-all hover:border-slate-700 hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.favoriteMatchResult}
                    aria-label="Favori takım maç sonucu bildirimlerini aç veya kapat"
                    onChange={(event) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        favoriteMatchResult: event.target.checked,
                      })
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-600 bg-[#0f172a] text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-white">Favori Takım Maç Sonucu</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Favori takımının maç bittiğinde skoru ile birlikte bildir.
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-medium text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-500"
              >
                <Save size={18} />
                Ayarları Kaydet
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-[30px] border border-slate-700/50 bg-[#1e293b]/60 p-7 shadow-xl backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Bildirim Geçmişi</h3>
              <p className="mt-1 text-sm text-slate-400">
                Son tahmin ve favori takım uyarıların burada listelenir.
              </p>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0f172a]/60 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300 transition-all hover:border-blue-500/20 hover:bg-blue-500/10 hover:text-white"
            >
              <CheckCheck size={14} />
              Tümünü Okundu Say
            </button>
          </div>

          {sortedNotifications.length > 0 ? (
            <div className="space-y-3">
              {sortedNotifications.map((notification) => {
                const meta = getNotificationMeta(notification.type);
                const Icon = meta.icon;

                return (
                  <div
                    key={notification.id}
                    className={`rounded-[24px] border px-4 py-4 transition-all ${
                      notification.read
                        ? "border-slate-800 bg-white/[0.02]"
                        : "border-blue-500/20 bg-blue-500/[0.06]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#111827]/70">
                        <Icon size={18} className={meta.iconClass} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${meta.chipClass}`}>
                            {meta.chipLabel}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            {formatNotificationDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-black text-white">{notification.title}</p>
                        <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-400">
                          {notification.message}
                        </p>
                        {notification.matchId ? (
                          <button
                            type="button"
                            onClick={() => router.push(`/matches/${notification.matchId}`)}
                            className="mt-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-300 transition-colors hover:text-white"
                          >
                            Maç Detayına Git
                          </button>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNotification(notification.id)}
                        className="rounded-xl border border-transparent p-2 text-slate-500 transition-all hover:border-slate-700 hover:bg-[#111827]/70 hover:text-rose-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-800 bg-white/[0.02] px-5 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-[#111827]/80">
                <Bell size={18} className="text-slate-500" />
              </div>
              <p className="mt-4 text-base font-black text-white">Henüz bildirim yok</p>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-slate-500">
                Tahminlerin sonuçlandığında ve favori takımın maça çıktığında burada görünecek.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
