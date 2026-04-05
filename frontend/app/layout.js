'use client';

import './globals.css';
import Sidebar from '@/components/Sidebar';
import { NotificationsProvider } from '@/components/NotificationsContext';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <html lang="tr">
      <body className="flex h-screen overflow-hidden bg-[#0f172a] font-sans text-slate-300">
        <NotificationsProvider disabled={isAuthPage}>
          {!isAuthPage && <Sidebar />}

          <main className={`flex h-full flex-1 flex-col overflow-hidden ${isAuthPage ? 'w-full' : ''}`}>
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </main>
        </NotificationsProvider>
      </body>
    </html>
  );
}
