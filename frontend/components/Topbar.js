"use client";

import { useEffect, useState } from "react";
import { Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { performLogout } from "@/lib/logout";

export default function Topbar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("goalio_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = async (event) => {
    event.preventDefault();
    await performLogout();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative z-[9999] flex items-center justify-between border-b border-slate-800 bg-[#0f172a] p-6">
      <div className="max-w-xl flex-1">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearch?.(query);
          }}
          className="group relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-12 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="Takim, lig veya mac ara..."
          />
        </form>
      </div>

      <div className="ml-6 flex items-center gap-4">
        <span className="text-xs font-bold italic text-slate-400">
          Merhaba, <span className="text-white">{user?.username || "Misafir"}</span>
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="active:scale-95 flex cursor-pointer items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-xs font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white"
        >
          <LogOut size={16} /> Cikis Yap
        </button>
      </div>
    </div>
  );
}
