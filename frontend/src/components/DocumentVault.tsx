import { Suspense } from "react";
import StatusFilterBar from "./StatusFilterBar";
import DocumentListTable from "./DocumentListTable";
import TableSkeleton from "./TableSkeleton";

interface DocumentVaultProps {
  token: string | undefined;
  status: string;
  page?: string;
  targetUserId?: string;
  mode: 'USER' | 'ADMIN';
}

/**
 * 🏰 Master Orchestrator: DocumentVault
 * Centralizza Header, Filtri e Tabella in un unico flusso Server-First.
 */
export default function DocumentVault({
  token,
  status,
  page,
  targetUserId,
  mode
}: DocumentVaultProps) {

  const isUserMode = mode === 'USER';

  // Configurazione Dinamica basata sulla modalità
  const config = {
    badgeText: isUserMode ? "Documenti Personali" : "Controllo Admin",
    badgeColor: isUserMode ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20",
    title: isUserMode ? "Archivio" : "Vault",
    highlightText: isUserMode ? "Documenti" : "Utente",
    highlightColor: isUserMode ? "text-indigo-400" : "text-rose-400",
    showSubtitle: !isUserMode,
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* 🏗️ HEADER UNIFICATO */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${config.badgeColor}`}>
              {config.badgeText}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {config.title} <span className={config.highlightColor}>{config.highlightText}</span>
          </h1>
          {config.showSubtitle && targetUserId && (
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-tight">Target: {targetUserId}</p>
          )}
        </div>
      </div>

      {/* 🎨 SENIOR FILTER BAR (Sincronizzata su entrambi i lati) */}
      <StatusFilterBar currentFilter={status} />

      {/* 🌊 STREAMING UI (Suspense con Key Dinamica per resettare lo stato al cambio filtri) */}
      <Suspense
        key={`${status}-${page}-${targetUserId}`}
        fallback={
          <TableSkeleton
            columns={5}
            rows={8}
            columnNames={["Stato Elaborazione", "Fornitore", "Importo", "Data Scansione", "Azione"]}
          />
        }
      >
        <DocumentListTable
          token={token}
          status={status}
          page={page}
          targetUserId={targetUserId}
        />
      </Suspense>
    </div>
  );
}
