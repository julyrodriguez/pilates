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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl animate-modal my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                Previsualización del Correo
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Email emitido al alumno con su enlace de cancelación
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Email Body */}
        <div className="overflow-y-auto flex-1 pr-0.5 space-y-3 scrollbar-thin">
          {selectedEmail ? (
            <div className="space-y-3">
              {/* Email client header */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-[11px] sm:text-xs space-y-1 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 break-words">
                <div>
                  <strong>De:</strong> {settings.studioName || "Selene Pilates"} &lt;turnos@jariel.com.ar&gt;
                </div>
                <div>
                  <strong>Para:</strong> {selectedEmail.recipientName} &lt;{selectedEmail.recipientEmail}&gt;
                </div>
                <div>
                  <strong>Asunto:</strong> {selectedEmail.subject}
                </div>
              </div>

              {/* Simulated Email Card */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white text-slate-800 p-4 sm:p-6 shadow-xs font-sans space-y-3">
                <div className="text-center pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-1.5 shadow-xs">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{settings.studioName || "Selene Pilates"}</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    {settings.tagline || "Estudio Reformer & Mat"}
                  </p>
                </div>

                <div className="space-y-2.5 text-xs leading-relaxed text-slate-700">
                  <p>
                    ¡Hola <strong>{selectedEmail.recipientName}</strong>! 🎉
                  </p>
                  <p>
                    Tu reserva para la clase de Pilates ha sido confirmada exitosamente. Aquí tienes los detalles de tu turno:
                  </p>

                  <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      {selectedEmail.shiftTitle}
                    </div>
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold flex-wrap text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedEmail.shiftDate}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedEmail.shiftTime} hs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{settings.address || "César Díaz 3031, CABA"}</span>
                    </div>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-slate-500 italic">
                    💡 Recuerda llegar 5 minutos antes y traer tus medias antideslizantes.
                  </p>

                  {/* Single Click Cancellation Section */}
                  <div className="mt-3 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <p className="text-[11px] font-bold text-slate-900">
                      ¿Surgió un imprevisto y no podrás asistir?
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Puedes cancelar automáticamente tu turno y liberar tu lugar haciendo clic en el siguiente botón:
                    </p>

                    <div className="pt-1">
                      <Link
                        href={selectedEmail.cancellationUrl}
                        target="_blank"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                      >
                        <span>Cancelar mi Turno Automáticamente</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                    </div>

                    <div className="text-[9px] font-mono text-slate-500 pt-1">
                      Código de cancelación: {selectedEmail.cancellationCode}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 text-center text-[10px] text-slate-400">
                  {settings.studioName || "Selene Pilates"} • César Díaz 3031, CABA
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No hay emails registrados en el historial de simulación.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold btn-primary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
