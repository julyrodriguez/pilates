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
      <div className="flex items-center justify-between py-3 border-b border-rose-200/50 dark:border-rose-900/30 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 dark:text-rose-100">
              {settings.studioName}
            </h1>
            <p className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold tracking-wider uppercase">
              {settings.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 dark:text-rose-300/80 hover:text-rose-600 underline"
          >
            Acceso Estudio
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Banner with luxury Pilates vibes */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-rose-100/90 via-[#fff8f2] to-pink-100/70 dark:from-[#230d25] dark:via-[#19091b] dark:to-[#2c102e] border border-rose-200/70 dark:border-rose-800/40 shadow-sm">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Reserva directa sin registro ni contraseña</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-rose-50 tracking-tight leading-tight">
            Encuentra tu ritmo, tonifica tu cuerpo.
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-rose-200/80 leading-relaxed max-w-xl">
            Elige tu turno en Reformer, Mat o Cadillac. Recibirás tu confirmación inmediata con un enlace único para cancelar automáticamente si tus planes cambian.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500 dark:text-rose-300/70">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-rose-500" />
              <span>{settings.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5 text-rose-500" />
              <span>{settings.instagram}</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-rose-400/20 dark:bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>
    </header>
  );
}
