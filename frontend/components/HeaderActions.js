"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";

export default function HeaderActions({ inline = false, docked = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      try {
        const raw = localStorage.getItem("goalio_user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch (error) {
        setUser(null);
      }
    };

    syncUser();

    const handleStorage = (event) => {
      if (!event.key || event.key === "goalio_user" || event.key === "goalio_token") {
        syncUser();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncUser();
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Cikis yapmak istedigine emin misin?");
    if (!confirmed) return;

    localStorage.removeItem("goalio_token");
    localStorage.removeItem("goalio_user");
    sessionStorage.clear();
    router.push("/login");
    router.refresh();
  };

  const wrapperClass = inline
    ? "flex shrink-0 items-center gap-2 border-t border-slate-700/50 pt-3 sm:border-t-0 sm:pt-0 lg:ml-4 lg:border-l lg:pl-5"
    : docked
      ? "flex items-center gap-4"
      : "fixed right-8 top-6 z-[90] flex items-center gap-4 rounded-[24px] border border-slate-700/60 bg-[#0f172a]/88 px-4 py-2 shadow-[0_18px_50px_rgba(2,6,23,0.36)] backdrop-blur-xl";

  return (
    <div className={wrapperClass}>
      {user ? (
        <>
          <NotificationBell />
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex min-w-0 shrink items-center gap-2 rounded-2xl border border-slate-700/50 bg-[#111827]/60 px-3 py-2 transition-all hover:border-blue-500/40 hover:bg-[#111827]"
          >
            <UserAvatar avatarId={user.avatarId} size="sm" />
            <div className="hidden min-w-0 text-right md:block">
              <p className="whitespace-nowrap text-[9px] font-black uppercase leading-none italic text-slate-500">Hesabim</p>
              <p className="whitespace-nowrap text-xs font-black tracking-tight text-white">{user.username}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-500 transition-all hover:bg-red-500 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="rounded-2xl bg-gradient-to-r from-blue-600/80 to-indigo-600/80 px-6 py-3 text-xs font-black uppercase tracking-widest text-white backdrop-blur-sm"
        >
          Giris Yap
        </button>
      )}
    </div>
  );
}
