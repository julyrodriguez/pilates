"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EmailLog } from "@/types";
import { useData } from "@/context/DataContext";
import {
  Mail,
  X,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

interface EmailSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmailCode?: string | null;
}

export function EmailSimulatorModal({
  isOpen,
  onClose,
  selectedEmailCode,
}: EmailSimulatorModalProps) {
  const { emailLogs, settings, bookings } = useData();

  const selectedEmail =
    emailLogs.find((e) => e.cancellationCode === selectedEmailCode) ||
    emailLogs[0] ||
    null;

  const currentBooking = selectedEmail
    ? bookings.find((b) => b.cancellationCode === selectedEmail.cancellationCode)
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1c0c1e] border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-rose-200/50 dark:border-rose-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-rose-50">
                Simulador de Correo de Confirmación
              </h2>
              <p className="text-xs text-slate-500 dark:text-rose-300/70">
                Así es el email que recibe el alumno con su enlace único de cancelación
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-rose-100 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedEmail ? (
          <div className="space-y-4">
            {/* Email client header container */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#120713] text-xs space-y-1 text-slate-600 dark:text-rose-200/80">
              <div>
                <strong>De:</strong> {settings.studioName} &lt;turnos@{settings.studioName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com&gt;
              </div>
              <div>
                <strong>Para:</strong> {selectedEmail.recipientName} &lt;{selectedEmail.recipientEmail}&gt;
              </div>
              <div>
                <strong>Asunto:</strong> {selectedEmail.subject}
              </div>
            </div>

            {/* Simulated HTML Email Card */}
            <div className="border border-rose-200 rounded-2xl bg-[#fffdfa] text-slate-800 p-6 shadow-xs font-sans">
              {/* Studio Logo Header */}
              <div className="text-center pb-4 border-b border-rose-100">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-rose-950">{settings.studioName}</h3>
                <p className="text-[11px] text-rose-600 uppercase tracking-wider font-semibold">
                  {settings.tagline}
                </p>
              </div>

              {/* Message Content */}
              <div className="py-4 space-y-3 text-xs leading-relaxed text-slate-700">
                <p>
                  ¡Hola <strong>{selectedEmail.recipientName}</strong>! 🎉
                </p>
                <p>
                  Tu reserva para la clase de Pilates ha sido confirmada exitosamente. Aquí tienes los detalles de tu turno:
                </p>

                {/* Reservation Summary */}
                <div className="bg-[#faf4ed] p-3.5 rounded-xl border border-rose-200/80 space-y-1.5 text-xs">
                  <div className="font-bold text-rose-950 text-sm">
                    {selectedEmail.shiftTitle}
                  </div>
                  <div className="flex items-center gap-2 text-rose-700 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedEmail.shiftDate}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedEmail.shiftTime} hs</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{settings.address}</span>
                  </div>
                </div>

                {/* Instructions */}
                <p className="text-[11px] text-slate-500 italic">
                  💡 Recuerda llegar 5 minutos antes y traer tus medias antideslizantes.
                </p>

                {/* Single Click Cancellation Section */}
                <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-2">
                  <p className="text-[11px] font-bold text-rose-900">
                    ¿Surgió un imprevisto y no podrás asistir?
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Puedes cancelar automáticamente tu turno y liberar tu lugar haciendo clic en el siguiente botón:
                  </p>

                  <Link
                    href={selectedEmail.cancellationUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
                  >
                    <span>Cancelar mi Turno Automáticamente</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <div className="text-[9px] font-mono text-slate-500 pt-1">
                    Código de cancelación: {selectedEmail.cancellationCode}
                  </div>
                </div>
              </div>

              {/* Email Footer */}
              <div className="pt-3 border-t border-rose-100 text-center text-[10px] text-slate-400">
                {settings.studioName} • {settings.phone} • {settings.instagram}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No hay emails registrados en el historial de simulación.
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-rose-200/50 dark:border-rose-900/30">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold btn-rose-primary"
          >
            Cerrar Simulador
          </button>
        </div>
      </div>
    </div>
  );
}
