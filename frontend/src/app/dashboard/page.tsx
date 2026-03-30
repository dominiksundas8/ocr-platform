"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function KYCUploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loading) return;
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg("");

      // Generate preview for images
      if (selected.type.startsWith("image/")) {
        const url = URL.createObjectURL(selected);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    const token = session?.accessToken;
    if (!file || !token) {
      setErrorMsg("Seleziona un documento valido.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await api.documents.upload(formData, token);
      router.push(`/dashboard/documents/${data.document.id}`);
    } catch (error: any) {
      setErrorMsg(error.message || "Errore durante il processamento OCR.");
      setLoading(false); // Enable back if error occurs
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Centro Operativo Estrazione</h1>
        <p className="text-slate-400 text-sm">Carica fatture, ordini o documenti contabili per l'analisi OCR automatizzata.</p>
      </div>

      <div className="card-base p-8 text-center flex flex-col items-center">
        {previewUrl ? (
          <div className="w-full aspect-video bg-slate-950 rounded-xl overflow-hidden mb-6 border border-white/10 group relative">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain opacity-80" />
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Documento Selezionato</span>
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        )}

        <label className={`block w-full ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group'}`}>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            disabled={loading}
          />
          <div className={`border-2 border-dashed border-slate-700/50 transition-all rounded-xl p-8 bg-slate-900/30 ${!loading && 'group-hover:border-indigo-500 hover:bg-slate-900/50'}`}>
            <span className="text-sm font-semibold text-slate-300">
              {file ? file.name : "Trascina qui il file o clicca per sfogliare"}
            </span>
            <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-bold">PDF, PNG, JPG (Max 5MB)</p>
          </div>
        </label>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-semibold w-full text-left">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="btn-primary w-full mt-6 h-11"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Processamento in corso...
            </span>
          ) : "Avvia Scansione Intelligente"}
        </button>
      </div>
    </div>
  );
}
