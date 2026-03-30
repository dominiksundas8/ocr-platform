"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Forza la chiusura del drawer su mobile al cambio rotta
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans relative selection:bg-indigo-500/30">

        {/* MOBILE TOP BAR (Visibile solo < 768px) */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900/80 border-b border-white/5 flex items-center justify-between px-6 z-30 backdrop-blur-xl">
          <div className="flex items-center">
            <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center mr-3 shadow-lg shadow-indigo-600/20">
              <span className="text-white font-bold text-[10px]">DE</span>
            </div>
            <h1 className="text-base font-bold tracking-tight">Card<span className="text-indigo-400">Scanner</span></h1>
          </div>

          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white transition-colors">
            {isSidebarOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            )}
          </button>
        </header>

        {/* SIDEBAR LATERALE (FISSA SU DESKTOP) */}
        <aside
          className={`
            fixed inset-y-0 left-0 w-64 bg-slate-900/40 border-r border-white/5 flex flex-col z-50 transition-all duration-300 ease-in-out backdrop-blur-md
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* LOGO AREA */}
          <div className="p-6 pb-4 flex-shrink-0">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white ml-3">
                Deep<span className="text-indigo-400">Ex</span>
              </h1>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-3 border border-white/5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Account</p>
              <p className="text-xs text-slate-300 truncate font-semibold">{session.user?.email}</p>
            </div>
          </div>

          {/* NAVIGAZIONE */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3 mt-4">Workspace</p>

            <Link href="/dashboard" className={`group flex items-center px-3 py-2 rounded-lg transition-all font-semibold text-sm ${pathname === '/dashboard' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>
              <svg className="w-4 h-4 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              Carica File
            </Link>

            <Link href="/dashboard/documents" className={`group flex items-center px-3 py-2 rounded-lg transition-all font-semibold text-sm ${pathname.includes('/documents') && !pathname.includes('/admin') ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>
              <svg className="w-4 h-4 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Documenti
            </Link>

            {(session.user as any)?.isStaff && (
              <>
                <p className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest mt-8 mb-3 px-3">Administration</p>
                <Link href="/dashboard/admin" className={`group flex items-center px-3 py-2 rounded-lg transition-all font-semibold text-sm ${pathname.includes('/admin') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white'}`}>
                  <svg className="w-4 h-4 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Utenti
                </Link>
              </>
            )}
          </nav>

          {/* LOGOUT AREA */}
          <div className="p-4 border-t border-white/5 flex-shrink-0 mt-auto">
            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full btn-danger !py-1.5 justify-start px-3">
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span className="text-xs uppercase font-bold tracking-tighter">Esci dal Sistema</span>
            </button>
          </div>
        </aside>

        {/* CONTENUTO PRINCIPALE */}
        <main className="flex-1 md:ml-64 overflow-auto bg-slate-950 pt-14 md:pt-0">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>

        {/* OVERLAY MOBILE */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)} />
        )}
      </div>
    );
  }

  return null;
}
