"use client";

import React from "react";
import { Shift } from "@/types";
import { ShiftForm } from "./ShiftForm";
import { Calendar, X } from "lucide-react";

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftToEdit?: Shift | null;
}

export function ShiftFormModal({ isOpen, onClose, shiftToEdit }: ShiftFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {shiftToEdit ? "Editar Turno" : "Nuevo Turno de Pilates"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura horario, aforo y disciplina
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

        <ShiftForm
          initialShift={shiftToEdit}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
