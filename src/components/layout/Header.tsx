"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarPlus,
  BookmarkPlus,
  ExternalLink,
  Database,
} from "lucide-react";
import { useData } from "@/context/DataContext";

interface HeaderProps {
  onOpenNewShift?: () => void;
  onOpenManualBooking?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Calendario Semanal",
    subtitle: "Agenda interactiva de clases, horarios y aforos en tiempo real",
  },
  "/estadisticas": {
    title: "Estadísticas y Métricas",
    subtitle: "Rendimiento del estudio, ocupación promedio y flujo de reservas",
  },
  "/turnos": {
    title: "Clases y Horarios",
    subtitle: "Configuración de clases, aforos de Reformer, Mat y disciplinas",
  },
  "/reservas": {
    title: "Gestión de Reservas",
    subtitle: "Control de alumnos inscriptos, cancelaciones automáticas y asistencia",
  },
  "/planes": {
    title: "Planes y Membresías",
    subtitle: "Gestión de abonos semanales (1x, 2x, 3x), control de pagos y aranceles",
  },
  "/clientes": {
    title: "Directorio de Alumnos",
    subtitle: "Historial de clases, asistencia y notas posturales",
  },
  "/instructores": {
    title: "Equipo de Instructores",
    subtitle: "Especialidades, asignación de salas y horarios",
  },
  "/simulador-emails": {
    title: "Simulador de Correos y Cancelación",
    subtitle: "Previsualiza los emails automáticos con el enlace único de cancelación",
  },
};

export function Header({
  onOpenNewShift,
  onOpenManualBooking,
}: HeaderProps) {
  const pathname = usePathname();
  const { isFirebaseActive } = useData();
  const currentHeader = pageTitles[pathname] || {
    title: "Selene Pilates",
    subtitle: "Sistema de gestión integral",
  };

  return (
    <header className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
          {currentHeader.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
          {currentHeader.subtitle}
        </p>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
        {/* Manual Booking Button */}
        {onOpenManualBooking && (
          <button
            onClick={onOpenManualBooking}
            type="button"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
          >
            <BookmarkPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="whitespace-nowrap">Nueva Reserva</span>
          </button>
        )}

        {/* New Shift Button */}
        {onOpenNewShift && (
          <button
            onClick={onOpenNewShift}
            type="button"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold btn-primary shadow-xs"
          >
            <CalendarPlus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">+ Nueva Clase</span>
          </button>
        )}
      </div>
    </header>
  );
}
