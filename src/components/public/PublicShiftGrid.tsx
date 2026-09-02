"use client";

import React, { useState, useMemo } from "react";
import { Shift } from "@/types";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import { AvailabilityBadge } from "@/components/common/AvailabilityBadge";
import { Clock, MapPin, User, Sparkles, Search, Filter, Sun, Sunset, Moon, Loader2 } from "lucide-react";

interface PublicShiftGridProps {
  shifts: Shift[];
  isLoading?: boolean;
  onSelectShift: (shift: Shift) => void;
}

function hasShiftStarted(dateStr: string, startTimeStr: string): boolean {
  try {
    const now = new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = startTimeStr.split(":").map(Number);
    const shiftDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return now.getTime() >= shiftDate.getTime();
  } catch {
    return false;
  }
}

export function PublicShiftGrid({ shifts, isLoading = false, onSelectShift }: PublicShiftGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");

  // Lista única de disciplinas presentes
  const availableDisciplines = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s) => set.add(s.discipline));
    return Array.from(set);
  }, [shifts]);

  // Filtrado de turnos
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      // Búsqueda por texto (título, instructor, sala)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches =
          s.title.toLowerCase().includes(term) ||
          s.instructorName.toLowerCase().includes(term) ||
          s.room.toLowerCase().includes(term) ||
          s.startTime.includes(term);
        if (!matches) return false;
      }

      // Filtro por franja horaria
      if (timeFilter !== "all") {
        const hour = parseInt(s.startTime.split(":")[0], 10);
        if (timeFilter === "morning" && hour >= 13) return false;
        if (timeFilter === "afternoon" && (hour < 13 || hour >= 18)) return false;
        if (timeFilter === "evening" && hour < 18) return false;
      }

      // Ocultar completamente clases que ya comenzaron o ya pasaron
      if (hasShiftStarted(s.date, s.startTime)) {
        return false;
      }

      // Filtro por disciplina
      if (disciplineFilter !== "all" && s.discipline !== disciplineFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [shifts, searchTerm, timeFilter, disciplineFilter]);

  return (
    <div className="space-y-6">
      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por hora (ej. 09:00, 13:00), instructor o disciplina..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Discipline selector */}
          {availableDisciplines.length > 1 && (
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">Todas las disciplinas</option>
              {availableDisciplines.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Time slot filter pills */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 w-full sm:w-auto text-center sm:text-left">
            Horario:
          </span>

          <button
            type="button"
            onClick={() => setTimeFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === "all"
                ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Todos ({isLoading ? "..." : shifts.length})
          </button>

          <button
            type="button"
            onClick={() => setTimeFilter("morning")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              timeFilter === "morning"
                ? "bg-amber-500 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Mañana (07:00 - 12:00)</span>
          </button>

          <button
            type="button"
            onClick={() => setTimeFilter("afternoon")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              timeFilter === "afternoon"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Sunset className="w-3.5 h-3.5" />
            <span>Tarde (13:00 - 17:00)</span>
          </button>

          <button
            type="button"
            onClick={() => setTimeFilter("evening")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              timeFilter === "evening"
                ? "bg-slate-800 text-white dark:bg-indigo-800 shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Noche (18:00 - 21:00)</span>
          </button>
        </div>
      </div>

      {/* Shifts Cards Grid or Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando clases disponibles para este día...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xs animate-pulse space-y-4"
              >
                <div>
                  {/* Skeleton Time Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                        <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>

                  {/* Skeleton Title & Level */}
                  <div className="space-y-2">
                    <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                  </div>

                  {/* Skeleton Instructor & Location */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    </div>
                    <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                  </div>

                  {/* Skeleton Capacity indicator */}
                  <div className="mt-3 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                </div>

                {/* Skeleton Bottom Row */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                    <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                  <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center my-6">
          <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No hay clases disponibles para los filtros seleccionados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prueba seleccionando otra fecha, franja horaria o disciplina.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShifts.map((shift) => {
            const hasStarted = hasShiftStarted(shift.date, shift.startTime);
            const isFull = shift.bookedCount >= shift.capacity;
            const availableCount = Math.max(0, shift.capacity - shift.bookedCount);
            const isBlocked = isFull || hasStarted;

            return (
              <div
                key={shift.id}
                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden transition-all shadow-xs hover:shadow-md ${
                  isBlocked
                    ? "opacity-60 bg-slate-50 dark:bg-slate-950"
                    : "hover:border-indigo-400 dark:hover:border-indigo-700"
                }`}
              >
                <div>
                  {/* Destacado Principal: HORARIO GIGANTE Y CLARO */}
                  <div className="flex items-center justify-between gap-2 mb-3 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-2xs ${
                        hasStarted
                          ? "bg-slate-500 text-white"
                          : "bg-indigo-600 text-white"
                      }`}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                          {shift.startTime} - {shift.endTime} hs
                        </div>
                        <span className={`text-[10px] uppercase font-bold ${
                          hasStarted ? "text-slate-500" : "text-indigo-600 dark:text-indigo-400"
                        }`}>
                          {hasStarted ? "Clase iniciada" : "Horario de clase"}
                        </span>
                      </div>
                    </div>

                    <DisciplineBadge discipline={shift.discipline} size="sm" />
                  </div>

                  {/* Title & Level */}
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                    {shift.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-semibold">
                    <span>Nivel: {shift.level}</span>
                  </div>

                  {/* Instructor & Location */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                        {shift.instructorName.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Prof. {shift.instructorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">Cesar Diaz 3031, CABA • {shift.room}</span>
                    </div>
                  </div>

                  {/* Capacity indicator */}
                  <div className="mt-3 py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px] font-medium">Estado:</span>
                    <span
                      className={`font-black text-xs ${
                        hasStarted
                          ? "text-slate-500 dark:text-slate-400"
                          : isFull
                          ? "text-rose-600"
                          : availableCount <= 2
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {hasStarted
                        ? "Horario pasado / Clase ya iniciada"
                        : isFull
                        ? "Sin cupo disponible"
                        : `${availableCount} lugares disponibles (${shift.bookedCount}/${shift.capacity})`}
                    </span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => !isBlocked && onSelectShift(shift)}
                    disabled={isBlocked}
                    type="button"
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      isBlocked
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                        : "btn-primary shadow-xs"
                    }`}
                  >
                    {hasStarted ? "Ya Comenzó" : isFull ? "Agotado" : "Reservar Clase"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
