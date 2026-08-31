"use client";

import React from "react";
import { DisciplineType, ShiftStatus } from "@/types";
import { Search, Filter, Calendar, Sparkles } from "lucide-react";

interface ShiftFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedDiscipline: string;
  onDisciplineChange: (discipline: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export function ShiftFilterBar({
  search,
  onSearchChange,
  selectedDate,
  onDateChange,
  selectedDiscipline,
  onDisciplineChange,
  selectedStatus,
  onStatusChange,
}: ShiftFilterBarProps) {
  return (
    <div className="glass-card p-4 mb-6 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search by title or instructor */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 dark:text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por clase, instructor o sala..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/50 dark:border-rose-900/40 text-slate-800 dark:text-rose-100 placeholder:text-slate-400"
          />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/50 dark:border-rose-900/40 text-slate-800 dark:text-rose-100 font-medium"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/50 dark:border-rose-900/40 text-slate-800 dark:text-rose-100"
          >
            <option value="all">Todos los estados</option>
            <option value="available">Con cupos libres</option>
            <option value="almost_full">Últimos cupos</option>
            <option value="full">Completos</option>
          </select>
        </div>
      </div>

      {/* Discipline Quick Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 dark:text-rose-300/60 font-medium mr-1 text-[11px] shrink-0">
          Disciplina:
        </span>
        {[
          { id: "all", label: "Todas" },
          { id: "reformer", label: "Reformer" },
          { id: "mat", label: "Mat" },
          { id: "cadillac", label: "Cadillac" },
          { id: "tower", label: "Tower" },
          { id: "prenatal", label: "Prenatal" },
          { id: "power", label: "Power Pilates" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onDisciplineChange(item.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDiscipline === item.id
                ? "bg-rose-500 text-white shadow-xs"
                : "bg-rose-500/10 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
