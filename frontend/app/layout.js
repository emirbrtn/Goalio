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
      <body className="min-h-screen bg-[#0f172a] font-sans text-slate-300 lg:flex lg:h-screen lg:overflow-hidden">
        <NotificationsProvider disabled={isAuthPage}>
          {!isAuthPage && <Sidebar />}

          <main className={`flex min-w-0 flex-1 flex-col ${isAuthPage ? 'w-full' : ''} lg:overflow-hidden`}>
            <div className="flex-1 overflow-x-hidden lg:min-h-0 lg:overflow-y-auto">
              {children}
            </div>
          </main>
        </NotificationsProvider>
      </body>
    </html>
  );
}
