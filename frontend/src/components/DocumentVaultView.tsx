"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DocumentTable from "./DocumentTable";
import { api } from "@/lib/api";

interface DocumentVaultViewProps {
   userId?: string;
   isAdminView?: boolean;
}

export default function DocumentVaultView({ userId, isAdminView = false }: DocumentVaultViewProps) {
   const { data: session } = useSession();

   const [dataPayload, setDataPayload] = useState<{ count: number, next: string | null, previous: string | null, results: any[] }>({ count: 0, next: null, previous: null, results: [] });
   const [loading, setLoading] = useState(true);
   const [pageUrl, setPageUrl] = useState<string | undefined>(undefined);

   useEffect(() => {
      const token = session?.accessToken;
      if (token) {
         setLoading(true);

         const fetchPromise = isAdminView && userId
            ? api.documents.getAdminDocuments(token, userId)
            : api.documents.getAll(token, pageUrl);

         fetchPromise
            .then(data => {
               setDataPayload(data);
               setLoading(false);
            })
            .catch(e => {
               console.error("Vault Fetch Error:", e);
               setLoading(false);
            });
      }
   }, [session, pageUrl, isAdminView, userId]);

   if (loading && dataPayload.results.length === 0) return (
      <div className="py-20 flex flex-col items-center justify-center">
         <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
         <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            Analisi Archivio in corso...
         </div>
      </div>
   );

   return (
      <div className="animate-in fade-in duration-500">

         {/* HEADER COMPATTO */}
         <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${isAdminView ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                     {isAdminView ? "Documenti" : "Documenti Personali"}
                  </span>
               </div>
               <h1 className="text-2xl font-bold text-white tracking-tight">
                  Archivio <span className={isAdminView ? "text-amber-500" : "text-indigo-400"}>{isAdminView ? "Ispezionato" : "Documenti"}</span>
               </h1>
               <p className="text-slate-500 text-xs mt-1">
                  {isAdminView
                     ? "Monitoraggio e conformità dei documenti caricati dall'utente selezionato."
                     : "Scansioni effettuate."
                  }
               </p>
            </div>

            <div className="card-base px-6 py-3 flex items-baseline gap-2">
               <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none">Totale:</span>
               <span className="text-2xl font-bold text-white leading-none">{dataPayload.count}</span>
            </div>
         </div>

         {/* TABELLA */}
         <DocumentTable documents={dataPayload.results} isAdmin={isAdminView} />

         {/* PAGINAZIONE RAFFINATA */}
         {dataPayload.count > 0 && (
            <div className="flex items-center justify-between mt-6">
               <button
                  onClick={() => dataPayload.previous && setPageUrl(dataPayload.previous)}
                  disabled={!dataPayload.previous}
                  className="btn-secondary !py-1.5 !px-4 !text-[11px]"
               >
                  Indietro
               </button>
               <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                  Segmento {pageUrl ? "corrente" : "iniziale"}
               </div>
               <button
                  onClick={() => dataPayload.next && setPageUrl(dataPayload.next)}
                  disabled={!dataPayload.next}
                  className={`${isAdminView ? 'btn-admin' : 'btn-primary'} !py-1.5 !px-4 !text-[11px]`}
               >
                  Avanti
               </button>
            </div>
         )}
      </div>
   )
}
