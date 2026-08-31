"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarPlus,
  BookmarkPlus,
  ExternalLink,
  Database,
  Search,
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
    title: "Panel de Control",
    subtitle: "Gestión de turnos, ocupación en tiempo real y flujo de reservas",
  },
  "/turnos": {
    title: "Turnos y Horarios",
    subtitle: "Configuración de clases, aforos de Reformers, Mat y disciplinas",
  },
  "/reservas": {
    title: "Gestión de Reservas",
    subtitle: "Control de alumnos inscriptos, cancelaciones automáticas y asistencia",
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
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const pathname = usePathname();
  const { isFirebaseActive } = useData();
  const currentHeader = pageTitles[pathname] || {
    title: "L'Harmonie Pilates Studio",
    subtitle: "Sistema de gestión integral",
  };

  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-rose-200/50 dark:border-rose-900/30">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-rose-50 tracking-tight">
          {currentHeader.title}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-rose-200/70 mt-0.5">
          {currentHeader.subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Firestore Sync Indicator */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border ${
            isFirebaseActive
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
          }`}
          title="Base de datos Firestore sincronizada"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isFirebaseActive ? "Firebase Activo" : "Modo Local/Offline"}</span>
        </div>

        {/* Public Booking Link */}
        <Link
          href="/reservar"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e0d21] text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
          <span>Ver Portal Público</span>
        </Link>

        {/* Manual Booking Button */}
        {onOpenManualBooking && (
          <button
            onClick={onOpenManualBooking}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 hover:bg-rose-200/70 dark:hover:bg-rose-800/50 border border-rose-300/50 dark:border-rose-700/50 transition-all"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Nueva Reserva</span>
          </button>
        )}

        {/* New Shift Button */}
        {onOpenNewShift && (
          <button
            onClick={onOpenNewShift}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold btn-rose-primary"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Crear Turno</span>
          </button>
        )}
      </div>
    </header>
  );
}
