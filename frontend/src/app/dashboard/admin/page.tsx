"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { api } from "@/lib/api";

export default function KYCAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [dataPayload, setDataPayload] = useState<{ count: number, next: string | null, previous: string | null, results: any[] }>({ count: 0, next: null, previous: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [pageUrl, setPageUrl] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState("");
  const [deletingUser, setDeletingUser] = useState<{ id: number, email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = (url?: string) => {
    const token = session?.accessToken;
    if (token) {
      setLoading(true);
      api.admin.getUsers(token, url)
        .then(data => {
          setDataPayload(data);
          setLoading(false);
        })
        .catch(e => {
          setErrorMsg(e.message || "Errore di connessione");
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isStaff) {
      router.push("/dashboard");
      return;
    }
    if (status === "authenticated") {
      fetchData(pageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, pageUrl, status, router]);

  const confirmDeleteUser = async () => {
    const token = session?.accessToken;
    if (!deletingUser || !token) return;

    setIsDeleting(true);
    try {
      await api.admin.deleteUser(deletingUser.id, token);
      setDeletingUser(null);
      fetchData(pageUrl);
    } catch (e: any) {
      alert(e.message || "Errore nella cancellazione dell'utente.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && dataPayload.results.length === 0 && !errorMsg) return (
    <div className="py-20 flex flex-col items-center justify-center">
      <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full mb-4"></div>
      <div className="text-amber-500/50 text-[10px] font-bold uppercase tracking-widest">Sincronizzazione Radar in corso...</div>
    </div>
  );

  if (errorMsg) return <div className="p-10 text-red-500 text-center font-black uppercase tracking-tight text-xs">{errorMsg}</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <DeleteConfirmModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={confirmDeleteUser}
        title="Elimina Utente"
        message={`Sei sicuro di voler eliminare l'account ${deletingUser?.email}?`}
        isLoading={isDeleting}
      />

      {/* HEADER COMPATTO ADMIN */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[10px] font-bold uppercase tracking-widest">
              Amministratore
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Lista <span className="text-amber-500">Utenti</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">Supervisione globale degli utenti e dei flussi di validazione.</p>
        </div>

        <div className="card-base px-6 py-3 flex items-baseline gap-2 border-amber-500/20">
          <span className="text-amber-500/50 text-[10px] font-bold uppercase tracking-widest leading-none">Totale:</span>
          <span className="text-2xl font-bold text-white leading-none">{dataPayload.count}</span>
        </div>
      </div>

      {/* TABELLA UTENTI AD ALTA DENSITÀ */}
      <div className="card-base overflow-hidden mb-12">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-white/5">
              <tr>
                <th className="px-6 py-4">UID</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Ruolo</th>
                <th className="px-6 py-4 text-center">Docs</th>
                <th className="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dataPayload.results.map((user: any) => (
                <tr key={user.id} className="hover:bg-amber-500/[0.02] transition-colors group/row">
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-600">#{user.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-100 text-sm">{user.email}</div>
                    <div className="text-[10px] text-slate-500">{user.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_staff
                      ? <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">Admin</span>
                      : <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded">Standard</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-indigo-400 font-bold text-base tracking-tighter">{user.document_count}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Link
                        href={`/dashboard/admin/users/${user.id}/documents`}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-md transition-colors"
                        title="Ispeziona Documenti"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      </Link>
                      <button
                        onClick={() => setDeletingUser({ id: user.id, email: user.email })}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-md transition-colors border border-red-500/20"
                        title="Elimina"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINAZIONE */}
      {dataPayload.count > 0 && (
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setPageUrl(dataPayload.previous || undefined)} disabled={!dataPayload.previous} className="btn-secondary !py-1.5 !px-4 !text-[11px]">Indietro</button>
          <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Root Analysis Stream Status: Operational</div>
          <button onClick={() => setPageUrl(dataPayload.next || undefined)} disabled={!dataPayload.next} className="btn-admin !py-1.5 !px-4 !text-[11px]">Avanti</button>
        </div>
      )}
    </div>
  )
}
