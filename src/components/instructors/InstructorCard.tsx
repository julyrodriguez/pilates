"use client";

import React from "react";
import { Instructor, Shift } from "@/types";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import { User, Phone, Mail, Calendar, Edit2, Trash2 } from "lucide-react";

interface InstructorCardProps {
  instructor: Instructor;
  shifts: Shift[];
  onEdit: (instructor: Instructor) => void;
  onDelete: (id: string) => void;
}

export function InstructorCard({
  instructor,
  shifts,
  onEdit,
  onDelete,
}: InstructorCardProps) {
  const instructorShifts = shifts.filter((s) => s.instructorId === instructor.id);

  return (
    <div className="glass-card p-5 flex flex-col justify-between hover:shadow-lg transition-all group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-rose-500/20">
              {instructor.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-rose-50">
                {instructor.name}
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Activo / {instructorShifts.length} clases asignadas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(instructor)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-rose-100 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <Edit2 className="w-4 h-4 text-rose-500" />
            </button>
            <button
              onClick={() => onDelete(instructor.id)}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-600 dark:text-rose-200/80 line-clamp-2 mb-3">
          {instructor.bio}
        </p>

        {/* Specialties Tags */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-rose-300/60 uppercase tracking-wider block">
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
      <div className="mt-4 pt-3 border-t border-rose-200/40 dark:border-rose-900/30 text-xs text-slate-500 dark:text-rose-300/70 space-y-1">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-rose-400" />
          <span>{instructor.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-rose-400" />
          <span className="truncate">{instructor.email}</span>
        </div>
      </div>
    </div>
  );
}
