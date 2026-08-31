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
    title: "Panel de Control",
    subtitle: "Gestión integral de turnos, ocupación en tiempo real y flujo de reservas",
  },
  "/turnos": {
    title: "Clases y Horarios",
    subtitle: "Configuración de clases, aforos de Reformer, Mat y disciplinas",
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
}: HeaderProps) {
  const pathname = usePathname();
  const { isFirebaseActive } = useData();
  const currentHeader = pageTitles[pathname] || {
    title: "L'Harmonie Pilates Studio",
    subtitle: "Sistema de gestión integral",
  };

  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {currentHeader.title}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {currentHeader.subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Firestore Sync Indicator */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border ${
            isFirebaseActive
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
              : "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20"
          }`}
          title="Base de datos Firestore sincronizada"
        >
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isFirebaseActive ? "Firebase Activo" : "Modo Offline"}</span>
        </div>

        {/* Public Booking Link */}
        <Link
          href="/reservar"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Portal Público</span>
        </Link>

        {/* Manual Booking Button */}
        {onOpenManualBooking && (
          <button
            onClick={onOpenManualBooking}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <BookmarkPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Nueva Reserva</span>
          </button>
        )}

        {/* New Shift Button */}
        {onOpenNewShift && (
          <button
            onClick={onOpenNewShift}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold btn-primary"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>+ Nueva Clase</span>
          </button>
        )}
      </div>
    </header>
  );
}
