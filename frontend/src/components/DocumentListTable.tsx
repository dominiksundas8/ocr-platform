import { api } from "@/lib/api";
import DocumentTable from "./DocumentTable";
import PaginationControls from "./PaginationControls";

interface DocumentListTableProps {
  token: string | undefined;
  status: string;
  page?: string;
  targetUserId?: string; // 🔍 Aggiunto per supporto Admin
}

export default async function DocumentListTable({ 
  token, 
  status, 
  page,
  targetUserId
}: DocumentListTableProps) {
  
  if (!token) return <div className="text-center py-10 text-slate-500 font-bold uppercase tracking-widest">Nessuna Sessione Valida</div>;

  let dataPayload = { count: 0, results: [], next: null, previous: null };

  try {
    // 🏗️ Se siamo in modalità Admin, usiamo l'endpoint specifico con supporto paginazione
    if (targetUserId) {
      let adminFetchUrl = `/api/admin/documents/?user_id=${targetUserId}`;
      if (page) {
        adminFetchUrl += `&page=${page}`;
      }
      dataPayload = await api.documents.getAdminDocuments(token, targetUserId, adminFetchUrl, status);
    } else {
      // 🏗️ Costruzione URL pulita per utente standard
      let fetchUrl = "/api/documents/";
      if (page) {
        fetchUrl += `?page=${page}`;
      }
      dataPayload = await api.documents.getAll(token, fetchUrl, status);
    }
  } catch (e) {
    console.error("Server-side Table Fetch Error:", e);
    return <div className="card-base p-10 text-rose-400 font-bold text-center">Errore nel caricamento dei dati dal server.</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4 px-1">
         <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Analisi Archivio</span>
         <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-white/5">
            Totale Documenti: {dataPayload.count} 
         </span>
      </div>

      <DocumentTable 
        documents={dataPayload.results} 
        isAdmin={false} 
        isLoading={false} 
      />

      {(dataPayload.next || dataPayload.previous) && (
        <PaginationControls 
          hasNext={!!dataPayload.next}
          hasPrevious={!!dataPayload.previous}
          nextUrl={dataPayload.next}
          previousUrl={dataPayload.previous}
          status={status}
        />
      )}
    </>
  );
}
