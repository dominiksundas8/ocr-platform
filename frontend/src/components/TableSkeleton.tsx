import SkeletonRow from "./SkeletonRow";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  columnNames?: string[];
}

/**
 * 🦴 Dynamic Table Skeleton
 * Si adatta a qualsiasi tabella asincrona accettando il numero di colonne e i nomi degli header.
 */
export default function TableSkeleton({ 
  columns = 5, 
  rows = 5, 
  columnNames = ["Caricamento...", "...", "...", "...", "..."] 
}: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      {/* 📊 SKELETON STATS (Placeholder per evitare il salto della tabella quando arriva il conteggio) */}
      <div className="mb-4 flex justify-end">
        <div className="w-32 h-14 bg-slate-800/40 rounded-xl border border-white/5 shadow-inner"></div>
      </div>

      <div className="card-base overflow-hidden mb-12 border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-white/5 transition-colors">
              <tr>
                {columnNames.map((name, idx) => (
                  <th 
                    key={idx} 
                    className={`px-6 py-4 ${
                      idx === columnNames.length - 1 ? 'text-right' : 
                      idx === 0 || idx === columnNames.length - 2 ? 'text-center' : ''
                    }`}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 opacity-40">
              {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} columns={columns} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
