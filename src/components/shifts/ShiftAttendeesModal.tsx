"use client";

import React, { useState, useEffect } from "react";
import { Shift, Booking } from "@/types";
import { useData } from "@/context/DataContext";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";
import { Users, X, Phone, Mail, Check, AlertCircle, Ban, MessageCircle, Loader2, UserPlus, UserX } from "lucide-react";
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
  const { bookings: contextBookings, updateBookingStatus, cancelBookingByCode, settings, showToast } = useData();

  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToToggleAttendance, setBookingToToggleAttendance] = useState<Booking | null>(null);
  const [bookingToToggleAbsent, setBookingToToggleAbsent] = useState<Booking | null>(null);
  const [fetchedBookings, setFetchedBookings] = useState<Booking[]>([]);
  const [hasFetchedFromDb, setHasFetchedFromDb] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (!isOpen || !shift?.id) {
      setFetchedBookings([]);
      setHasFetchedFromDb(false);
      return;
    }

    const db = getFirebaseDb();
    if (!db) return;

    setLoadingBookings(true);
    const q = query(
      collection(db, "pilates_bookings"),
      where("shiftId", "==", shift.id)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Booking)
          .filter((b) => b && b.id && !b.id.startsWith("_"));
        setFetchedBookings(list);
        setHasFetchedFromDb(true);
        setLoadingBookings(false);
      },
      (err) => {
        console.warn("Error fetching shift bookings in attendees modal:", err);
        setLoadingBookings(false);
      }
    );

    return () => unsub();
  }, [isOpen, shift?.id]);

  // Sincronizar bookedCount del turno en Firestore si difiere de las camas realmente ocupadas (excluyendo canceladas y ausentes)
  useEffect(() => {
    if (!isOpen || !shift?.id || !hasFetchedFromDb) return;
    const db = getFirebaseDb();
    if (!db) return;

    const occupied = fetchedBookings.filter(
      (b) => b.status !== "cancelled" && b.status !== "no_show"
    ).length;

    if (shift.bookedCount !== occupied) {
      const nextStatus =
        occupied >= shift.capacity
          ? "full"
          : occupied >= shift.capacity - 2 && shift.capacity > 2
          ? "almost_full"
          : "available";
      setDoc(
        doc(db, "pilates_shifts", shift.id),
        { bookedCount: occupied, status: nextStatus },
        { merge: true }
      ).catch((err) => console.warn("Error syncing shift bookedCount:", err));
    }
  }, [isOpen, shift?.id, shift?.bookedCount, shift?.capacity, hasFetchedFromDb, fetchedBookings]);

  if (!isOpen || !shift) return null;

  const activeShiftBookings = hasFetchedFromDb
    ? fetchedBookings
    : contextBookings.filter((b) => b.shiftId === shift.id);

  const activeBookings = activeShiftBookings.filter((b) => b.status !== "cancelled");
  const occupiedBookings = activeBookings.filter((b) => b.status !== "no_show");
  const absentBookings = activeBookings.filter((b) => b.status === "no_show");
  const cancelledBookings = activeShiftBookings.filter((b) => b.status === "cancelled");
  const occupiedCount = occupiedBookings.length;
  const isClassFull = occupiedCount >= shift.capacity;

  const handleRequestToggleAttendance = (b: Booking) => {
    if (b.status === "no_show" && isClassFull) {
      showToast(
        "No se puede desausentar a la alumna porque el cupo liberado ya fue ocupado por otra persona y la clase está completa.",
        "error"
      );
      return;
    }
    setBookingToToggleAttendance(b);
  };

  const handleRequestToggleAbsent = (b: Booking) => {
    if (b.status === "no_show" && isClassFull) {
      showToast(
        "No se puede desausentar a la alumna porque el cupo liberado ya fue ocupado por otra persona y la clase está completa.",
        "error"
      );
      return;
    }
    setBookingToToggleAbsent(b);
  };

  const handleConfirmCancelBooking = async () => {
    if (bookingToCancel) {
      if (bookingToCancel.cancellationCode) {
        await cancelBookingByCode(bookingToCancel.cancellationCode, "Cancelado desde lista de inscriptos en Turnos", true);
      } else {
        await updateBookingStatus(bookingToCancel.id, "cancelled");
      }
      setBookingToCancel(null);
    }
  };

  const handleConfirmToggleAttendance = async () => {
    if (bookingToToggleAttendance) {
      if (bookingToToggleAttendance.status === "no_show" && isClassFull) {
        showToast(
          "No se puede desausentar a la alumna porque el cupo liberado ya fue ocupado por otra persona y la clase está completa.",
          "error"
        );
        setBookingToToggleAttendance(null);
        return;
      }
      const nextStatus = bookingToToggleAttendance.status === "attended" ? "confirmed" : "attended";
      await updateBookingStatus(bookingToToggleAttendance.id, nextStatus);
      setBookingToToggleAttendance(null);
    }
  };

  const handleConfirmToggleAbsent = async () => {
    if (bookingToToggleAbsent) {
      const isMarkingAbsent = bookingToToggleAbsent.status !== "no_show";
      if (!isMarkingAbsent && isClassFull) {
        showToast(
          "No se puede desausentar a la alumna porque el cupo liberado ya fue ocupado por otra persona y la clase está completa.",
          "error"
        );
        setBookingToToggleAbsent(null);
        return;
      }
      const nextStatus = isMarkingAbsent ? "no_show" : "confirmed";
      await updateBookingStatus(bookingToToggleAbsent.id, nextStatus);
      if (isMarkingAbsent) {
        showToast(`${bookingToToggleAbsent.clientName} marcado/a como ausente. Se liberó 1 cupo en la clase y se devolvió 1 clase a su plan.`, "info");
      } else {
        showToast(`Ausencia desmarcada para ${bookingToToggleAbsent.clientName}. Vuelve a ocupar su cupo en la clase y en su plan.`, "info");
      }
      setBookingToToggleAbsent(null);
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
                  {occupiedCount} de {shift.capacity} camas
                </span>
                {absentBookings.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    {absentBookings.length} {absentBookings.length === 1 ? "ausente" : "ausentes"}
                  </span>
                )}
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
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                          b.status === "no_show" ? "bg-amber-500" : "bg-indigo-600"
                        }`}
                        title={b.status === "no_show" ? "Ausente (cupo liberado)" : "Cama asignada"}
                      >
                        {b.status === "no_show" ? (
                          <UserX className="w-3.5 h-3.5" />
                        ) : (
                          occupiedBookings.findIndex((ob) => ob.id === b.id) + 1
                        )}
                      </div>
                      <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {b.clientName}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        b.status === "attended"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : b.status === "no_show"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {b.status === "attended"
                        ? "✓ Presente"
                        : b.status === "no_show"
                        ? "✕ Ausente"
                        : "Confirmada"}
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

                  {/* Actions: WhatsApp reminder, Presente, Ausente & Dar de baja */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 sm:gap-2 w-full">
                    {(() => {
                      const phoneDigits = (b.clientPhone || "").replace(/\D/g, "");
                      const fullPhone = phoneDigits ? (phoneDigits.startsWith("54") ? phoneDigits : `549${phoneDigits}`) : null;

                      if (!fullPhone) {
                        const isBlockedUnabsent = b.status === "no_show" && isClassFull;
                        return (
                          <>
                            <button
                              onClick={() => handleRequestToggleAttendance(b)}
                              type="button"
                              className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                                isBlockedUnabsent
                                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 opacity-60 cursor-not-allowed"
                                  : b.status === "attended"
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 cursor-pointer"
                              }`}
                              title={
                                isBlockedUnabsent
                                  ? "No se puede marcar presente: el cupo liberado ya fue ocupado y la clase está completa"
                                  : b.status === "attended"
                                  ? "Click para desmarcar asistencia"
                                  : "Marcar como Presente"
                              }
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Presente</span>
                            </button>

                            <button
                              onClick={() => handleRequestToggleAbsent(b)}
                              type="button"
                              className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                                isBlockedUnabsent
                                  ? "bg-amber-600/60 text-white/90 opacity-60 cursor-not-allowed"
                                  : b.status === "no_show"
                                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 cursor-pointer"
                              }`}
                              title={
                                isBlockedUnabsent
                                  ? "No se puede desausentar: el cupo liberado ya fue ocupado por otra alumna y la clase está completa"
                                  : b.status === "no_show"
                                  ? "Click para desmarcar ausente"
                                  : "Marcar como Ausente"
                              }
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Ausente</span>
                            </button>

                            <button
                              onClick={() => setBookingToCancel(b)}
                              type="button"
                              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center gap-1 transition-colors shrink-0 cursor-pointer"
                              title="Dar de baja de esta clase"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Dar de baja</span>
                            </button>
                          </>
                        );
                      }

                      const formatDate = (dStr: string) => {
                        if (!dStr) return "-";
                        const parts = dStr.split("-");
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dStr;
                      };

                      const customMessage = `¡Hola ${b.clientName}! Te escribimos de ${settings.studioName || "Selene Pilates"} para recordarte tu clase de ${shift.title || "Pilates"} el día ${formatDate(shift.date)} a las ${shift.startTime} hs con la Prof. ${shift.instructorName || "del estudio"}. Por favor, ¿nos confirmas tu asistencia? Recuerda que de no asistir debes avisar con anterioridad a 2 horas, sino tu clase será contada de su plan. ¡Muchas gracias! ✨`;
                      const waUrl = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(customMessage)}`;
                      const isBlockedUnabsent = b.status === "no_show" && isClassFull;

                      return (
                        <>
                          <a
                            href={waUrl}
                            className="flex-1 min-w-0 px-2 sm:px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-2xs truncate"
                            title="Enviar recordatorio (Abre la app de WhatsApp de tu dispositivo)"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Recordar asistencia</span>
                          </a>

                          <button
                            onClick={() => handleRequestToggleAttendance(b)}
                            type="button"
                            className={`shrink-0 px-2 sm:px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-2xs ${
                              isBlockedUnabsent
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 opacity-60 cursor-not-allowed"
                                : b.status === "attended"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 cursor-pointer"
                            }`}
                            title={
                              isBlockedUnabsent
                                ? "No se puede marcar presente: el cupo liberado ya fue ocupado y la clase está completa"
                                : b.status === "attended"
                                ? "Click para desmarcar asistencia"
                                : "Marcar como Presente"
                            }
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Presente</span>
                          </button>

                          <button
                            onClick={() => handleRequestToggleAbsent(b)}
                            type="button"
                            className={`shrink-0 px-2 sm:px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-2xs ${
                              isBlockedUnabsent
                                ? "bg-amber-600/60 text-white/90 opacity-60 cursor-not-allowed"
                                : b.status === "no_show"
                                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 cursor-pointer"
                            }`}
                            title={
                              isBlockedUnabsent
                                ? "No se puede desausentar: el cupo liberado ya fue ocupado por otra alumna y la clase está completa"
                                : b.status === "no_show"
                                ? "Click para desmarcar ausente"
                                : "Marcar como Ausente"
                            }
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Ausente</span>
                          </button>

                          <button
                            onClick={() => setBookingToCancel(b)}
                            type="button"
                            className="shrink-0 p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Dar de baja de esta clase"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Dar de baja</span>
                          </button>
                        </>
                      );
                    })()}
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

            {occupiedCount < shift.capacity && (
              <button
                onClick={() => {
                  onClose();
                  onOpenManualBooking({
                    ...shift,
                    bookedCount: occupiedCount,
                  });
                }}
                type="button"
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold btn-primary flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>Anotar Alumno</span>
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

      {/* Confirmation Modal for Toggling Absent */}
      <ConfirmModal
        isOpen={!!bookingToToggleAbsent}
        title={bookingToToggleAbsent?.status === "no_show" ? "Desmarcar Ausente" : "Confirmar Ausencia"}
        message={
          bookingToToggleAbsent?.status === "no_show"
            ? `¿Deseas quitar la marca de ausente a ${bookingToToggleAbsent?.clientName}? El turno volverá al estado Confirmado, ocupará nuevamente 1 cupo en la clase y volverá a contar para su plan.`
            : `¿Deseas marcar a ${bookingToToggleAbsent?.clientName} como AUSENTE en esta clase? Se liberará 1 cupo en la clase para que otra alumna pueda anotarse y no le contará para su plan semanal/mensual.`
        }
        confirmText={bookingToToggleAbsent?.status === "no_show" ? "Sí, Desmarcar" : "Sí, Marcar Ausente"}
        onConfirm={handleConfirmToggleAbsent}
        onCancel={() => setBookingToToggleAbsent(null)}
      />
    </>
  );
}
