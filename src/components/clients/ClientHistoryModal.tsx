"use client";

import React from "react";
import { Client } from "@/types";
import { useData } from "@/context/DataContext";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import { X, Calendar, Clock, CheckCircle2, XCircle, User } from "lucide-react";

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
      <div className="bg-white dark:bg-[#1c0c1e] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-rose-200/50 dark:border-rose-900/30">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">
              Historial de Asistencia
            </span>
            <h2 className="text-base font-bold text-slate-800 dark:text-rose-50">
              {client.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-rose-100 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking history list */}
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {clientBookings.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-rose-300/70">
              No hay reservas históricas para este alumno.
            </div>
          ) : (
            clientBookings.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-rose-100">
                    {b.shiftTitle}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-rose-300/70 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rose-400" />
                      {b.shiftDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" />
                      {b.shiftTime} hs
                    </span>
                    <DisciplineBadge discipline={b.discipline} size="sm" />
                  </div>
                </div>

                <div>
                  {b.status === "cancelled" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 border border-rose-500/30">
                      Cancelada
                    </span>
                  ) : b.status === "attended" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                      Asistió
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-600 border border-blue-500/30">
                      Confirmada
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-rose-200/50 dark:border-rose-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-rose-900/40 text-slate-700 dark:text-rose-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
