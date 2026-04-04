'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  BrainCircuit,
  ListCheck,
  Radio,
  Star,
  History,
  User,
  Trophy,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { leagueList } from '@/lib/leagueConfig';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      try {
        const raw = localStorage.getItem('goalio_user');
        setUser(raw ? JSON.parse(raw) : null);
      } catch (error) {
        setUser(null);
      }
    };

    syncUser();

    const handleStorage = (event) => {
      if (!event.key || event.key === 'goalio_user' || event.key === 'goalio_token') {
        syncUser();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncUser();
      }
    };

    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isMenuItemActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Cikis yapmak istedigine emin misin?');
    if (!confirmed) return;

    localStorage.removeItem('goalio_token');
    localStorage.removeItem('goalio_user');
    sessionStorage.clear();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { name: 'Ana Sayfa', href: '/', icon: Home },
    { name: 'Canli Sonuclar', href: '/live-scores', icon: Radio, accent: 'red' },
    { name: 'Gecmis Maclar', href: '/history', icon: History },
    { name: 'AI Tahmin', href: '/predictions', icon: BrainCircuit },
    { name: 'Tahminlerim', href: '/my-predictions', icon: ListCheck },
    { name: 'Favoriler', href: '/favorites', icon: Star },
    { name: 'Profil', href: '/profile', icon: User },
  ];

  const leagueItems = leagueList.map((league) => ({
    id: league.key,
    name: league.title,
    href: `/leagues/${league.key}/teams`,
    overviewHref: `/leagues/${league.key}`,
  }));

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-[110] flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/70 bg-[#0f172a]/90 text-slate-200 shadow-[0_18px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl transition-all hover:border-blue-500/40 hover:text-white lg:hidden"
        aria-label="Menüyü Aç"
      >
        <Menu size={18} />
      </button>

      <div
        className={`fixed inset-0 z-[99] bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`custom-scrollbar fixed inset-y-0 left-0 z-[100] flex w-[280px] max-w-[85vw] flex-col overflow-y-auto border-r border-slate-700/50 bg-[#1e293b]/95 shadow-[0_28px_80px_rgba(2,6,23,0.6)] backdrop-blur-md transition-transform duration-300 lg:static lg:z-auto lg:h-full lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="flex shrink-0 items-start justify-between gap-4 p-6">
        <Link href="/" className="inline-block">
          <h1 className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-4xl font-black text-transparent drop-shadow-[0_0_10px_rgba(96,165,250,0.2)] transition-all duration-300 hover:scale-105">
            GOALIO
          </h1>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-[#111827]/70 text-slate-300 transition-colors hover:border-blue-500/40 hover:text-white lg:hidden"
          aria-label="Menüyü Kapat"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-6">
        <p className="text-xs font-medium tracking-tight text-slate-400">Canli skor ve yapay zeka tahminleri</p>
      </div>

      <nav className="space-y-1 px-4">
        <div className="mb-2 px-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Menu</span>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isMenuItemActive(item.href);
          const isLiveSection = item.accent === 'red';
          const activeClass = isLiveSection
            ? 'border-l-4 border-red-500 bg-red-600/10 text-red-400 shadow-lg shadow-red-500/5'
            : 'border-l-4 border-blue-500 bg-blue-600/10 text-blue-400 shadow-lg shadow-blue-500/5';
          const idleClass = isLiveSection
            ? 'text-slate-400 hover:bg-red-600/10 hover:text-white'
            : 'text-slate-400 hover:bg-blue-600/10 hover:text-white hover:shadow-lg hover:shadow-blue-500/5';
          const iconClass = isActive
            ? isLiveSection
              ? 'text-red-400'
              : 'text-blue-400'
            : isLiveSection
              ? 'transition-colors group-hover:text-red-400'
              : 'transition-colors group-hover:text-blue-400';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                isActive ? activeClass : idleClass
              }`}
            >
              <Icon size={18} className={iconClass} />
              <span className="text-sm font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 px-4 pb-10">
        <div className="mb-4 flex items-center justify-between px-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Populer Ligler</span>
          <Trophy size={14} className="text-yellow-500/50" />
        </div>

        <div className="space-y-1">
          {leagueItems.map((league) => {
            const isActive =
              pathname === league.href ||
              pathname === league.overviewHref ||
              pathname.startsWith(`${league.href}/`) ||
              pathname.startsWith(`${league.overviewHref}/`);

            return (
              <Link
                key={league.id}
                href={league.href}
                className={`group flex items-center justify-between rounded-xl px-4 py-2.5 transition-all duration-200 ${
                  isActive
                    ? 'border-l-4 border-purple-500 bg-purple-600/10 text-purple-400'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      isActive ? 'bg-purple-400' : 'bg-slate-700 group-hover:bg-purple-500'
                    }`}
                  />
                  <span className="truncate text-[13px] font-medium">{league.name}</span>
                </div>
                <ChevronRight
                  size={14}
                  className={`shrink-0 transform transition-all group-hover:translate-x-1 group-hover:opacity-100 ${
                    isActive ? 'text-purple-400 opacity-100' : 'opacity-0'
                  }`}
                />
              </Link>
            );
          })}

          <Link
            href="/leagues"
            className="mt-2 flex items-center gap-3 border-t border-slate-800/50 px-4 py-3 text-slate-500 transition-colors hover:text-blue-400"
          >
            <LayoutGrid size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Tum Ligleri Gor</span>
          </Link>
        </div>
      </div>

      {user ? (
        <div className="mt-auto px-4 pb-6">
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cikis Yap"
            title="Cikis Yap"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/15 bg-red-500/5 text-slate-400 transition-all duration-200 hover:bg-red-600/10 hover:text-red-300"
          >
            <LogOut size={13} className="text-red-400/80" />
          </button>
        </div>
      ) : null}
      </aside>
    </>
  );
}
