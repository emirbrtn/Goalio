"use client";
import { useState, useEffect } from "react";
import { Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation"; // 🔥 NEXT.JS'İN KENDİ YÖNLENDİRİCİSİ EKLENDİ

export default function Topbar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter(); // 🔥 ROUTER TANIMLANDI

  useEffect(() => {
    const stored = localStorage.getItem("goalio_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();

    // 1. Verileri temizle (Senin tespit ettiğin gibi bu zaten çalışıyordu)
    localStorage.removeItem("goalio_token");
    localStorage.removeItem("goalio_user");
    sessionStorage.clear();

    // 2. KESİN ÇÖZÜM: Next.js'in kendi yönlendiricisi ile zorla sayfayı değiştir ve yenile
    router.push("/login");
    router.refresh(); 
  };

  return (
    <div className="flex items-center justify-between p-6 bg-[#0f172a] border-b border-slate-800 relative z-[9999]">
      <div className="flex-1 max-w-xl">
        <form onSubmit={(e) => { e.preventDefault(); onSearch?.(query); }} className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 text-white" 
            placeholder="Takım, lig veya maç ara..." 
          />
        </form>
      </div>
      
      <div className="flex items-center gap-4 ml-6">
        <span className="text-xs font-bold text-slate-400 italic">
          Merhaba, <span className="text-white">{user?.username || 'Misafir'}</span>
        </span>
        
        <button 
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/20 cursor-pointer active:scale-95"
        >
          <LogOut size={16} /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}