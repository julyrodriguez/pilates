"use client";

import React, { useState } from "react";
import { Shift } from "@/types";
import { ManualBookingForm } from "./ManualBookingForm";
import { BookmarkPlus, X, CheckCircle, Copy } from "lucide-react";

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftToBook?: Shift | null;
}

export function ManualBookingModal({
  isOpen,
  onClose,
  shiftToBook,
}: ManualBookingModalProps) {
  const [createdResult, setCreatedResult] = useState<{
    cancellationCode: string;
    cancellationUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!createdResult) return;
    const fullUrl = `${window.location.origin}${createdResult.cancellationUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCloseAll = () => {
    setCreatedResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl animate-modal my-4 sm:my-8 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
                {createdResult ? "¡Reserva Confirmada!" : "Inscribir Alumno en Turno"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {createdResult
                  ? "Se ha generado el código y enlace único de cancelación"
                  : "Reserva manual desde recepción o administración"}
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseAll}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-0.5 sm:pr-1 scrollbar-thin">

        {createdResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Reserva generada con éxito
              </div>
              <p>
                El cupo ha sido descontado automáticamente del aforo y el email de confirmación fue registrado.
              </p>
            </div>

            {/* Cancellation Token Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Código Único de Cancelación
              </div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                {createdResult.cancellationCode}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Enlace directo para el cliente:
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}${createdResult.cancellationUrl}`}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-indigo-600 flex items-center gap-1 hover:opacity-90"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "¡Copiado!" : "Copiar"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCloseAll}
                className="px-5 py-2 rounded-xl text-xs font-bold btn-primary"
              >
                Listo / Finalizar
              </button>
            </div>
          </div>
        ) : (
          <ManualBookingForm
            preselectedShift={shiftToBook}
            onSuccess={(res) => setCreatedResult(res)}
            onCancel={handleCloseAll}
          />
        )}
        </div>
      </div>
    </div>
  );
}
