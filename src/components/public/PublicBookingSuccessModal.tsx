"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Copy,
  Calendar,
  Clock,
  MapPin,
  Mail,
  ShieldCheck,
  ExternalLink,
  X,
  Sparkles,
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
      // Launch celebratory pink & gold confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ec4899", "#f43f5e", "#fb7185", "#fde047", "#ffffff"],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1c0c1e] border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-modal my-8 text-center">
        {/* Celebration Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-black text-slate-800 dark:text-rose-50 mb-1">
          ¡Reserva Confirmada con Éxito!
        </h2>
        <p className="text-xs text-slate-500 dark:text-rose-300/70 mb-6">
          Te esperamos para tu sesión de Pilates. Hemos enviado una copia de confirmación a tu correo:{" "}
          <strong className="text-slate-700 dark:text-rose-100">{booking.clientEmail}</strong>
        </p>

        {/* Ticket Summary Card */}
        <div className="text-left p-4 rounded-2xl bg-[#faf6f0] dark:bg-[#130714] border border-rose-200/60 dark:border-rose-900/40 space-y-2 mb-6 text-xs">
          <div className="font-bold text-sm text-slate-800 dark:text-rose-100">
            {booking.shiftTitle}
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-rose-200/80 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>{booking.shiftDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>{booking.shiftTime} hs</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{booking.room} (Prof: {booking.instructorName})</span>
            </div>
          </div>
        </div>

        {/* Unique Cancellation Link Box */}
        <div className="text-left p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Enlace de Cancelación Automática
            </span>
            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-300">
              {cancellationCode}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-rose-200/70 leading-relaxed">
            Si no puedes asistir, haz clic en este enlace desde tu correo o cópialo aquí para liberar tu cupo automáticamente en un solo clic:
          </p>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={fullCancellationUrl}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e0d21] text-[11px] font-mono text-slate-700 dark:text-rose-200 border border-rose-300/50"
            />
            <button
              onClick={handleCopy}
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 flex items-center gap-1"
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
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#1a0b1b] border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 hover:bg-rose-50 flex items-center justify-center gap-1.5"
          >
            <Mail className="w-4 h-4 text-rose-500" />
            <span>Ver Correo de Confirmación</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold btn-rose-primary"
          >
            Aceptar / Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
