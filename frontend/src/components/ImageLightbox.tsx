"use client";

interface ImageLightboxProps {
  fileUrl: string;
  onClose: () => void;
}

/**
 * 🔍 Image Lightbox
 * Componente per l'ingrandimento delle scansioni originali.
 */
export default function ImageLightbox({ fileUrl, onClose }: ImageLightboxProps) {
  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300 pointer-events-auto" 
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>
      <div 
        className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Impedisce la chiusura cliccando sull'immagine
      >
        <img 
          src={fileUrl} 
          alt="Master Scan" 
          className="w-full h-auto object-contain p-4 max-h-[90vh]" 
        />
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/50 rounded-full p-1 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
}
