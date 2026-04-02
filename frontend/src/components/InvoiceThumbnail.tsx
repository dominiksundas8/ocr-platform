"use client";

import { useState } from "react";
import ImageLightbox from "./ImageLightbox";
import { isPdf } from "@/lib/url";

interface InvoiceThumbnailProps {
  fileUrl: string;
}

/**
 * 🖼️ Invoice Thumbnail (Enhanced)
 * Distingue tra immagini e PDF, mostrando un'icona professionale per i documenti non visualizzabili.
 */
export default function InvoiceThumbnail({ fileUrl }: InvoiceThumbnailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pdfMode = isPdf(fileUrl);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)} 
        className="w-full aspect-[1/1.4] bg-slate-950 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden mb-4 group cursor-zoom-in relative shadow-inner"
      >
        {pdfMode ? (
          /* 📄 PDF PLACEHOLDER */
          <div className="flex flex-col items-center justify-center p-6 text-center group-hover:scale-105 transition-transform duration-500">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20 text-red-500 shadow-lg shadow-red-500/5">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Documento PDF</span>
            <p className="text-[9px] text-slate-600 mt-1">Clicca per anteprima</p>
          </div>
        ) : (
          /* 📸 IMAGE PREVIEW */
          <>
            <img 
              src={fileUrl} 
              alt="Scan Preview" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </>
        )}

        {/* OVERLAY HOVER */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
            {pdfMode ? "Apri Documento" : "Ingrandisci Originale"}
          </span>
        </div>
      </div>

      {isOpen && (
        <ImageLightbox 
          fileUrl={fileUrl} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
