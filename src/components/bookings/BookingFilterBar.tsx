"use client";

import React from "react";
import { Search } from "lucide-react";

interface BookingFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function BookingFilterBar({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedDate,
  onDateChange,
}: BookingFilterBarProps) {
  return (
    <div className="glass-card p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por alumno, email o código..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
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
