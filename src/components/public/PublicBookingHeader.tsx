"use client";

import React from "react";
import { Sparkles, MapPin, Phone, Share2, Heart, CalendarClock, Search } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useData } from "@/context/DataContext";

interface PublicBookingHeaderProps {
  onOpenMyBookings?: () => void;
}

export function PublicBookingHeader({ onOpenMyBookings }: PublicBookingHeaderProps) {
  const { settings } = useData();

  return (
    <header className="mb-6 sm:mb-8">
      {/* Top bar with studio logo, my bookings lookup & theme toggle */}
      <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
              {settings.studioName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenMyBookings && (
            <button
              type="button"
              onClick={onOpenMyBookings}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <CalendarClock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">Mis Próximos Turnos</span>
              <span className="sm:hidden">Mis Turnos</span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Banner with Centered & Symmetrical Layout on Mobile */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md text-center sm:text-left flex flex-col items-center sm:items-start">
        <div className="max-w-2xl relative z-10 space-y-3.5 w-full flex flex-col items-center sm:items-start">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 shrink-0" />
              <span>Reserva directa en segundos sin login</span>
            </div>

            {onOpenMyBookings && (
              <button
                type="button"
                onClick={onOpenMyBookings}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-indigo-500/30 hover:bg-indigo-500/45 text-indigo-200 border border-indigo-400/40 transition-all cursor-pointer"
              >
                <Search className="w-3 h-3 text-indigo-300 shrink-0" />
                <span>Consultar mis reservas</span>
              </button>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Reserva tu turno de Pilates
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl text-center sm:text-left">
            Elige el día y horario que prefieras. Recibirás tu confirmación inmediata con un enlace único para cancelar o modificar automáticamente si tus planes cambian.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 pt-1 text-xs text-slate-300 w-full">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{settings.address || "Cesar Diaz 3031, CABA"}</span>
            </div>
            {settings.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{settings.phone}</span>
              </div>
            )}
            {settings.instagram && (
              <div className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{settings.instagram}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
