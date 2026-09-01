"use client";

import React, { useState } from "react";
import { Shift, Booking } from "@/types";
import { useData } from "@/context/DataContext";
import { Users, X, Phone, Mail, Check, AlertCircle, Ban, MessageCircle } from "lucide-react";
import { ConfirmModal } from "@/components/common/ConfirmModal";

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
  const { bookings, updateBookingStatus, settings } = useData();

  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToToggleAttendance, setBookingToToggleAttendance] = useState<Booking | null>(null);

  if (!isOpen || !shift) return null;

  const shiftBookings = bookings.filter((b) => b.shiftId === shift.id);
  const activeBookings = shiftBookings.filter((b) => b.status !== "cancelled");
  const cancelledBookings = shiftBookings.filter((b) => b.status === "cancelled");

  const handleConfirmCancelBooking = async () => {
    if (bookingToCancel) {
      await updateBookingStatus(bookingToCancel.id, "cancelled");
      setBookingToCancel(null);
    }
  };

  const handleConfirmToggleAttendance = async () => {
    if (bookingToToggleAttendance) {
      const nextStatus = bookingToToggleAttendance.status === "attended" ? "confirmed" : "attended";
      await updateBookingStatus(bookingToToggleAttendance.id, nextStatus);
      setBookingToToggleAttendance(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl animate-modal my-4 sm:my-8 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 mb-3 sm:mb-4 border-b border-slate-200 dark:border-slate-800 shrink-0 gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
                Alumnos Inscriptos
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{shift.title}</span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {shift.startTime} a {shift.endTime} hs
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {activeBookings.length} de {shift.capacity} camas
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active attendees list */}
          <div className="space-y-2.5 sm:space-y-3 mb-4 flex-1 overflow-y-auto pr-0.5 sm:pr-1 scrollbar-thin">
            {activeBookings.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Aún no hay alumnos inscriptos
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Esta clase tiene todos sus cupos libres ({shift.capacity} lugares disponibles).
                </p>
              </div>
            ) : (
              activeBookings.map((b, idx) => (
                <div
                  key={b.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 space-y-2.5 shadow-2xs"
                >
                  {/* Top Row: Number + Student Name + Attendance Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {idx + 1}
                      </div>
                      <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {b.clientName}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        b.status === "attended"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {b.status === "attended" ? "✓ Presente" : "Confirmada"}
                    </span>
                  </div>

                  {/* Contact info: wrapped gracefully */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pl-0.5">
                    {b.clientPhone && (
                      <span className="flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{b.clientPhone}</span>
                      </span>
                    )}
                    {b.clientEmail && (
                      <span className="flex items-center gap-1 font-medium truncate max-w-[200px] sm:max-w-none">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{b.clientEmail}</span>
                      </span>
                    )}
                  </div>

                  {/* Health / notes */}
                  {b.notes && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <strong>Nota:</strong> {b.notes}
                    </div>
                  )}

                  {/* Actions: WhatsApp reminder, Attendance toggle & Cancel button */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
                    {(() => {
                      const phoneDigits = (b.clientPhone || "").replace(/\D/g, "");
                      const fullPhone = phoneDigits ? (phoneDigits.startsWith("54") ? phoneDigits : `549${phoneDigits}`) : null;
                      if (!fullPhone) return <div />;

                      const formatDate = (dStr: string) => {
                        if (!dStr) return "-";
                        const parts = dStr.split("-");
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dStr;
                      };

                      const customMessage = `¡Hola ${b.clientName}! Te escribimos de ${settings.studioName || "Selene Pilates"} para recordarte tu clase de ${shift.title || "Pilates"} el día ${formatDate(shift.date)} a las ${shift.startTime} hs con la Prof. ${shift.instructorName || "del estudio"}. Por favor, ¿nos confirmas tu asistencia? ¡Muchas gracias! ✨`;
                      const waUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(customMessage)}`;

                      return (
                        <a
                          href={waUrl}
                          target="whatsapp_tab"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-2xs"
                          title="Enviar mensaje de recordatorio y confirmación por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Recordar asistencia</span>
                        </a>
                      );
                    })()}

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setBookingToToggleAttendance(b)}
                        type="button"
                        className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                          b.status === "attended"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30"
                        }`}
                        title={b.status === "attended" ? "Click para desmarcar asistencia" : "Marcar como Presente"}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Presente</span>
                      </button>

                      <button
                        onClick={() => setBookingToCancel(b)}
                        type="button"
                        className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center gap-1 transition-colors"
                        title="Dar de baja de esta clase"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Dar de baja</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cancelled count summary if any */}
          {cancelledBookings.length > 0 && (
            <div className="mb-3 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 shrink-0 px-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{cancelledBookings.length} {cancelledBookings.length === 1 ? "cancelación registrada" : "cancelaciones registradas"} para este turno</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={onClose}
              type="button"
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-center cursor-pointer"
            >
              Cerrar
            </button>

            {activeBookings.length < shift.capacity && (
              <button
                onClick={() => {
                  onClose();
                  onOpenManualBooking(shift);
                }}
                type="button"
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold btn-primary flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>+ Anotar Alumno</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Cancelling Booking */}
      <ConfirmModal
        isOpen={!!bookingToCancel}
        title="Confirmar Baja de Alumno"
        message={`¿Estás seguro de que deseas dar de baja a ${bookingToCancel?.clientName} de la clase ${shift.title} (${shift.startTime} hs)? Su lugar quedará disponible para otro alumno.`}
        isDestructive={true}
        confirmText="Sí, Dar de Baja"
        onConfirm={handleConfirmCancelBooking}
        onCancel={() => setBookingToCancel(null)}
      />

      {/* Confirmation Modal for Toggling Attendance */}
      <ConfirmModal
        isOpen={!!bookingToToggleAttendance}
        title={bookingToToggleAttendance?.status === "attended" ? "Desmarcar Asistencia" : "Confirmar Asistencia"}
        message={
          bookingToToggleAttendance?.status === "attended"
            ? `¿Deseas quitar la marca de presente a ${bookingToToggleAttendance?.clientName}? El turno volverá al estado Confirmado.`
            : `¿Deseas marcar a ${bookingToToggleAttendance?.clientName} como presente en esta clase?`
        }
        confirmText={bookingToToggleAttendance?.status === "attended" ? "Sí, Desmarcar" : "Sí, Marcar Presente"}
        onConfirm={handleConfirmToggleAttendance}
        onCancel={() => setBookingToToggleAttendance(null)}
      />
    </>
  );
}
