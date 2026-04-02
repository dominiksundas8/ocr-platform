import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UploadForm from "@/components/UploadForm";

/**
 * 🌩️ KYC Upload Dashboard (Server-First)
 * Pagina statica renderizzata dal server, interattività delegata al componente UploadForm.
 */
export default async function KYCUploadPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-xl mx-auto py-12 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* TESTATA STATICA (Renderizzata subito dal server) */}
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Centro Operativo Estrazione</h1>
        <p className="text-slate-400 text-sm">Carica fatture, ordini o documenti contabili per l'analisi OCR automatizzata.</p>
      </div>

      {/* 📤 FORM DI UPLOAD (Client Component isolato) */}
      <UploadForm />
    </div>
  );
}
