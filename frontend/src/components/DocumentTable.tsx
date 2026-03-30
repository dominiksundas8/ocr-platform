"use client";

import Link from "next/link";

interface DocumentTableProps {
  documents: any[];
  isAdmin?: boolean;
}

export default function DocumentTable({ documents, isAdmin = false }: DocumentTableProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="card-base p-16 text-center border-dashed">
         <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/5">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
         </div>
         <h3 className="text-lg font-bold text-white mb-1">Archivio Vuoto</h3>
         <p className="text-slate-500 text-sm max-w-xs mx-auto">Nessun documento rilevato in questo settore.</p>
         {!isAdmin && (
           <Link href="/dashboard" className="btn-primary mt-6">Carica Documento</Link>
         )}
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden mb-12">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Documento</th>
              <th className="px-6 py-4">Intestatario</th>
              <th className="px-6 py-4 text-center">Scansione</th>
              <th className="px-6 py-4 text-right">Azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {documents.map((doc: any) => {
              const kyc = doc.ocr_result?.extracted_data?.campi_strutturati;
              const isLicense = kyc?.document_type?.toLowerCase().includes("patente");
              const isExpired = kyc?.scadenza && new Date(kyc.scadenza) < new Date();
              
              return (
                <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group/row">
                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                       <span className={`w-2 h-2 rounded-full mr-2 ${isExpired ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'}`}></span>
                       <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                          {isExpired ? "Scaduto" : "Analizzato"}
                       </span>
                    </div>
                  </td>

                  {/* DOCUMENTO & PREVIEW */}
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-7 bg-slate-950 rounded border border-white/10 overflow-hidden flex-shrink-0 group-hover/row:border-indigo-500/50 transition-all">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={doc.file} alt="Preview" className="w-full h-full object-cover opacity-50 group-hover/row:opacity-100" />
                        </div>
                        <div>
                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isLicense ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                              {kyc?.document_type || "GENERIC"}
                           </span>
                        </div>
                     </div>
                  </td>

                  {/* IDENTITA */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-100 text-sm truncate max-w-[150px]">
                       {kyc?.persona_nome} {kyc?.persona_cognome || "N/D"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                       #{kyc?.documento_numero || "Senza Numero"}
                    </div>
                  </td>

                  {/* DATA */}
                  <td className="px-6 py-4 text-center">
                    <div className="text-slate-200 text-xs font-medium">{new Date(doc.uploaded_at).toLocaleDateString('it-IT')}</div>
                    <div className="text-[10px] text-slate-500">{new Date(doc.uploaded_at).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</div>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
