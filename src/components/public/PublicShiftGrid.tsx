"use client";

import React from "react";
import { Shift } from "@/types";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import { AvailabilityBadge } from "@/components/common/AvailabilityBadge";
import { Clock, MapPin, User, Sparkles } from "lucide-react";

interface PublicShiftGridProps {
  shifts: Shift[];
  onSelectShift: (shift: Shift) => void;
}

export function PublicShiftGrid({ shifts, onSelectShift }: PublicShiftGridProps) {
  if (shifts.length === 0) {
    return (
      <div className="glass-card p-12 text-center my-6">
        <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No hay turnos disponibles para los filtros seleccionados
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Prueba seleccionando otra fecha o disciplina.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {shifts.map((shift) => {
        const isFull = shift.bookedCount >= shift.capacity;

        return (
          <div
            key={shift.id}
            className={`glass-card p-5 flex flex-col justify-between relative overflow-hidden transition-all ${
              isFull
                ? "opacity-60 bg-slate-50 dark:bg-slate-950"
                : "hover:border-slate-400 dark:hover:border-slate-700 shadow-xs"
            }`}
          >
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <DisciplineBadge discipline={shift.discipline} size="sm" />
                <AvailabilityBadge
                  status={shift.status}
                  bookedCount={shift.bookedCount}
                  capacity={shift.capacity}
                  showCount={true}
                />
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {shift.title}
              </h3>

              {/* Time & Level */}
              <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {shift.startTime} - {shift.endTime} hs
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {shift.level}
                </span>
              </div>

              {/* Instructor & Location */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Prof. {shift.instructorName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{shift.room}</span>
                </div>
              </div>

              {/* Description */}
              {shift.description && (
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                  &ldquo;{shift.description}&rdquo;
                </p>
              )}
            </div>

            {/* Bottom Row */}
            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">
                  Arancel por clase
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ${shift.price.toLocaleString("es-AR")}
                </span>
              </div>

              <button
                onClick={() => onSelectShift(shift)}
                disabled={isFull}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isFull
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "btn-primary"
                }`}
              >
                {isFull ? "Sin cupo" : "Reservar Mi Lugar"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
