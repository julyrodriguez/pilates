"use client";

import React from "react";
import { Instructor, Shift } from "@/types";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import { Phone, Mail, Edit2, Trash2 } from "lucide-react";

interface InstructorCardProps {
  instructor: Instructor;
  onEdit: (instructor: Instructor) => void;
  onDelete: (id: string) => void;
}

export function InstructorCard({
  instructor,
  onEdit,
  onDelete,
}: InstructorCardProps) {
  return (
    <div className="glass-card p-5 flex flex-col justify-between hover:shadow-md transition-all group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {instructor.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {instructor.name}
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Activo • Certificado(a)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(instructor)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={() => onDelete(instructor.id)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
          {instructor.bio}
        </p>

        {/* Specialties Tags */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Especialidades:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {instructor.specialties.map((spec) => (
              <DisciplineBadge key={spec} discipline={spec} size="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Contact info bottom */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className={instructor.phone ? "" : "text-slate-400 italic"}>
            {instructor.phone || "Sin teléfono"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className={`truncate ${instructor.email ? "" : "text-slate-400 italic"}`}>
            {instructor.email || "Sin email"}
          </span>
        </div>
      </div>
    </div>
  );
}
