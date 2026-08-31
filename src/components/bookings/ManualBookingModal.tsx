"use client";

import React, { useState } from "react";
import { Shift } from "@/types";
import { ManualBookingForm } from "./ManualBookingForm";
import { BookmarkPlus, X, CheckCircle, Copy, ExternalLink } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1c0c1e] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-rose-200/50 dark:border-rose-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-rose-50">
                {createdResult ? "¡Reserva Confirmada!" : "Inscribir Alumno en Turno"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-rose-300/70">
                {createdResult
                  ? "Se ha generado el código y enlace único de cancelación"
                  : "Reserva manual desde recepción o administración"}
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseAll}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-rose-100 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Reserva generada con éxito
              </div>
              <p>
                El cupo ha sido descontado automáticamente del aforo y el email de confirmación fue registrado.
              </p>
            </div>

            {/* Cancellation Token & Link Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-rose-300/70 uppercase tracking-wider">
                Código Único de Cancelación
              </div>
              <div className="text-lg font-mono font-bold text-rose-600 dark:text-rose-300 tracking-wider">
                {createdResult.cancellationCode}
              </div>

              <div className="pt-2 border-t border-rose-200/40 dark:border-rose-900/30">
                <div className="text-[11px] font-medium text-slate-600 dark:text-rose-200 mb-1">
                  Enlace directo para el cliente:
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}${createdResult.cancellationUrl}`}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1c0c1e] text-[11px] font-mono text-slate-700 dark:text-rose-200 border border-rose-200/50"
                  />
                  <button
                    onClick={handleCopyLink}
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 text-white flex items-center gap-1 hover:bg-rose-600"
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
                className="px-5 py-2 rounded-xl text-xs font-bold btn-rose-primary"
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
  );
}
