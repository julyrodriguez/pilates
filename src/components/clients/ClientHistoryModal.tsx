"use client";

import React from "react";
import { Client } from "@/types";
import { useData } from "@/context/DataContext";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import { X, Calendar, Clock } from "lucide-react";

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export function ClientHistoryModal({ isOpen, onClose, client }: ClientHistoryModalProps) {
  const { bookings } = useData();

  if (!isOpen || !client) return null;

  const clientBookings = bookings.filter(
    (b) => b.clientEmail.toLowerCase() === client.email.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Historial de Asistencia
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {client.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking history list */}
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {clientBookings.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No hay reservas históricas para este alumno.
            </div>
          ) : (
            clientBookings.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {b.shiftTitle}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {b.shiftDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {b.shiftTime} hs
                    </span>
                    <DisciplineBadge discipline={b.discipline} size="sm" />
                  </div>
                </div>

                <div>
                  {b.status === "cancelled" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                      Cancelada
                    </span>
                  ) : b.status === "attended" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      Asistió
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      Confirmada
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
