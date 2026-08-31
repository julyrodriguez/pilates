"use client";

import React from "react";
import { Booking } from "@/types";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  Key,
} from "lucide-react";

interface BookingTableProps {
  bookings: Booking[];
  onViewDetails: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
  onMarkAttended: (bookingId: string) => void;
}

export function BookingTable({
  bookings,
  onViewDetails,
  onCancelBooking,
  onMarkAttended,
}: BookingTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <User className="w-12 h-12 text-rose-300 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-bold text-slate-800 dark:text-rose-100">
          No se encontraron reservas
        </h3>
        <p className="text-xs text-slate-500 dark:text-rose-300/70 mt-1">
          Intenta ajustar los filtros de búsqueda o registra una nueva reserva.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-[#150716] text-slate-600 dark:text-rose-200/80 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Alumno</th>
              <th className="p-3.5">Turno & Disciplina</th>
              <th className="p-3.5">Fecha y Horario</th>
              <th className="p-3.5">Código / Enlace</th>
              <th className="p-3.5">Estado</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-200/40 dark:divide-rose-900/30">
            {bookings.map((booking) => {
              const isCancelled = booking.status === "cancelled";
              const isAttended = booking.status === "attended";

              return (
                <tr
                  key={booking.id}
                  className={`hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors ${
                    isCancelled ? "opacity-60" : ""
                  }`}
                >
                  {/* Client info */}
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800 dark:text-rose-50">
                      {booking.clientName}
                    </div>
                    <div className="flex flex-col text-[11px] text-slate-500 dark:text-rose-300/70 mt-0.5">
                      <span>{booking.clientPhone}</span>
                      <span className="truncate max-w-[150px]">{booking.clientEmail}</span>
                    </div>
                  </td>

                  {/* Shift & Discipline */}
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-700 dark:text-rose-100">
                      {booking.shiftTitle}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <DisciplineBadge discipline={booking.discipline} size="sm" />
                      <span className="text-[11px] text-slate-500 dark:text-rose-300/70">
                        {booking.instructorName}
                      </span>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-300">
                      <Clock className="w-3 h-3" />
                      <span>{booking.shiftTime} hs</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-rose-300/70 mt-0.5">
                      {booking.shiftDate}
                    </div>
                  </td>

                  {/* Cancellation Code */}
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-rose-950/60 text-slate-700 dark:text-rose-200 border border-rose-200/40 text-[11px] font-bold">
                      <Key className="w-3 h-3 text-rose-500" />
                      {booking.cancellationCode}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-3.5">
                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        <XCircle className="w-3 h-3" />
                        Cancelada
                      </span>
                    ) : isAttended ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Asistió
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Confirmada
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewDetails(booking)}
                        type="button"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-rose-300 dark:hover:text-rose-50 hover:bg-rose-100/60 dark:hover:bg-rose-900/30"
                        title="Ver detalles y ticket"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {!isCancelled && !isAttended && (
                        <button
                          onClick={() => onMarkAttended(booking.id)}
                          type="button"
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                          title="Marcar asistencia"
                        >
                          Presente
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          onClick={() => onCancelBooking(booking)}
                          type="button"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15"
                          title="Cancelar reserva y liberar cupo"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
