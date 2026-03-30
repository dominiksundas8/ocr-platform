import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
      <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-600/20 text-indigo-400 shadow-xl shadow-indigo-500/10 border border-indigo-500/30">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      </div>
      <h1 className="text-5xl font-extrabold text-white mb-6">Deep <span className="text-indigo-400 border-b-4 border-indigo-500 pb-1">Extractor</span></h1>
      <p className="text-slate-400 max-w-lg mb-10 text-lg leading-relaxed">
        Il prodotto OCR Aziendale scalabile con AI. Analizza i file scontrini e fatture trasformandoli all'istante in dati strutturati privati.
      </p>
      <Link href="/login" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-xl shadow-indigo-600/30 text-lg flex items-center cursor-pointer hover:scale-105">
        Accedi all'area riservata
        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </Link>
    </div>
  );
}
