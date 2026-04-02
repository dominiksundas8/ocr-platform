'use client';

import { useState } from "react";
import Link from "next/link";
import { Trash2, Eye } from "lucide-react";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { deleteUserAction } from "@/app/actions/admin";

interface UserTableProps {
  users: any[];
}

/**
 * 👨‍💻 Componente Client: UserTable
 * Gestisce l'interattività della lista utenti (Modal di cancellazione).
 */
export default function UserTable({ users }: UserTableProps) {
  const [deletingUser, setDeletingUser] = useState<{ id: number, email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    
    try {
      const result = await deleteUserAction(deletingUser.id);
      if (result.error) {
        alert(result.error);
      } else {
        setDeletingUser(null);
      }
    } catch (error) {
      alert("Errore imprevisto durante la cancellazione.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DeleteConfirmModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        title="Elimina Utente"
        message={`Sei sicuro di voler eliminare l'account ${deletingUser?.email}? Tutti i documenti associati verranno rimossi.`}
        isLoading={isDeleting}
      />

      <div className="card-base overflow-hidden mb-12">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-center">Docs</th>
                <th className="px-6 py-4">Informazioni Account</th>
                <th className="px-6 py-4">Ruolo Civile</th>
                <th className="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-amber-500/[0.02] transition-colors group/row">
                  {/* DOC COUNT */}
                  <td className="px-6 py-4 text-center">
                    <span className="text-amber-500 font-bold text-lg tracking-tighter">{user.document_count}</span>
                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-0.5">Analisi</p>
                  </td>

                  {/* ACCOUNT INFO */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-100 text-sm leading-tight">{user.email}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1">
                       <span className="font-mono">#{user.id}</span>
                       <span className="opacity-20">|</span>
                       <span>{user.username}</span>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="px-6 py-4">
                    {user.is_staff ? (
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                        System Admin
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded">
                        Standard User
                      </span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <Link
                        href={`/dashboard/admin/users/${user.id}/documents`}
                        className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white p-2 rounded-lg transition-all duration-300 border border-white/5"
                        title="Ispeziona Archivio"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeletingUser({ id: user.id, email: user.email })}
                        className="bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-all duration-300 border border-red-500/20"
                        title="Elimina Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
