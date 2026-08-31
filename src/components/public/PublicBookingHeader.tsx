"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, MapPin, Phone, Share2, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useData } from "@/context/DataContext";

export function PublicBookingHeader() {
  const { settings } = useData();

  return (
    <header className="mb-8">
      {/* Top bar with studio info & theme toggle */}
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

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline"
          >
            Acceso Estudio
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            <span>Reserva directa sin necesidad de crear cuenta</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
            Encuentra tu equilibrio, tonifica tu cuerpo.
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Elige tu clase de Reformer, Mat o Cadillac. Recibirás tu confirmación inmediata con un enlace único para cancelar automáticamente si tus planes cambian.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span>{settings.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{settings.instagram}</span>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>
    </header>
  );
}
