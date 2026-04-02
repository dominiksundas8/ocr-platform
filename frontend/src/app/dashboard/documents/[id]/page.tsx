import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDocumentByIdAction } from "@/app/actions/documents";
import StatusRefresher from "@/components/StatusRefresher";
import InvoiceThumbnail from "@/components/InvoiceThumbnail";
import InvoiceClientActions from "@/components/InvoiceClientActions";
import Link from "next/link";
import { getPublicUrl } from "@/lib/url";

/**
 * 👑 Invoice Detail View (Server-First)
 * Rendering istantaneo dal server, polling rimosso e delegato al componente StatusRefresher.
 */
export default async function InvoiceDetailView({ 
  params: paramsPromise 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await paramsPromise;
  
  // ⚡ FETCH SERVER-SIDE
  const result = await getDocumentByIdAction(id);
  
  if (result.error || !result.data) {
    redirect("/dashboard/documents");
  }

  const doc = result.data;

  // 🛰️ URL NORMALIZATION (Using centralized utility)
  const fileUrl = getPublicUrl(doc.file);
  
  const kyc = doc.ocr_result?.extracted_data?.campi_strutturati || {};
  const righe = kyc?.righe || [];
  const isProcessing = doc.status === 'PENDING' || doc.status === 'PROCESSING';

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      
      {/* 🧩 MONITORAGGIO STATO */}
      {isProcessing && <StatusRefresher docId={doc.id} />}

      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/documents" className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border 
                ${isProcessing ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                  doc.status === 'FAILED' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                {isProcessing ? "IN ELABORAZIONE" : doc.status === 'FAILED' ? "ERRORE" : (kyc?.document_type || "FATTURA")}
              </span>
              <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">ID #{doc.id}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Scheda <span className="text-indigo-400">Contabile</span></h1>
          </div>
        </div>

        {/* 🛠️ AZIONI CLIENT */}
        <InvoiceClientActions docId={doc.id} fileUrl={fileUrl} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* DATA SECTION */}
        <div className="lg:col-span-8 space-y-6">
          
          {isProcessing ? (
            <div className="card-base p-16 flex flex-col items-center justify-center text-center">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-6 relative">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Estrazione OCR in corso...</h3>
              <p className="text-slate-400 text-sm max-w-sm">Il motore AI sta analizzando la fattura ed estraendo i totali e le righe. Questa operazione richiede qualche secondo.</p>
            </div>
          ) : doc.status === 'FAILED' ? (
            <div className="card-base p-8 border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4 border border-red-500/30 text-red-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h3 className="text-red-400 font-bold text-lg mb-2">Fallimento OCR</h3>
              <p className="text-slate-300 text-sm">{doc.error_message}</p>
            </div>
          ) : (
            <>
              {/* TABELLA DATI FORNITORE */}
              <div className="card-base p-6">
                 <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center mr-4 border border-indigo-500/20 text-indigo-400">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest opacity-80">Dati Fornitore</h2>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {[
                       { label: "Ragione Sociale", value: kyc?.fornitore?.nome },
                       { label: "P. IVA / C.F.", value: kyc?.fornitore?.piva, mono: true, color: "text-indigo-400" },
                       { label: "Indirizzo", value: kyc?.fornitore?.indirizzo, span: 2 },
                       { label: "Numero Documento", value: kyc?.dati_fattura?.numero, mono: true },
                       { label: "Data Emissione", value: kyc?.dati_fattura?.data, mono: true, color: "text-slate-200" },
                    ].map((field, idx) => (
                       <div key={idx} className={`${field.span === 2 ? 'md:col-span-2' : ''} border-b border-white/5 pb-4 last:border-0`}>
                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">{field.label}</p>
                          <p className={`text-sm font-bold tracking-tight uppercase ${field.color || 'text-slate-100'} ${field.mono ? 'font-mono' : ''}`}>
                             {field.value || "---"}
                          </p>
                       </div>
                    ))}
                 </div>
              </div>

              {/* RIEPILOGO IMPORTI */}
              <div className="card-base p-6">
                 <div className="flex items-center mb-6 justify-between">
                    <div className="flex items-center">
                       <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center mr-4 border border-emerald-500/20 text-emerald-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       </div>
                       <h2 className="text-sm font-bold text-white uppercase tracking-widest opacity-80">Riepilogo Importi</h2>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kyc?.totali?.valuta || "EUR"}</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-center">
                       <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Imponibile</p>
                       <p className="text-xl font-bold font-mono text-slate-200">{kyc?.totali?.imponibile?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-center">
                       <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Imposte</p>
                       <p className="text-xl font-bold font-mono text-slate-200">{kyc?.totali?.tasse?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 text-center shadow-inner shadow-indigo-500/10">
                       <p className="text-[9px] text-indigo-300 uppercase font-black tracking-widest mb-1">Totale Documento</p>
                       <p className="text-2xl font-bold font-mono text-indigo-400">{kyc?.totali?.totale_da_pagare?.toFixed(2) || "0.00"}</p>
                    </div>
                 </div>
              </div>

              {/* RIGHE FATTURA */}
              {righe.length > 0 && (
                 <div className="card-base overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-slate-900/30">
                       <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dettaglio Righe ({righe.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left text-sm text-slate-300">
                          <thead className="text-[9px] uppercase tracking-widest text-slate-500 bg-slate-900/50 border-b border-white/10">
                             <tr>
                                <th className="px-4 py-3 font-bold">Descrizione</th>
                                <th className="px-4 py-3 font-bold text-right">Q.tà</th>
                                <th className="px-4 py-3 font-bold text-right">P. Unitario</th>
                                <th className="px-4 py-3 font-bold text-right">P. Totale</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono text-xs">
                             {righe.map((riga: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                   <td className="px-4 py-3 font-sans font-medium text-slate-200" title={riga.descrizione}>{riga.descrizione}</td>
                                   <td className="px-4 py-3 text-right text-slate-400">{riga.quantita}</td>
                                   <td className="px-4 py-3 text-right text-slate-400">{riga.prezzo_unitario?.toFixed(2)}</td>
                                   <td className="px-4 py-3 text-right text-indigo-300 font-bold">{riga.prezzo_totale?.toFixed(2)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}
            </>
          )}
        </div>

        {/* SIDEBAR PREVIEW */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-base p-4 sticky top-6">
            <InvoiceThumbnail fileUrl={fileUrl} />

            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center block !py-3 !text-[11px]">
               Scarica Documento
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
