"use client";

import React from "react";
import Link from "next/link";
import { CalendarPlus, BookmarkPlus, ExternalLink, Mail, RefreshCw } from "lucide-react";
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
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-500/10 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-rose-950/30 border border-rose-300/40 dark:border-rose-800/40 mb-6">
      <div>
        <h4 className="text-xs font-bold text-slate-800 dark:text-rose-100">
          Accesos Rápidos del Estudio
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-rose-300/70">
          Crea turnos, inscribe alumnos o envía enlaces públicos
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onNewShift}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold btn-rose-primary"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>+ Turno</span>
        </button>

        <button
          onClick={onManualBooking}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e0d21] text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 hover:bg-rose-50"
        >
          <BookmarkPlus className="w-3.5 h-3.5 text-rose-500" />
          <span>+ Reserva</span>
        </button>

        <Link
          href="/reservar"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e0d21] text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 hover:bg-rose-50"
        >
          <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
          <span>Enlace Público</span>
        </Link>

        <button
          onClick={() => {
            if (confirm("¿Deseas restaurar los datos de demostración?")) {
              resetToMockData();
            }
          }}
          type="button"
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-rose-200"
          title="Restaurar datos de prueba"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
