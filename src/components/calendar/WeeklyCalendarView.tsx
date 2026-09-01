"use client";

import React, { useState, useMemo } from "react";
import { Shift, Instructor, DisciplineType } from "@/types";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Users,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Sparkles,
  MapPin,
  Flame,
} from "lucide-react";

interface WeeklyCalendarViewProps {
  shifts: Shift[];
  instructors: Instructor[];
  onNewShift: (preselectedDate?: string) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
  onBookClient: (shift: Shift) => void;
  onViewAttendees: (shift: Shift) => void;
}

// Helpers para fechas semanales (Lunes a Domingo)
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // ajustar si es domingo
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function WeeklyCalendarView({
  shifts,
  instructors,
  onNewShift,
  onEditShift,
  onDeleteShift,
  onBookClient,
  onViewAttendees,
}: WeeklyCalendarViewProps) {
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>("all");
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>("all");

  const todayStr = useMemo(() => formatDateKey(new Date()), []);

  // Generar los 7 días de la semana actual
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentMonday);
      date.setDate(currentMonday.getDate() + i);
      const dateKey = formatDateKey(date);
      return {
        date,
        dateKey,
        dayName: DAY_NAMES[i],
        dayNumber: date.getDate(),
        monthName: MONTH_NAMES[date.getMonth()],
        isToday: dateKey === todayStr,
      };
    });
  }, [currentMonday, todayStr]);

  // Texto del rango semanal
  const weekRangeTitle = useMemo(() => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];

    if (firstDay.date.getMonth() === lastDay.date.getMonth()) {
      return `${firstDay.dayNumber} al ${lastDay.dayNumber} de ${firstDay.monthName} ${firstDay.date.getFullYear()}`;
    }
    return `${firstDay.dayNumber} de ${firstDay.monthName} al ${lastDay.dayNumber} de ${lastDay.monthName} ${lastDay.date.getFullYear()}`;
  }, [weekDays]);

  // Navegación
  const handlePrevWeek = () => {
    setCurrentMonday((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleTodayWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Filtrado de turnos
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (selectedInstructorFilter !== "all" && s.instructorId !== selectedInstructorFilter) {
        return false;
      }
      if (selectedDisciplineFilter !== "all" && s.discipline !== selectedDisciplineFilter) {
        return false;
      }
      return true;
    });
  }, [shifts, selectedInstructorFilter, selectedDisciplineFilter]);

  // Agrupar clases por día de la semana
  const shiftsByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    weekDays.forEach((w) => {
      map[w.dateKey] = [];
    });

    filteredShifts.forEach((s) => {
      if (map[s.date]) {
        map[s.date].push(s);
      }
    });

    // Ordenar por hora de inicio
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [filteredShifts, weekDays]);

  const totalWeekShifts = useMemo(() => {
    return Object.values(shiftsByDate).reduce((acc, list) => acc + list.length, 0);
  }, [shiftsByDate]);

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Navigation & Title */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-all"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleTodayWeek}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-all"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{weekRangeTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalWeekShifts} clases programadas esta semana
            </p>
          </div>
        </div>

        {/* Filters and New Class Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Instructor Filter */}
          <select
            value={selectedInstructorFilter}
            onChange={(e) => setSelectedInstructorFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="all">Todos los Instructores</option>
            {instructors.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>

          {/* New Class Button */}
          <button
            type="button"
            onClick={() => onNewShift(formatDateKey(new Date()))}
            className="px-4 py-2 rounded-xl text-xs font-bold btn-primary flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Clase</span>
          </button>
        </div>
      </div>

      {/* 7-Day Weekly Grid with Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-start">
        {weekDays.map((day) => {
          const dayShifts = shiftsByDate[day.dateKey] || [];
          const isToday = day.isToday;

          return (
            <div
              key={day.dateKey}
              className={`rounded-3xl border transition-all flex flex-col min-h-[500px] ${
                isToday
                  ? "bg-indigo-500/5 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 shadow-md ring-1 ring-indigo-400/30"
                  : "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 shadow-xs"
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3.5 border-b rounded-t-3xl flex items-center justify-between ${
                  isToday
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-50/80 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wider ${isToday ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"}`}>
                    {day.dayName}
                  </div>
                  <div className={`text-lg font-black leading-tight ${isToday ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                    {day.dayNumber}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isToday
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                    title={`${dayShifts.length} clases`}
                  >
                    {dayShifts.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNewShift(day.dateKey)}
                    className={`p-1 rounded-lg transition-colors ${
                      isToday
                        ? "hover:bg-white/20 text-white"
                        : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                    title={`Agregar clase el ${day.dayName} ${day.dayNumber}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Class Cards List */}
              <div className="p-2.5 flex-1 space-y-3 overflow-y-auto max-h-[750px]">
                {dayShifts.length === 0 ? (
                  <div className="py-12 px-2 text-center text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center">
                    <Clock className="w-6 h-6 mb-1.5 opacity-40" />
                    <span className="text-[11px] font-medium">Sin clases</span>
                    <button
                      type="button"
                      onClick={() => onNewShift(day.dateKey)}
                      className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      + Programar clase
                    </button>
                  </div>
                ) : (
                  dayShifts.map((shift) => {
                    const occupancyPct = Math.round((shift.bookedCount / shift.capacity) * 100);
                    const isFull = shift.bookedCount >= shift.capacity;
                    const isAlmostFull = !isFull && shift.bookedCount >= shift.capacity - 2 && shift.capacity > 2;

                    return (
                      <div
                        key={shift.id}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all space-y-2.5 group"
                      >
                        {/* Time & Discipline */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 dark:text-slate-100">
                            <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>{shift.startTime} - {shift.endTime}</span>
                          </div>
                          <DisciplineBadge discipline={shift.discipline} size="sm" />
                        </div>

                        {/* Class Title */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {shift.title}
                          </h4>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{shift.instructorName}</span>
                          </div>
                        </div>

                        {/* Room & Price */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[100px]">{shift.room}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            ${shift.price.toLocaleString("es-AR")}
                          </span>
                        </div>

                        {/* Occupancy Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className={isFull ? "text-rose-600" : isAlmostFull ? "text-amber-600" : "text-emerald-600 dark:text-emerald-400"}>
                              {shift.bookedCount}/{shift.capacity} lugares
                            </span>
                            <span className="text-slate-400 text-[9px]">{occupancyPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isFull
                                  ? "bg-rose-500"
                                  : isAlmostFull
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onViewAttendees(shift)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Ver lista de alumnos inscriptos"
                            >
                              <Users className="w-3 h-3" />
                              <span>{shift.bookedCount}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onBookClient(shift)}
                              disabled={isFull}
                              className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors"
                              title="Inscribir alumno manualmente"
                            >
                              + Alumno
                            </button>
                          </div>

                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => onEditShift(shift)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar clase"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteShift(shift.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Eliminar clase"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
