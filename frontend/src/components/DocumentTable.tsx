"use client";

import Link from "next/link";
import SkeletonRow from "./SkeletonRow";

interface DocumentTableProps {
  documents: any[];
  isAdmin?: boolean;
  isLoading?: boolean;
}

export default function DocumentTable({ documents, isAdmin = false, isLoading = false }: DocumentTableProps) {
  if (!isLoading && (!documents || documents.length === 0)) {
    return (
      <div className="card-base p-16 text-center border-dashed border-white/10">
         <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/5">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
         </div>
         <h3 className="text-lg font-bold text-white mb-1">Nessuna Fattura</h3>
         <p className="text-slate-500 text-sm max-w-xs mx-auto">Non hai ancora elaborato alcun documento contabile.</p>
         {!isAdmin && (
           <Link href="/dashboard" className="btn-primary mt-6 inline-block">Carica Fattura</Link>
         )}
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PENDING':
      case 'PROCESSING':
        return { 
          color: 'bg-amber-500 shadow-amber-500/50', 
          text: 'In Elaborazione', 
          textColor: 'text-amber-400' 
        };
      case 'FAILED':
        return { 
          color: 'bg-red-500 shadow-red-500/50', 
          text: 'Errore OCR', 
          textColor: 'text-red-400' 
        };
      case 'COMPLETED':
        return { 
          color: 'bg-emerald-500 shadow-emerald-500/50', 
          text: 'Completato', 
          textColor: 'text-emerald-400' 
        };
      default:
        return { 
          color: 'bg-slate-500', 
          text: 'Sconosciuto', 
          textColor: 'text-slate-400' 
        };
    }
  };

  return (
    <div className="card-base overflow-hidden mb-12 border border-white/5">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Stato Elaborazione</th>
              <th className="px-6 py-4">Fornitore</th>
              <th className="px-6 py-4">Importo</th>
              <th className="px-6 py-4 text-center">Data Scansione</th>
              <th className="px-6 py-4 text-right">Azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} columns={5} />
               ))
            ) : (
               documents.map((doc: any) => {
               const kyc = doc.ocr_result?.extracted_data?.campi_strutturati || {};
               const config = getStatusConfig(doc.status);
               const isCompleted = doc.status === 'COMPLETED';
               
               return (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group/row">
                     {/* STATUS */}
                     <td className="px-6 py-4">
                     <div className="flex items-center">
                           <span className={`w-2 h-2 rounded-full mr-3 shadow-sm ${config.color}`}></span>
                           <span className={`text-[10px] font-bold uppercase tracking-tighter ${config.textColor}`}>
                              {config.text}
                           </span>
                     </div>
                     </td>

                     {/* FORNITORE */}
                     <td className="px-6 py-4">
                     <div className="font-semibold text-slate-100 text-sm truncate max-w-[200px]">
                           {isCompleted ? (kyc?.fornitore?.nome || "Sconosciuto") : "---"}
                     </div>
                     <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                           {isCompleted ? (kyc?.dati_fattura?.numero ? `Fatt. #${kyc.dati_fattura.numero}` : "Senza Numero") : "Fattura in estrazione"}
                     </div>
                     </td>

                     {/* IMPORTO */}
                     <td className="px-6 py-4">
                        {isCompleted ? (
                           <div className="flex items-baseline gap-1">
                              <span className="text-sm font-bold text-indigo-300 font-mono">
                                 {kyc?.totali?.totale_da_pagare?.toFixed(2) || "0.00"}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                 {kyc?.totali?.valuta || "EUR"}
                              </span>
                           </div>
                        ) : (
                           <div className="h-4 w-16 bg-slate-800/50 rounded animate-pulse"></div>
                        )}
                     </td>

                     {/* DATA SCANSIONE */}
                     <td className="px-6 py-4 text-center">
                     <div className="text-slate-200 text-xs font-medium">{new Date(doc.uploaded_at).toLocaleDateString('it-IT')}</div>
                     <div className="text-[10px] text-slate-500 mt-0.5">{new Date(doc.uploaded_at).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</div>
                     </td>

                     {/* AZIONE */}
                     <td className="px-6 py-4 text-right">
                        <Link 
                           href={`/dashboard/documents/${doc.id}`}
                           className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all px-3 py-1.5 rounded-md ${isAdmin ? 'text-amber-500 hover:bg-amber-500/10' : 'text-indigo-400 hover:bg-indigo-500/10'}`}
                        >
                           <span>{isAdmin ? "Ispeziona" : "Dettagli"}</span>
                           <svg className="w-3 h-3 group-hover/row:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                        </Link>
                     </td>
                  </tr>
               );
               })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
