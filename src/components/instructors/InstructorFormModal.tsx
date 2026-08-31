"use client";

import React from "react";
import { Instructor } from "@/types";
import { InstructorForm } from "./InstructorForm";
import { GraduationCap, X } from "lucide-react";

interface InstructorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructorToEdit?: Instructor | null;
}

export function InstructorFormModal({
  isOpen,
  onClose,
  instructorToEdit,
}: InstructorFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1c0c1e] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-rose-200/50 dark:border-rose-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-rose-50">
                {instructorToEdit ? "Editar Instructor" : "Nuevo Instructor"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-rose-300/70">
                Perfil docente y especialidades
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

        <InstructorForm
          initialInstructor={instructorToEdit}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
