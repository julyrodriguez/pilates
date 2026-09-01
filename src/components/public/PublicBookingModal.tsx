"use client";

import React from "react";
import { Shift } from "@/types";
import { PublicBookingForm } from "./PublicBookingForm";
import { Sparkles, X } from "lucide-react";

interface PublicBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  onSuccess: (result: { cancellationCode: string; cancellationUrl: string; booking: any }) => void;
}

export function PublicBookingModal({
  isOpen,
  onClose,
  shift,
  onSuccess,
}: PublicBookingModalProps) {
  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 max-w-lg sm:max-w-xl w-full shadow-2xl animate-modal my-4 sm:my-8 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
                Reserva tu Lugar
              </h2>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Sin necesidad de registrarte
              </p>
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

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pr-0.5 sm:pr-1 scrollbar-thin">
          <PublicBookingForm
            shift={shift}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
