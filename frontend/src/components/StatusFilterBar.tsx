"use client";

import { CheckCircle, AlertCircle, Loader2, Clock, Layers } from "lucide-react";

interface StatusFilterBarProps {
  currentFilter: string;
  onFilterChange: (status: string) => void;
}

const filters = [
  { id: 'ALL', label: 'Tutti', icon: Layers, color: 'text-slate-400', activeBg: 'bg-slate-500/10 border-slate-500/30' },
  { id: 'PENDING', label: 'In Coda', icon: Clock, color: 'text-amber-500', activeBg: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'PROCESSING', label: 'In Lavorazione', icon: Loader2, color: 'text-blue-400', activeBg: 'bg-blue-500/10 border-blue-500/30' },
  { id: 'COMPLETED', label: 'Completati', icon: CheckCircle, color: 'text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500/30' },
  { id: 'FAILED', label: 'Falliti', icon: AlertCircle, color: 'text-rose-400', activeBg: 'bg-rose-500/10 border-rose-500/30' },
];

export default function StatusFilterBar({ currentFilter, onFilterChange }: StatusFilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar md:overflow-visible">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = currentFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 whitespace-nowrap
              ${isActive 
                ? `${filter.activeBg} ${filter.color} scale-105 shadow-lg` 
                : 'bg-slate-900/40 border-slate-800/50 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              }
            `}
          >
            <Icon className={`w-3.5 h-3.5 ${filter.id === 'PROCESSING' && isActive ? 'animate-spin' : ''}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
