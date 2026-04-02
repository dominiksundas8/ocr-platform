import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserListTable from "@/components/UserListTable";
import TableSkeleton from "@/components/TableSkeleton";

/**
 * 👑 Admin Dashboard: User Management (Server-First)
 * Gestisce l'accesso amministrativo e lo streaming della lista utenti.
 */
export default async function AdminDashboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string }> 
}) {
  const session = await getServerSession(authOptions);
  
  // 🛡️ Sicurezza Server-Side: Access Control
  if (!session?.user?.isStaff) {
    redirect("/dashboard");
  }

  const { page } = await searchParams;

  return (
    <div className="animate-in fade-in duration-500">
      {/* 🏰 HEADER STATICO (Visibile Istantaneamente) */}
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
          <p className="text-slate-500 text-xs mt-1 leading-tight max-w-sm">Supervisione globale degli utenti e dei flussi di validazione documentale.</p>
        </div>
      </div>

      {/* 🧩 STREAMING UI (Solo la tabella e i dati dinamici caricano qui) */}
      <Suspense 
        key={page || '1'} 
        fallback={
          <TableSkeleton 
            columns={4} 
            rows={6} 
            columnNames={["Docs", "Informazioni Account", "Ruolo Civile", "Azioni"]} 
          />
        }
      >
        <UserListTable 
          token={session.accessToken} 
          page={page} 
        />
      </Suspense>
    </div>
  );
}
