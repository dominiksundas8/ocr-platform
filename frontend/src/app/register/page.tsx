"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);

    try {
      await api.auth.register({
        email: email,
        password1: password,
        password2: passwordConfirm
      });
      setSuccess(true);
    } catch (err: any) {
      const data = err.data || {};
      const errorMsg = data.email ? `Email: ${data.email[0]}` :
        data.password1 ? `Password: ${data.password1[0]}` :
          data.non_field_errors ? data.non_field_errors[0] :
            err.message || "Errore di registrazione.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-center">
        <div className="w-full max-w-sm card-base p-8 border-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/30"></div>
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3 tracking-tight">Accesso Concesso</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Il tuo account operatore è stato creato con successo. Puoi ora accedere al sistema tramite le tue credenziali.
          </p>
          <Link href="/login" className="btn-primary w-full !bg-emerald-600 hover:!bg-emerald-500 !py-3">
             Vai al Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 selection:bg-indigo-500/30">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-600/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Deep<span className="text-indigo-400">Ex</span></h1>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">New Identity Enrollment</p>
        </div>

        <div className="card-base p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          
          <h2 className="text-lg font-bold text-white mb-6 tracking-tight">Crea Account</h2>

          {error && (
             <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-500 text-[11px] font-bold uppercase tracking-widest mb-6 text-center">
               {error}
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Direzionale</label>
              <input 
                type="email" 
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                placeholder="mario@azienda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Conferma Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full mt-4 h-11"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Creazione...
                </span>
              ) : "Registra Operatore"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              Hai già un account? <Link href="/login" className="text-indigo-400 hover:text-white font-bold transition-colors">Accedi</Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em]">© 2026 DeepEx Intelligence Systems</p>
        </div>
      </div>
    </div>
  );
}
