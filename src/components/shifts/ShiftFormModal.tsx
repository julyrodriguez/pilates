"use client";

import React from "react";
import { Shift } from "@/types";
import { ShiftForm } from "./ShiftForm";
import { Calendar, X } from "lucide-react";

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftToEdit?: Shift | null;
  preselectedDate?: string;
}

export function ShiftFormModal({ isOpen, onClose, shiftToEdit, preselectedDate }: ShiftFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60   p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-modal my-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {shiftToEdit ? "Editar Clase de Pilates" : "Nueva Clase de Pilates"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {shiftToEdit ? "Modifica horario, profesor o cupos de esta clase" : "Configura horario, aforo y repetición semanal"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ShiftForm
          initialShift={shiftToEdit}
          preselectedDate={preselectedDate}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
