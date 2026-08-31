"use client";

import React from "react";
import { Booking } from "@/types";
import { Clock } from "lucide-react";

interface RecentBookingsFeedProps {
  bookings: Booking[];
  onViewDetails: (booking: Booking) => void;
}

export function RecentBookingsFeed({ bookings, onViewDetails }: RecentBookingsFeedProps) {
  const recent = bookings.slice(0, 5);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Actividad Reciente
        </h3>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Últimas reservas
        </span>
      </div>

      <div className="space-y-2.5">
        {recent.length === 0 ? (
          <p className="text-xs text-slate-500">No hay reservas recientes.</p>
        ) : (
          recent.map((b) => (
            <div
              key={b.id}
              onClick={() => onViewDetails(b)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between gap-2"
            >
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {b.clientName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {b.shiftTitle} • {b.shiftTime} hs
                </div>
              </div>

              <div className="text-right shrink-0">
                {b.status === "cancelled" ? (
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Cancelada</span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Confirmada
                  </span>
                )}
                <div className="text-[10px] font-mono text-slate-400">
                  {b.cancellationCode}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
