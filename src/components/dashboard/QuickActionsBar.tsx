"use client";

import React from "react";
import Link from "next/link";
import { CalendarPlus, BookmarkPlus, ExternalLink, RefreshCw } from "lucide-react";
import { useData } from "@/context/DataContext";

interface QuickActionsBarProps {
  onNewShift: () => void;
  onManualBooking: () => void;
}

export function QuickActionsBar({
  onNewShift,
  onManualBooking,
}: QuickActionsBarProps) {
  const { resetToMockData } = useData();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs mb-6">
      <div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
          Accesos Rápidos del Estudio
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Crea turnos, inscribe alumnos o abre el portal público
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onNewShift}
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold btn-primary"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>+ Nueva Clase</span>
        </button>

        <button
          onClick={onManualBooking}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
        >
          <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>+ Reserva</span>
        </button>

        <Link
          href="/reservar"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Enlace Público</span>
        </Link>
      </div>
    </div>
  );
}
