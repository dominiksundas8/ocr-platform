"use client";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message, isLoading }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* OVERLAY */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" 
        onClick={!isLoading ? onClose : undefined}
      ></div>

      {/* BOX MODALE */}
      <div className="relative card-base w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-400">
        
        {/* INDICATORE DI PERICOLO SOTTILE */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500/50"></div>
        
        <div className="p-6 text-center">
            {/* ICONA AVVISO */}
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-500/20 text-red-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 px-2">
              {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={onClose}
                  disabled={isLoading}
                  className="btn-secondary flex-1 !py-2.5"
                >
                  Annulla
                </button>
                <button 
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="btn-danger flex-1 !py-2.5 flex items-center justify-center"
                >
                   {isLoading ? (
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                   ) : (
                     "Conferma"
                   )}
                </button>
            </div>
        </div>

        {/* FOOTER */}
        <div className="bg-red-500/5 py-3 border-t border-red-500/10 text-[9px] text-red-500/40 font-bold text-center uppercase tracking-widest">
           L&apos;azione è definitiva e irreversibile
        </div>
      </div>
    </div>
  );
}
