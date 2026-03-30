"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { api } from "@/lib/api";

export default function IdentityDetailView({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
   const params = use(paramsPromise);
   const { data: session } = useSession();
   const router = useRouter();
   const [doc, setDoc] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [isDeleting, setIsDeleting] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isImageModalOpen, setIsImageModalOpen] = useState(false);

   const cleanUrl = (url: string) => {
      if (!url) return "";
      if (url.startsWith("http")) return url;
      return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
   };

   useEffect(() => {
      const token = (session as any)?.accessToken;
      if (token && params.id) {
         setLoading(true);
         api.documents.getById(params.id, token)
            .then(data => {
               setDoc(data);
               setLoading(false);
            })
            .catch(e => {
               console.error("Detail Fetch Error:", e);
               router.push("/dashboard/documents");
            });
      }
   }, [session, params.id, router]);

   const handleDelete = async () => {
      const token = (session as any)?.accessToken;
      if (!token) return;

      setIsDeleting(true);
      try {
         await api.documents.delete(params.id, token);
         setIsModalOpen(false);
         router.push("/dashboard/documents");
      } catch (e) {
         alert("Errore cancellazione");
         setIsDeleting(false);
      }
   };

   if (loading || !doc) return (
      <div className="py-20 flex flex-col items-center justify-center">
         <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
         <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Accessing Vault Record...</div>
      </div>
   );

   const kyc = doc.ocr_result?.extracted_data?.campi_strutturati;
   const isLicense = kyc?.document_type?.toLowerCase().includes('patente');

   return (
      <div className="animate-in fade-in duration-500 pb-10">

         <DeleteConfirmModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleDelete}
            title="Elimina Documento"
            message="Questa azione rimuoverà definitivamente l'identità dal vault di sicurezza."
            isLoading={isDeleting}
         />

         {/* LIGHTBOX */}
         {isImageModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setIsImageModalOpen(false)}>
               <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>
               <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <img src={cleanUrl(doc.file)} alt="Master Scan" className="w-full h-auto object-contain p-4" />
                  <button className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
               </div>
            </div>
         )}

         {/* HEADER */}
         <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
               <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
               </button>
               <div>
                  <div className="flex items-center gap-2 mb-0.5">
                     <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${isLicense ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                        {kyc?.document_type || "RECORD"}
                     </span>
                     <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">ID #{doc.id}</span>
                  </div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Scheda <span className="text-indigo-400">Identità</span></h1>
               </div>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors border border-red-500/20 px-4 py-2 rounded-lg bg-red-500/5">
               Elimina Documento
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* DATA SECTION */}
            <div className="lg:col-span-8 space-y-6">
               <div className="card-base p-6">
                  <div className="flex items-center mb-6">
                     <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center mr-4 border border-indigo-500/20 text-indigo-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                     </div>
                     <h2 className="text-sm font-bold text-white uppercase tracking-widest opacity-80">Dati Estratti Verificati</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                     {[
                        { label: "Cognome", value: kyc?.persona_cognome },
                        { label: "Nome", value: kyc?.persona_nome },
                        { label: "Numero Documento", value: kyc?.documento_numero, mono: true, color: "text-indigo-400" },
                        { label: "Data di Nascita", value: kyc?.data_nascita, mono: true },
                        { label: "Luogo di Nascita", value: kyc?.luogo_nascita },
                        { label: "Genere", value: kyc?.sesso },
                        { label: "Ente Rilascio", value: kyc?.rilasciato_da, span: 2 },
                        { label: "Data Scadenza", value: kyc?.scadenza, mono: true, color: "text-red-400" },
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

            </div>

            {/* SIDEBAR PREVIEW */}
            <div className="lg:col-span-4 space-y-6">
               <div className="card-base p-4 sticky top-6">
                  <div onClick={() => setIsImageModalOpen(true)} className="w-full aspect-[1.3/1] bg-slate-950 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden mb-4 group cursor-zoom-in relative">
                     <img src={cleanUrl(doc.file)} alt="Scan" className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100" />
                     <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white bg-slate-900/80 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">Ingrandisci</span>
                     </div>
                  </div>

                  <a href={cleanUrl(doc.file)} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center block !py-3 !text-[11px]">
                     Scarica Documento
                  </a>
               </div>
            </div>

         </div>
      </div>
   )
}
