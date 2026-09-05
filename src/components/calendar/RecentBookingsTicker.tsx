"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Booking } from "@/types";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import {
  Radio,
  Clock,
  Calendar as CalendarIcon,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  Activity,
  ArrowRight,
} from "lucide-react";

interface RecentBookingsTickerProps {
  onViewBooking?: (booking: Booking) => void;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Reciente";
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (isNaN(diffSec) || diffSec < 0) return "Reciente";
  if (diffSec < 60) return "Hace instantes";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}

function formatShiftDate(dateStr: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y.slice(2)}`;
  }
  return dateStr;
}

export function RecentBookingsTicker({ onViewBooking }: RecentBookingsTickerProps) {
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Escuchar en tiempo real SOLO las últimas 3 reservas realizadas
  useEffect(() => {
    let isMounted = true;
    const db = getFirebaseDb();

    if (!db) {
      setIsLoading(false);
      return;
    }

    // Consulta limitada a 3 con orden descendente por fecha de creación
    const q = query(
      collection(db, "pilates_bookings"),
      orderBy("createdAt", "desc"),
      limit(3)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!isMounted) return;
        const docs = snap.docs
          .map((d) => d.data() as Booking)
          .filter((b) => b && b.id && !b.id.startsWith("_") && b.shiftId !== "deleted");

        setRecentBookings(docs);
        setIsLoading(false);
      },
      (err) => {
        console.warn("Error fetching 3 recent bookings for ticker:", err);
        if (isMounted) setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Timer automático estilo broker ticker (pasa cada 4.5 segundos)
  useEffect(() => {
    if (recentBookings.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recentBookings.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recentBookings.length, isPaused]);

  // Si cambia la cantidad de bookings, asegurar índice válido
  useEffect(() => {
    if (currentIndex >= recentBookings.length && recentBookings.length > 0) {
      setCurrentIndex(0);
    }
  }, [recentBookings.length, currentIndex]);

  const activeBooking = recentBookings[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + recentBookings.length) % recentBookings.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % recentBookings.length);
  };

  if (isLoading) {
    return (
      <div className="w-full h-11 rounded-2xl bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 px-4 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <div className="h-3 w-40 bg-slate-800 rounded-md" />
        </div>
        <div className="h-3 w-28 bg-slate-800 rounded-md" />
      </div>
    );
  }

  if (recentBookings.length === 0) {
    return null;
  }

  const isCancelled = activeBooking.status === "cancelled";
  const isAttended = activeBooking.status === "attended";

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative group overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-700/70 shadow-sm transition-all hover:border-indigo-500/50"
    >
      {/* Barra de progreso visual animada del ticker */}
      {!isPaused && recentBookings.length > 1 && (
        <div
          key={currentIndex}
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-indigo-400 to-pink-400 animate-[progress_4.5s_linear_forwards]"
          style={{
            animation: "tickerBar 4.5s linear forwards",
          }}
        />
      )}

      <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        {/* Left Side: Live Ticker Badge & Index indicator */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black tracking-wider uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>ÚLTIMAS 3 RESERVAS</span>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            <span className="text-white font-bold">{currentIndex + 1}</span>/{recentBookings.length}
          </span>

          <div className="flex items-center gap-1">
            {recentBookings.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? "w-4 bg-emerald-400"
                    : "w-1.5 bg-slate-700 hover:bg-slate-500"
                }`}
                title={`Ver reserva #${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Center: Booking dynamic stock-ticker info */}
        <div
          key={activeBooking.id}
          className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs animate-fadeIn"
        >
          {/* Posición relativa de la reserva */}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
            {currentIndex === 0 ? "🔥 La más reciente" : currentIndex === 1 ? "⚡ Penúltima" : "⏳ Anterior"}
          </span>

          {/* Alumno */}
          <div className="flex items-center gap-1 font-bold text-white truncate max-w-[180px] sm:max-w-none">
            <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{activeBooking.clientName}</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          {/* Clase */}
          <div className="flex items-center gap-1 text-slate-300 truncate max-w-[160px] sm:max-w-none">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate font-semibold">{activeBooking.shiftTitle}</span>
          </div>

          <span className="text-slate-600 hidden md:inline">•</span>

          {/* Horario de la clase */}
          <div className="flex items-center gap-1 text-slate-300 font-medium">
            <CalendarIcon className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>{formatShiftDate(activeBooking.shiftDate)}</span>
            <Clock className="w-3 h-3 text-cyan-400 ml-1 shrink-0" />
            <span>{activeBooking.shiftTime} hs</span>
          </div>

          <span className="text-slate-600 hidden lg:inline">•</span>

          {/* Tiempo desde que se realizó la reserva */}
          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Registrada {formatRelativeTime(activeBooking.createdAt)}</span>
          </div>

          {/* Estado de la reserva */}
          <div className="ml-auto sm:ml-0">
            {isCancelled ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                <XCircle className="w-2.5 h-2.5" />
                Cancelada
              </span>
            ) : isAttended ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Asistió
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Confirmada
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Manual Controls & Detail button */}
        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
          {onViewBooking && (
            <button
              type="button"
              onClick={() => onViewBooking(activeBooking)}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Ver detalle de la reserva"
            >
              <span>Ver ticket</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Reserva anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Siguiente reserva"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
