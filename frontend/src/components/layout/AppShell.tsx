'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { token, loading } = useAuth();

  // Pages that should NOT have the sidebars/navbars (Auth pages & Landing)
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/';
  
  // If we're on an auth page or not logged in yet (and it's not the landing page)
  // we just show the content
  if (isAuthPage || (!token && !loading)) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
