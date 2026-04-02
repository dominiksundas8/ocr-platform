"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

interface PaginationControlsProps {
  hasNext: boolean;
  hasPrevious: boolean;
  nextUrl: string | null;
  previousUrl: string | null;
  status: string;
}

export default function PaginationControls({ 
  hasNext, 
  hasPrevious, 
  nextUrl, 
  previousUrl, 
  status 
}: PaginationControlsProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname(); // 🏗️ Otteniamo il percorso corrente (es: /dashboard/admin/users/UUID/documents)
  
  // Funzione per estrarre il parametro 'page' dalla URL completa restituita da Django
  const getPageFromUrl = (url: string | null) => {
    if (!url) return null;
    const urlObj = new URL(url, "http://dummy.com");
    return urlObj.searchParams.get("page");
  };

  const nextPage = getPageFromUrl(nextUrl);
  const prevPage = getPageFromUrl(previousUrl);

  const buildUrl = (pageNumber: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNumber) {
      params.set("page", pageNumber);
    } else {
      params.delete("page");
    }
    // Sincronizziamo lo status
    if (status && status !== 'ALL') {
      params.set("status", status);
    }
    // 🚀 Usiamo pathname invece di hardcode /dashboard/documents
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between mt-6">
      {hasPrevious ? (
        <Link 
          href={buildUrl(prevPage)}
          className="btn-secondary !py-1.5 !px-4 !text-[11px] transition-all hover:scale-105 active:scale-95"
        >
          Indietro
        </Link>
      ) : (
        <div />
      )}

      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
        Analisi Sequenziale
      </div>

      {hasNext ? (
        <Link 
          href={buildUrl(nextPage)}
          className="btn-primary !py-1.5 !px-4 !text-[11px] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          Avanti
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
