"use client";

import React from "react";
import { Sparkles, MapPin, Phone, Share2, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useData } from "@/context/DataContext";

export function PublicBookingHeader() {
  const { settings } = useData();

  return (
    <header className="mb-8">
      {/* Top bar with studio logo & theme toggle only */}
      <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {settings.studioName}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
              {settings.tagline}
            </p>
          </div>
        </div>

        <ThemeToggle />
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 shrink-0" />
            <span>Reserva directa en segundos sin contraseñas</span>
          </div>

          <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Reserva tu turno de Pilates
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Elige el día y horario que prefieras. Recibirás tu confirmación inmediata con un enlace único para cancelar automáticamente si tus planes cambian.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-slate-400">
            {settings.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{settings.address}</span>
              </div>
            )}
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
