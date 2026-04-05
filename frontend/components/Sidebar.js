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
} from 'lucide-react';
import { leagueList } from '@/lib/leagueConfig';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

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
    <aside className="custom-scrollbar flex h-full w-64 flex-col overflow-y-auto border-r border-slate-700/50 bg-[#1e293b]/80 backdrop-blur-md">
      <div className="shrink-0 p-6">
        <Link href="/" className="inline-block">
          <h1 className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-4xl font-black text-transparent drop-shadow-[0_0_10px_rgba(96,165,250,0.2)] transition-all duration-300 hover:scale-105">
            GOALIO
          </h1>
        </Link>
        <p className="mt-2 text-xs font-medium tracking-tight text-slate-400">Canli skor ve yapay zeka tahminleri</p>
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
  );
}
