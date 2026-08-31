"use client";

import React from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import {
  Mail,
  X,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
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
  const { emailLogs, settings } = useData();

  const selectedEmail =
    emailLogs.find((e) => e.cancellationCode === selectedEmailCode) ||
    emailLogs[0] ||
    null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Simulador de Correo de Confirmación
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Así es el email que recibe el alumno con su enlace único de cancelación
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedEmail ? (
          <div className="space-y-4">
            {/* Email client header */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-xs space-y-1 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
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

            {/* Simulated HTML Email */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white text-slate-800 p-6 shadow-xs font-sans">
              <div className="text-center pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{settings.studioName}</h3>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  {settings.tagline}
                </p>
              </div>

              <div className="py-4 space-y-3 text-xs leading-relaxed text-slate-700">
                <p>
                  ¡Hola <strong>{selectedEmail.recipientName}</strong>! 🎉
                </p>
                <p>
                  Tu reserva para la clase de Pilates ha sido confirmada exitosamente. Aquí tienes los detalles de tu turno:
                </p>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedEmail.shiftTitle}
                  </div>
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedEmail.shiftDate}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedEmail.shiftTime} hs</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{settings.address}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  💡 Recuerda llegar 5 minutos antes y traer tus medias antideslizantes.
                </p>

                {/* Single Click Cancellation Section */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <p className="text-[11px] font-bold text-slate-900">
                    ¿Surgió un imprevisto y no podrás asistir?
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Puedes cancelar automáticamente tu turno y liberar tu lugar haciendo clic en el siguiente botón:
                  </p>

                  <Link
                    href={selectedEmail.cancellationUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                  >
                    <span>Cancelar mi Turno Automáticamente</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <div className="text-[9px] font-mono text-slate-500 pt-1">
                    Código de cancelación: {selectedEmail.cancellationCode}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
                {settings.studioName} • {settings.phone} • {settings.instagram}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No hay emails registrados en el historial de simulación.
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold btn-primary"
          >
            Cerrar Simulador
          </button>
        </div>
      </div>
    </div>
  );
}
