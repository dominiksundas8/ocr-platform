"use client";

interface SkeletonRowProps {
  columns?: number;
}

export default function SkeletonRow({ columns = 5 }: SkeletonRowProps) {
  return (
    <tr className="bg-transparent border-b border-white/5 last:border-0">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <td key={colIndex} className="px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Simula un pallino di stato nella prima colonna */}
            {colIndex === 0 && (
              <div className="w-2 h-2 rounded-full bg-slate-800 animate-shimmer shrink-0"></div>
            )}
            {/* Testo shimmer con larghezza variabile per simulare dati reali */}
            <div 
              className="h-3 bg-slate-800/60 animate-shimmer rounded" 
              style={{ 
                width: colIndex === 1 ? '160px' : colIndex === 4 ? '70px' : '90px',
                opacity: 1 - (colIndex * 0.1) 
              }}
            ></div>
          </div>
        </td>
      ))}
    </tr>
  );
}
