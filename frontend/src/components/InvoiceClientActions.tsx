"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { deleteDocumentAction } from "@/app/actions/documents";

interface InvoiceClientActionsProps {
  docId: string;
  fileUrl: string;
}

/**
 * 🛠️ Invoice Client Actions
 * Gestisce l'interattività (Cancellazione, Lightbox, Zoom) senza appesantire la pagina server.
 */
export default function InvoiceClientActions({ docId, fileUrl }: InvoiceClientActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteDocumentAction(docId);
      if (result.error) throw new Error(result.error);
      setIsModalOpen(false);
      router.push("/dashboard/documents");
    } catch (e) {
      alert("Errore durante la cancellazione.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* 🗑️ DELETE MODAL */}
      <DeleteConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Elimina Documento"
        message="Sei sicuro? Questa azione rimuoverà definitivamente la fattura dal vault di sicurezza."
        isLoading={isDeleting}
      />

      {/* 🔍 LIGHTBOX */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300 pointer-events-auto" 
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img 
              src={fileUrl} 
              alt="Scan Originale" 
              className="w-full h-auto object-contain p-4 max-h-[90vh]" 
            />
            <button className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/50 rounded-full p-1 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
      )}

      {/* 🏗️ BOTTONI DI AZIONE (Esportati per essere usati nel server) */}
      <div className="flex gap-4">
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors border border-red-500/20 px-4 py-2 rounded-lg bg-red-500/5"
        >
          Elimina Documento
        </button>
      </div>

      {/* Exponiamo la funzione d'apertura tramite un elemento invisibile o semplicemente passiamo l'evento */}
      <div id="trigger-zoom" className="hidden" onClick={() => setIsImageModalOpen(true)}></div>
    </>
  );
}
