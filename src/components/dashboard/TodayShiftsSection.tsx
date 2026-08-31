"use client";

import React from "react";
import { Shift } from "@/types";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { Calendar, Plus } from "lucide-react";

interface TodayShiftsSectionProps {
  shifts: Shift[];
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
  onBookClient: (shift: Shift) => void;
  onViewAttendees: (shift: Shift) => void;
  onNewShift: () => void;
}

export function TodayShiftsSection({
  shifts,
  onEditShift,
  onDeleteShift,
  onBookClient,
  onViewAttendees,
  onNewShift,
}: TodayShiftsSectionProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayShifts = shifts.filter((s) => s.date === todayStr);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-rose-50">
            Agenda del Día ({todayShifts.length} clases)
          </h2>
        </div>

        <button
          onClick={onNewShift}
          type="button"
          className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-300 hover:text-rose-700 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar Turno Hoy</span>
        </button>
      </div>

      {todayShifts.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Calendar className="w-10 h-10 text-rose-300 mx-auto mb-2 opacity-70" />
          <p className="text-xs text-slate-500 dark:text-rose-300/70">
            No hay turnos programados para el día de hoy.
          </p>
          <button
            onClick={onNewShift}
            type="button"
            className="mt-3 px-4 py-2 text-xs font-bold btn-rose-primary inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Primer Turno</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todayShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onEdit={onEditShift}
              onDelete={onDeleteShift}
              onBookClient={onBookClient}
              onViewAttendees={onViewAttendees}
            />
          ))}
        </div>
      )}
    </div>
  );
}
