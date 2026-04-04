"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
import { useNotifications } from "@/components/NotificationsContext";

function formatNotificationDate(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
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
        chipLabel: "Doğru",
      };
    case "prediction-wrong":
      return {
        icon: ShieldAlert,
        iconClass: "text-rose-300",
        chipClass: "border-rose-400/20 bg-rose-500/10 text-rose-200",
        chipLabel: "Hatalı",
      };
    case "favorite-start":
      return {
        icon: Clock3,
        iconClass: "text-amber-300",
        chipClass: "border-amber-400/20 bg-amber-500/10 text-amber-200",
        chipLabel: "Başladı",
      };
    case "favorite-result":
      return {
        icon: Star,
        iconClass: "text-sky-300",
        chipClass: "border-sky-400/20 bg-sky-500/10 text-sky-200",
        chipLabel: "Skor",
      };
    default:
      return {
        icon: Bell,
        iconClass: "text-blue-300",
        chipClass: "border-blue-400/20 bg-blue-500/10 text-blue-200",
        chipLabel: "Yeni",
      };
  }
}

export default function NotificationBell({ className = "" }) {
  const router = useRouter();
  const { notifications, unreadCount, markAllAsRead, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const recentNotifications = useMemo(() => notifications.slice(0, 6), [notifications]);

  function openDropdown() {
    setIsOpen(true);
    markAllAsRead();
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div
      className={`relative z-[70] hidden xl:block ${className}`}
      onMouseEnter={openDropdown}
      onMouseLeave={closeDropdown}
    >
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            closeDropdown();
            return;
          }
          openDropdown();
        }}
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-[#111827]/88 text-slate-300 shadow-[0_18px_40px_rgba(2,6,23,0.42)] backdrop-blur-xl transition-all hover:border-blue-500/30 hover:bg-[#172036]"
      >
        <Bell size={18} className={`${unreadCount > 0 ? "text-blue-300" : "text-slate-300"} transition-colors`} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[22px] items-center justify-center rounded-full border border-blue-300/20 bg-blue-500 px-1.5 py-0.5 text-[10px] font-black text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <div
        className={`absolute right-0 top-[calc(100%+6px)] w-[380px] overflow-hidden rounded-[28px] border border-slate-700/70 bg-[#0f172a]/96 shadow-[0_28px_80px_rgba(2,6,23,0.62)] backdrop-blur-xl transition-all duration-200 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-[''] ${
          isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
                Bildirim Merkezi
              </div>
              <h3 className="mt-1 text-lg font-black tracking-tight text-white">Son Bildirimler</h3>
            </div>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-200 transition-all hover:bg-blue-500/20"
            >
              Tümünü Gör
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto px-4 py-4">
          {recentNotifications.length > 0 ? (
            <div className="space-y-3">
              {recentNotifications.map((notification) => {
                const meta = getNotificationMeta(notification.type);
                const Icon = meta.icon;

                return (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (notification.matchId) {
                        router.push(`/matches/${notification.matchId}`);
                        closeDropdown();
                      } else {
                        router.push("/profile");
                        closeDropdown();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (notification.matchId) {
                          router.push(`/matches/${notification.matchId}`);
                          closeDropdown();
                        } else {
                          router.push("/profile");
                          closeDropdown();
                        }
                      }
                    }}
                    className={`group relative w-full overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all ${
                      notification.read
                        ? "border-slate-800 bg-white/[0.02] hover:border-slate-700 hover:bg-white/[0.04]"
                        : "border-blue-500/20 bg-blue-500/[0.06] hover:border-blue-400/30 hover:bg-blue-500/[0.08]"
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
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeNotification(notification.id);
                        }}
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
            <div className="rounded-[24px] border border-dashed border-slate-800 bg-white/[0.02] px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-[#111827]/80">
                <Bell size={18} className="text-slate-500" />
              </div>
              <p className="mt-4 text-base font-black text-white">Henüz bildirim yok</p>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-slate-500">
                Tahminlerin sonuçlanınca ve favori takımın maçı başlayınca burada görünecek.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800/80 bg-white/[0.02] px-5 py-3">
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
          >
            <CheckCheck size={14} />
            Tümünü Okundu Say
          </button>
        </div>
      </div>
    </div>
  );
}
