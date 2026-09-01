"use client";

import React, { useState } from "react";
import { Search, Settings, SlidersHorizontal } from "lucide-react";
import { useData } from "@/context/DataContext";
import { DisciplineManagerModal } from "@/components/disciplines/DisciplineManagerModal";

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
  const { disciplines } = useData();
  const [managerOpen, setManagerOpen] = useState(false);

  return (
    <>
      <div className="glass-card p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por clase, instructor o sala..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">Todos los estados</option>
              <option value="available">Con cupos libres</option>
              <option value="almost_full">Últimos cupos</option>
              <option value="full">Completos</option>
            </select>
          </div>
        </div>

        {/* Discipline Quick Pills with Settings Gear Icon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium mr-1 text-[11px]">
              Disciplina:
            </span>
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/40 transition-colors shadow-xs"
              title="Gestionar Disciplinas (Agregar / Borrar)"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* "Todas" Pill */}
          <button
            type="button"
            onClick={() => onDisciplineChange("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDiscipline === "all"
                ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Todas
          </button>

          {/* Dynamic Disciplines Pills from DB */}
          {disciplines.map((item) => {
            const keySlug = item.slug || item.id;
            const isSelected = selectedDiscipline === keySlug;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onDisciplineChange(keySlug)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Discipline Manager Modal */}
      <DisciplineManagerModal
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
      />
    </>
  );
}
