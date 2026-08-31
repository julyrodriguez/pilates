"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { Booking } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Ban,
  ArrowLeft,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface CancellationCardProps {
  initialCode: string;
}

export function CancellationCard({ initialCode }: CancellationCardProps) {
  const { bookings, cancelBookingByCode, settings } = useData();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    booking?: Booking;
  } | null>(null);

  // Find booking
  const currentBooking = bookings.find(
    (b) => b.cancellationCode.toUpperCase() === code.trim().toUpperCase()
  );

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setCancelling(true);
    try {
      const res = await cancelBookingByCode(code, reason || "Cancelado por el alumno vía web");
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Error al procesar la cancelación.",
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Result View */}
      {result ? (
        <div className="glass-card p-6 sm:p-8 text-center animate-modal">
          {result.success ? (
            <>
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-rose-50 mb-2">
                Turno Cancelado Exitosamente
              </h2>
              <p className="text-xs text-slate-600 dark:text-rose-200/80 mb-6 leading-relaxed">
                {result.message} Tu lugar ha sido devuelto a la disponibilidad del estudio para que otro alumno pueda aprovecharlo.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-rose-50 mb-2">
                Aviso sobre tu Reserva
              </h2>
              <p className="text-xs text-slate-600 dark:text-rose-200/80 mb-6 leading-relaxed">
                {result.message}
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/reservar"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold btn-rose-primary inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ver Otros Turnos Disponibles</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-8 animate-fadeIn">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto mb-3">
              <Ban className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-rose-50">
              Cancelación Automática de Turno
            </h2>
            <p className="text-xs text-slate-500 dark:text-rose-300/70 mt-1">
              Libera tu lugar sin intermediarios en un solo clic
            </p>
          </div>

          {currentBooking ? (
            <div className="space-y-4">
              {/* Target booking summary card */}
              <div className="p-4 rounded-2xl bg-[#faf6f0] dark:bg-[#150716] border border-rose-200/60 dark:border-rose-900/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 dark:text-rose-100">
                    {currentBooking.shiftTitle}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-300">
                    {currentBooking.cancellationCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-rose-200/80 pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>{currentBooking.shiftDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span>{currentBooking.shiftTime} hs</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{currentBooking.room} (Prof. {currentBooking.instructorName})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/40 text-[11px] text-slate-500 dark:text-rose-300/70">
                  Alumno: <strong className="text-slate-700 dark:text-rose-100">{currentBooking.clientName}</strong> ({currentBooking.clientEmail})
                </div>
              </div>

              {/* Cancellation form */}
              <form onSubmit={handleCancel} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-rose-200 mb-1">
                    Motivo de la cancelación (Opcional)
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
                  >
                    <option value="">Selecciona un motivo...</option>
                    <option value="Imprevisto laboral o personal">Imprevisto laboral o personal</option>
                    <option value="Motivos de salud / Lesión">Motivos de salud / Lesión</option>
                    <option value="Error al elegir el horario">Error al elegir el horario</option>
                    <option value="Reprogramaré para otro día">Reprogramaré para otro día</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-[11px] leading-relaxed">
                  <strong>Política del estudio:</strong> Al confirmar, tu cupo quedará libre instantáneamente y podrás volver a reservar cuando desees.
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href="/reservar"
                    className="text-xs font-semibold text-slate-600 dark:text-rose-300 hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>No cancelar</span>
                  </Link>

                  <button
                    type="submit"
                    disabled={cancelling}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 flex items-center gap-1.5"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{cancelling ? "Cancelando..." : "Confirmar Cancelación"}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-rose-200 mb-1">
                  Ingresa tu Código de Cancelación
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej. PIL-M4RT-892"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-sm font-mono font-bold text-center tracking-wider text-slate-800 dark:text-rose-100"
                />
              </div>

              <button
                type="submit"
                disabled={cancelling || !code}
                className="w-full py-2.5 rounded-xl text-xs font-bold btn-rose-primary disabled:opacity-50"
              >
                {cancelling ? "Buscando..." : "Buscar y Cancelar Turno"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
