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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Reserva tu Lugar
              </h2>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Sin necesidad de registrarte
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

        <PublicBookingForm
          shift={shift}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
