"use client";

import React, { useState, useMemo } from "react";
import { Shift, Instructor, DisciplineType } from "@/types";
import { useData } from "@/context/DataContext";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  MapPin,
  Flame,
  BookmarkPlus,
  SlidersHorizontal,
  Layers,
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

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
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

const DAY_NAMES = [
  { short: "Lun", full: "Lunes" },
  { short: "Mar", full: "Martes" },
  { short: "Mié", full: "Miércoles" },
  { short: "Jue", full: "Jueves" },
  { short: "Vie", full: "Viernes" },
  { short: "Sáb", full: "Sábado" },
  { short: "Dom", full: "Domingo" },
];

export function WeeklyCalendarView({
  shifts,
  instructors,
  onNewShift,
  onEditShift,
  onDeleteShift,
  onBookClient,
  onViewAttendees,
}: WeeklyCalendarViewProps) {
  const { disciplines } = useData();
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>("all");
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>("all");

  const todayStr = useMemo(() => formatDateKey(new Date()), []);

  // 7 días de la semana
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentMonday);
      date.setDate(currentMonday.getDate() + i);
      const dateKey = formatDateKey(date);
      return {
        date,
        dateKey,
        dayShort: DAY_NAMES[i].short,
        dayFull: DAY_NAMES[i].full,
        dayNumber: date.getDate(),
        monthName: MONTH_NAMES[date.getMonth()],
        year: date.getFullYear(),
        isToday: dateKey === todayStr,
      };
    });
  }, [currentMonday, todayStr]);

  // Título del rango
  const weekRangeTitle = useMemo(() => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];

    if (firstDay.date.getMonth() === lastDay.date.getMonth()) {
      return `${firstDay.dayNumber} - ${lastDay.dayNumber} de ${firstDay.monthName} ${firstDay.year}`;
    }
    return `${firstDay.dayNumber} ${firstDay.monthName} - ${lastDay.dayNumber} ${lastDay.monthName} ${lastDay.year}`;
  }, [weekDays]);

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

  // Filtrar clases
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

  // Agrupar por día
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

    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [filteredShifts, weekDays]);

  const totalWeekShifts = useMemo(() => {
    return Object.values(shiftsByDate).reduce((acc, list) => acc + list.length, 0);
  }, [shiftsByDate]);

  const totalBookedSeats = useMemo(() => {
    return Object.values(shiftsByDate)
      .flat()
      .reduce((acc, s) => acc + s.bookedCount, 0);
  }, [shiftsByDate]);

  const totalAvailableSeats = useMemo(() => {
    return Object.values(shiftsByDate)
      .flat()
      .reduce((acc, s) => acc + s.capacity, 0);
  }, [shiftsByDate]);

  return (
    <div className="space-y-4">
      {/* Top Bar Header & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Week Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleTodayWeek}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{weekRangeTitle}</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                <span>{totalWeekShifts} clases</span>
                <span>•</span>
                <span>{totalBookedSeats}/{totalAvailableSeats} alumnos ocupados</span>
              </div>
            </div>
          </div>

          {/* Filters & Action Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Discipline Dropdown */}
            <select
              value={selectedDisciplineFilter}
              onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todas las Disciplinas</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.slug || d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Instructor Dropdown */}
            <select
              value={selectedInstructorFilter}
              onChange={(e) => setSelectedInstructorFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todos los Instructores</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => onNewShift()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Clase</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Weekly Board */}
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1200px] items-start">
          {weekDays.map((day) => {
            const dayShifts = shiftsByDate[day.dateKey] || [];
            const isToday = day.isToday;

            return (
              <div
                key={day.dateKey}
                className={`flex-1 min-w-[240px] max-w-[320px] rounded-3xl border transition-all flex flex-col min-h-[600px] ${
                  isToday
                    ? "bg-slate-50/70 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 shadow-md ring-1 ring-indigo-400/30"
                    : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800/90 shadow-xs"
                }`}
              >
                {/* Column Header */}
                <div
                  className={`p-4 border-b rounded-t-3xl flex items-center justify-between sticky top-0 z-10 backdrop-blur-md ${
                    isToday
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-50/90 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-black text-base shadow-xs ${
                        isToday
                          ? "bg-white text-indigo-600"
                          : "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      <span>{day.dayNumber}</span>
                    </div>
                    <div>
                      <div className={`text-xs font-black uppercase tracking-wider ${isToday ? "text-indigo-100" : "text-slate-800 dark:text-slate-200"}`}>
                        {day.dayFull}
                      </div>
                      <div className={`text-[11px] font-semibold ${isToday ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"}`}>
                        {dayShifts.length} {dayShifts.length === 1 ? "clase" : "clases"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNewShift(day.dateKey)}
                    className={`p-1.5 rounded-xl transition-all ${
                      isToday
                        ? "bg-white/20 hover:bg-white/30 text-white"
                        : "bg-slate-200/60 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 text-slate-500"
                    }`}
                    title={`Agregar clase el ${day.dayFull} ${day.dayNumber}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Day Shifts List */}
                <div className="p-3 flex-1 space-y-3 overflow-y-auto max-h-[750px]">
                  {dayShifts.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 mb-2">
                        <Clock className="w-5 h-5 opacity-60" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sin clases</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Día libre o sin horarios</p>
                      <button
                        type="button"
                        onClick={() => onNewShift(day.dateKey)}
                        className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors"
                      >
                        + Programar
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
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all space-y-3 group relative overflow-hidden"
                        >
                          {/* Left Discipline Color Stripe */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              isFull
                                ? "bg-rose-500"
                                : isAlmostFull
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            }`}
                          />

                          {/* Top: Time & Badge */}
                          <div className="flex items-center justify-between gap-1 pl-1">
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
                              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span>{shift.startTime} - {shift.endTime}</span>
                            </div>
                            <DisciplineBadge discipline={shift.discipline} size="sm" />
                          </div>

                          {/* Title & Instructor */}
                          <div className="pl-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {shift.title}
                            </h4>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                              <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-black flex items-center justify-center shrink-0">
                                {shift.instructorName.charAt(0)}
                              </div>
                              <span className="truncate font-medium">{shift.instructorName}</span>
                            </div>
                          </div>

                          {/* Room & Price */}
                          <div className="pl-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="truncate max-w-[110px]">{shift.room}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              ${shift.price.toLocaleString("es-AR")}
                            </span>
                          </div>

                          {/* Occupancy Status */}
                          <div className="pl-1 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span
                                className={
                                  isFull
                                    ? "text-rose-600 dark:text-rose-400"
                                    : isAlmostFull
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }
                              >
                                {isFull ? "Completo" : isAlmostFull ? "Últimos lugares" : "Cupos libres"} ({shift.bookedCount}/{shift.capacity})
                              </span>
                              <span className="text-slate-400">{occupancyPct}%</span>
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

                          {/* Card Footer Actions */}
                          <div className="pl-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onViewAttendees(shift)}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                title="Ver lista de alumnos"
                              >
                                <Users className="w-3 h-3" />
                                <span>{shift.bookedCount}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onBookClient(shift)}
                                disabled={isFull}
                                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors"
                                title="Inscribir alumno"
                              >
                                + Alumno
                              </button>
                            </div>

                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => onEditShift(shift)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Editar clase"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteShift(shift.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                title="Eliminar clase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
