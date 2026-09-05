"use client";

import React from "react";
import { Search, X, Loader2 } from "lucide-react";

interface BookingFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  isSearching?: boolean;
}

export function BookingFilterBar({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedDate,
  onDateChange,
  isSearching = false,
}: BookingFilterBarProps) {
  const isSearchTooShort = search.trim().length > 0 && search.trim().length < 3;

  return (
    <div className="glass-card p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin absolute left-3 top-1/2 -translate-y-1/2" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          )}

          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por alumno, email o código (mín. 3 letras)..."
            className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-slate-100 transition-colors ${
              isSearchTooShort
                ? "border-amber-400 dark:border-amber-600 focus:outline-amber-500"
                : "border-slate-200 dark:border-slate-800"
            }`}
          />

          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isSearchTooShort && (
            <span className="absolute -bottom-4 left-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              Escribe al menos 3 letras para buscar en todo el historial
            </span>
          )}
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="attended">Asistidas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>
    </div>
  );
}
