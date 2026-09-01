"use client";

import React from "react";
import { Shift } from "@/types";
import { useData } from "@/context/DataContext";
import { Users, X, Phone, Mail, Check, AlertCircle, Ban } from "lucide-react";

interface ShiftAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  onOpenManualBooking: (shift: Shift) => void;
}

export function ShiftAttendeesModal({
  isOpen,
  onClose,
  shift,
  onOpenManualBooking,
}: ShiftAttendeesModalProps) {
  const { bookings, updateBookingStatus } = useData();

  if (!isOpen || !shift) return null;

  const shiftBookings = bookings.filter((b) => b.shiftId === shift.id);
  const activeBookings = shiftBookings.filter((b) => b.status !== "cancelled");
  const cancelledBookings = shiftBookings.filter((b) => b.status === "cancelled");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60   p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Alumnos Inscriptos
            </h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {shift.title} • {shift.startTime} hs ({activeBookings.length}/{shift.capacity} cupos)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active attendees */}
        <div className="space-y-3 mb-6 max-h-[340px] overflow-y-auto pr-1">
          {activeBookings.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aún no hay alumnos inscriptos en esta clase.
              </p>
            </div>
          ) : (
            activeBookings.map((b, idx) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {b.clientName}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {b.clientPhone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {b.clientEmail}
                      </span>
                    </div>
                    {b.notes && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 italic">
                        Nota: {b.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateBookingStatus(b.id, b.status === "attended" ? "confirmed" : "attended")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      b.status === "attended"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                    }`}
                    title="Marcar Asistencia"
                  >
                    <Check className="w-3 h-3" />
                    <span>{b.status === "attended" ? "Asistió" : "Presente"}</span>
                  </button>

                  <button
                    onClick={() => updateBookingStatus(b.id, "cancelled")}
                    className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                    title="Dar de baja / Cancelar"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cancelled count if any */}
        {cancelledBookings.length > 0 && (
          <div className="mb-4 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{cancelledBookings.length} cancelaciones registradas para este turno</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Cerrar
          </button>

          {activeBookings.length < shift.capacity && (
            <button
              onClick={() => {
                onClose();
                onOpenManualBooking(shift);
              }}
              className="px-4 py-2 text-xs font-bold btn-primary"
            >
              + Anotar Alumno Aquí
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
