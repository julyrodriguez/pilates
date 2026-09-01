"use client";

import React from "react";
import { Booking } from "@/types";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import {
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  Key,
  MessageCircle,
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
        <User className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No se encontraron reservas
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Intenta ajustar los filtros de búsqueda o registra una nueva reserva.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Mobile & Tablet Card List (< lg) */}
      <div className="block lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
        {bookings.map((booking) => {
          const isCancelled = booking.status === "cancelled";
          const isAttended = booking.status === "attended";
          const phoneDigits = (booking.clientPhone || "").replace(/\D/g, "");
          const fullPhone = phoneDigits
            ? phoneDigits.startsWith("54")
              ? phoneDigits
              : `549${phoneDigits}`
            : null;

          const formatDate = (dStr: string) => {
            if (!dStr) return "-";
            const parts = dStr.split("-");
            return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dStr;
          };

          const customMessage = `¡Hola ${booking.clientName}! Te escribimos de Selene Pilates para recordarte tu clase de ${booking.shiftTitle || "Pilates"} el día ${formatDate(booking.shiftDate)} a las ${booking.shiftTime} hs con la Prof. ${booking.instructorName || "del estudio"}. Por favor, ¿nos confirmas tu asistencia? ¡Muchas gracias! ✨`;
          const waUrl = fullPhone ? `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(customMessage)}` : null;

          return (
            <div
              key={booking.id}
              className={`p-4 space-y-3 transition-colors ${
                isCancelled ? "opacity-60 bg-slate-50/50 dark:bg-slate-950/50" : ""
              }`}
            >
              {/* Header: Student name & Status badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {booking.clientName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span>{booking.clientPhone || booking.clientEmail}</span>
                  </div>
                </div>

                <div>
                  {isCancelled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                      <XCircle className="w-3 h-3" />
                      Cancelada
                    </span>
                  ) : isAttended ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Asistió
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Confirmada
                    </span>
                  )}
                </div>
              </div>

              {/* Middle: Shift info, date, time, and cancellation code */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{booking.shiftTitle}</span>
                  <DisciplineBadge discipline={booking.discipline} size="sm" />
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>{booking.shiftDate} • {booking.shiftTime} hs</span>
                  </span>
                  <span>Prof. {booking.instructorName}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Cód. cancelación:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    {booking.cancellationCode}
                  </span>
                </div>
              </div>

              {/* Actions row with WhatsApp button */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  {waUrl && (
                    <a
                      href={waUrl}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                      title="Enviar recordatorio (Abre la app de WhatsApp de tu dispositivo)"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <button
                    onClick={() => onViewDetails(booking)}
                    type="button"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalle</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isCancelled && !isAttended && (
                    <button
                      onClick={() => onMarkAttended(booking.id)}
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Presente</span>
                    </button>
                  )}

                  {!isCancelled && (
                    <button
                      onClick={() => onCancelBooking(booking)}
                      type="button"
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800"
                      title="Cancelar reserva"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= lg) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Alumno</th>
              <th className="p-3.5">Turno & Disciplina</th>
              <th className="p-3.5">Fecha y Horario</th>
              <th className="p-3.5">Código / Enlace</th>
              <th className="p-3.5">Estado</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:border-slate-800/80">
            {bookings.map((booking) => {
              const isCancelled = booking.status === "cancelled";
              const isAttended = booking.status === "attended";

              return (
                <tr
                  key={booking.id}
                  className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                    isCancelled ? "opacity-60" : ""
                  }`}
                >
                  {/* Client info */}
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {booking.clientName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{booking.clientPhone || "Sin teléfono"}</span>
                      {(() => {
                        const phoneDigits = (booking.clientPhone || "").replace(/\D/g, "");
                        const fullPhone = phoneDigits ? (phoneDigits.startsWith("54") ? phoneDigits : `549${phoneDigits}`) : null;
                        if (!fullPhone) return null;

                        const formatDate = (dStr: string) => {
                          if (!dStr) return "-";
                          const parts = dStr.split("-");
                          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dStr;
                        };

                        const customMessage = `¡Hola ${booking.clientName}! Te escribimos de Selene Pilates para recordarte tu clase de ${booking.shiftTitle || "Pilates"} el día ${formatDate(booking.shiftDate)} a las ${booking.shiftTime} hs con la Prof. ${booking.instructorName || "del estudio"}. Por favor, ¿nos confirmas tu asistencia? ¡Muchas gracias! ✨`;
                        const waUrl = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(customMessage)}`;

                        return (
                          <a
                            href={waUrl}
                            className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
                            title="Enviar recordatorio (Abre la app de WhatsApp de tu dispositivo)"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        );
                      })()}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {booking.clientEmail}
                    </div>
                  </td>

                  {/* Shift & Discipline */}
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {booking.shiftTitle}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <DisciplineBadge discipline={booking.discipline} size="sm" />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {booking.instructorName}
                      </span>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{booking.shiftTime} hs</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {booking.shiftDate}
                    </div>
                  </td>

                  {/* Cancellation Code */}
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                      <Key className="w-3 h-3 text-slate-400" />
                      {booking.cancellationCode}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-3.5">
                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                        <XCircle className="w-3 h-3" />
                        Cancelada
                      </span>
                    ) : isAttended ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Asistió
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
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
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Ver detalles y ticket"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {!isCancelled && !isAttended && (
                        <button
                          onClick={() => onMarkAttended(booking.id)}
                          type="button"
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                          title="Marcar asistencia"
                        >
                          Presente
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          onClick={() => onCancelBooking(booking)}
                          type="button"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
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
