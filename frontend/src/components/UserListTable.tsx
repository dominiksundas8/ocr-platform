import { api } from "@/lib/api";
import UserTable from "./UserTable";
import PaginationControls from "./PaginationControls";

interface UserListTableProps {
  token: string | undefined;
  page?: string;
}

/**
 * 🏰 Master Orchestrator: UserListTable (Server-Side)
 * Recupera la lista utenti e coordina la visualizzazione client.
 */
export default async function UserListTable({ token, page }: UserListTableProps) {
  if (!token) return <div className="text-center py-10 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sessione Amministrativa non Rilevata</div>;

  let dataPayload = { count: 0, results: [], next: null, previous: null };

  try {
    // 🏗️ Costruzione URL per paginazione automatica
    let fetchUrl = "/api/admin/users/";
    if (page) {
      fetchUrl += `?page=${page}`;
    }
    
    dataPayload = await api.admin.getUsers(token, fetchUrl);
  } catch (error) {
    console.error("Admin Users Fetch Error:", error);
    return <div className="card-base p-10 text-rose-400 font-bold text-center text-xs">Errore Critico nel caricamento utenti.</div>;
  }

  return (
    <>
      {/* 🚀 STATS DINAMICHE (Appaiono dopo il caricamento) */}
      <div className="mb-4 flex justify-end">
        <div className="card-base px-6 py-3 flex items-baseline gap-2 border-amber-500/20 shadow-lg shadow-amber-500/5 transition-all">
          <span className="text-amber-500/50 text-[10px] font-bold uppercase tracking-widest leading-none">Anagrafiche:</span>
          <span className="text-2xl font-bold text-white leading-none">{dataPayload.count}</span>
        </div>
      </div>

      {/* 🧩 TABELLA CLIENT-INTERACTIVE */}
      <UserTable users={dataPayload.results} />

      {/* 🚀 PAGINAZIONE UNIFICATA */}
      {(dataPayload.next || dataPayload.previous) && (
        <PaginationControls 
          hasNext={!!dataPayload.next}
          hasPrevious={!!dataPayload.previous}
          nextUrl={dataPayload.next}
          previousUrl={dataPayload.previous}
          status="ALL" // Status generico per gli utenti
        />
      )}
    </>
  );
}
