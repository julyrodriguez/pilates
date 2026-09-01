"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Copy,
  Calendar,
  Clock,
  MapPin,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Booking } from "@/types";

interface PublicBookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingResult: {
    cancellationCode: string;
    cancellationUrl: string;
    booking: Booking;
  } | null;
  onOpenEmailPreview: (code: string) => void;
}

export function PublicBookingSuccessModal({
  isOpen,
  onClose,
  bookingResult,
  onOpenEmailPreview,
}: PublicBookingSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#4f46e5", "#059669", "#0284c7", "#f59e0b", "#ffffff"],
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen || !bookingResult) return null;

  const { booking, cancellationCode, cancellationUrl } = bookingResult;
  const fullCancellationUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }${cancellationUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCancellationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60   p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-modal my-8 text-center">
        {/* Celebration Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          ¡Reserva Confirmada con Éxito!
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Te esperamos para tu sesión de Pilates. Hemos enviado una copia de confirmación a tu correo:{" "}
          <strong className="text-slate-800 dark:text-slate-200">{booking.clientEmail}</strong>
        </p>

        {/* Ticket Summary Card */}
        <div className="text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 mb-6 text-xs">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {booking.shiftTitle}
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{booking.shiftDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{booking.shiftTime} hs</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Cesar Diaz 3031, CABA • {booking.room} (Prof: {booking.instructorName})</span>
            </div>
          </div>
        </div>

        {/* Unique Cancellation/Reschedule Link Box */}
        <div className="text-left p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Enlace para Modificar o Cancelar Turno
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
              {cancellationCode}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Si necesitas cambiar el horario de tu clase o cancelarla, usa este enlace para gestionarla automáticamente en un solo clic:
          </p>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={fullCancellationUrl}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            />
            <button
              onClick={handleCopy}
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-indigo-600 flex items-center gap-1 hover:opacity-90"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "¡Copiado!" : "Copiar"}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenEmailPreview(cancellationCode)}
            type="button"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
          >
            <Mail className="w-4 h-4 text-indigo-500" />
            <span>Ver Correo de Confirmación</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold btn-primary"
          >
            Aceptar / Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
