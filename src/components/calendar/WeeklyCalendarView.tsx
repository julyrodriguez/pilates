"use client";

import React, { useState, useMemo, useRef } from "react";
import { Shift, Instructor, Booking } from "@/types";
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
  LayoutGrid,
  ListFilter,
  CheckCircle2,
  CircleDashed,
  ArrowRight,
  UserPlus,
  CalendarDays,
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
  const { disciplines, bookings } = useData();
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [viewMode, setViewMode] = useState<"weekly_board" | "daily_agenda">("weekly_board");
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => formatDateKey(new Date()));
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>("all");
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>("all");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayStr = useMemo(() => formatDateKey(new Date()), []);

  // 7 días de la semana actual
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

  // Si selectedDayKey no está en la semana actual, ajustar al primer día
  const activeDayObj = useMemo(() => {
    return weekDays.find((d) => d.dateKey === selectedDayKey) || weekDays[0];
  }, [weekDays, selectedDayKey]);

  // Rango de la semana
  const weekRangeTitle = useMemo(() => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];

    if (firstDay.date.getMonth() === lastDay.date.getMonth()) {
      return `${firstDay.dayNumber} al ${lastDay.dayNumber} de ${firstDay.monthName} ${firstDay.year}`;
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
    const todayMonday = getMonday(new Date());
    setCurrentMonday(todayMonday);
    setSelectedDayKey(formatDateKey(new Date()));
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -420, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 420, behavior: "smooth" });
    }
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

  // Agrupación de clases por día
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

  // Mapa de alumnos inscriptos por shiftId para acceso instantáneo
  const attendeesByShiftId = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (b.status !== "cancelled") {
        if (!map[b.shiftId]) map[b.shiftId] = [];
        map[b.shiftId].push(b);
      }
    });
    return map;
  }, [bookings]);

  const totalWeekShifts = useMemo(() => {
    return Object.values(shiftsByDate).reduce((acc, list) => acc + list.length, 0);
  }, [shiftsByDate]);

  const totalWeekCapacity = useMemo(() => {
    return Object.values(shiftsByDate).flat().reduce((acc, s) => acc + s.capacity, 0);
  }, [shiftsByDate]);

  const totalWeekBooked = useMemo(() => {
    return Object.values(shiftsByDate).flat().reduce((acc, s) => acc + s.bookedCount, 0);
  }, [shiftsByDate]);

  const weekOccupancyRate = totalWeekCapacity > 0 ? Math.round((totalWeekBooked / totalWeekCapacity) * 100) : 0;

  // Renderizador de tarjeta de clase rica en información
  const renderClassCard = (shift: Shift, isWide: boolean = false) => {
    const shiftAttendees = attendeesByShiftId[shift.id] || [];
    const isFull = shift.bookedCount >= shift.capacity;
    const isAlmostFull = !isFull && shift.bookedCount >= shift.capacity - 2 && shift.capacity > 2;
    const availableCount = Math.max(0, shift.capacity - shift.bookedCount);
    const occupancyPct = Math.round((shift.bookedCount / shift.capacity) * 100);

    return (
      <div
        key={shift.id}
        className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-xs hover:shadow-lg relative overflow-hidden group ${
          isFull
            ? "border-rose-200 dark:border-rose-950/60 bg-gradient-to-br from-white via-white to-rose-50/20 dark:from-slate-900 dark:to-rose-950/10"
            : isAlmostFull
            ? "border-amber-200 dark:border-amber-950/60 bg-gradient-to-br from-white via-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/10"
            : "border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800"
        }`}
      >
        {/* Left Status Accent Bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 ${
            isFull
              ? "bg-rose-500"
              : isAlmostFull
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
        />

        <div className="pl-2 space-y-3.5">
          {/* Top Bar: Time, Discipline Badge & Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-indigo-300 dark:text-white" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {shift.level}
              </span>
            </div>

            <DisciplineBadge discipline={shift.discipline} size="sm" />
          </div>

          {/* Title & Instructor / Room */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
              {shift.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                  {shift.instructorName.charAt(0)}
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {shift.instructorName}
                </span>
              </div>

              <span className="text-slate-300 dark:text-slate-700">•</span>

              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{shift.room}</span>
              </div>
            </div>
          </div>

          {/* Beds / Capacity Interactive Slots Visualizer */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 text-[11px]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isFull ? "bg-rose-500" : isAlmostFull ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                <span className="text-slate-800 dark:text-slate-200">
                  {isFull
                    ? "Aforo Completo"
                    : `${availableCount} ${availableCount === 1 ? "cama libre" : "camas libres"}`}
                </span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {shift.bookedCount}/{shift.capacity} ({occupancyPct}%)
              </span>
            </div>

            {/* Visual Bed Slots (Pills) */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
              {Array.from({ length: shift.capacity }).map((_, slotIdx) => {
                const attendee = shiftAttendees[slotIdx];
                const isOccupied = slotIdx < shift.bookedCount;

                return (
                  <div
                    key={slotIdx}
                    title={attendee ? `Ocupado por: ${attendee.clientName}` : `Cama ${slotIdx + 1} libre`}
                    className={`h-6 rounded-lg text-[9px] font-bold flex items-center justify-center transition-all ${
                      isOccupied
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-slate-200/70 dark:bg-slate-800/80 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {attendee ? attendee.clientName.charAt(0) : slotIdx + 1}
                  </div>
                );
              })}
            </div>

            {/* Quick Attendees Names Preview */}
            {shiftAttendees.length > 0 && (
              <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                <span className="font-bold text-slate-600 dark:text-slate-400">Inscriptos:</span>
                <span className="truncate max-w-[280px]">
                  {shiftAttendees.map((a) => a.clientName).join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Footer Actions & Arancel */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="text-[10px] text-slate-400 block font-medium">Arancel</span>
              <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                ${shift.price.toLocaleString("es-AR")}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onViewAttendees(shift)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Ver lista detallada de alumnos inscriptos"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{shift.bookedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onBookClient(shift)}
                disabled={isFull}
                className="px-3 py-1.5 rounded-xl text-xs font-bold btn-primary disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Inscribir</span>
              </button>

              <button
                type="button"
                onClick={() => onEditShift(shift)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Editar clase"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteShift(shift.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Eliminar clase"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Header Controls (Full Width) */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Week Selector and Title */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleTodayWeek}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs"
                title="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>{weekRangeTitle}</span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                <span className="font-bold text-slate-800 dark:text-slate-200">{totalWeekShifts} clases programadas</span>
                <span>•</span>
                <span>{totalWeekBooked}/{totalWeekCapacity} camas ocupadas</span>
                <span>•</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{weekOccupancyRate}% ocupación global</span>
              </div>
            </div>
          </div>

          {/* View Toggle Mode & Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Tablero Semanal vs Agenda del Día */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("weekly_board")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "weekly_board"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tablero Semanal</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("daily_agenda")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "daily_agenda"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Agenda por Día</span>
              </button>
            </div>

            {/* Discipline Filter */}
            <select
              value={selectedDisciplineFilter}
              onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todas las Disciplinas</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.slug || d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Instructor Filter */}
            <select
              value={selectedInstructorFilter}
              onChange={(e) => setSelectedInstructorFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
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
              onClick={() => onNewShift(selectedDayKey)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Clase</span>
            </button>
          </div>
        </div>

        {/* Quick Days Selector Bar (Interactive Pills) */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Días:
          </span>
          {weekDays.map((d) => {
            const dayCount = (shiftsByDate[d.dateKey] || []).length;
            const isSelected = d.dateKey === selectedDayKey;

            return (
              <button
                key={d.dateKey}
                type="button"
                onClick={() => {
                  setSelectedDayKey(d.dateKey);
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40"
                    : d.isToday
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{d.dayShort} {d.dayNumber}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {dayCount}
                </span>
              </button>
            );
          })}

          {/* Quick Scroll Buttons for Wide Board */}
          {viewMode === "weekly_board" && (
            <div className="ml-auto hidden md:flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={scrollLeft}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                title="Desplazar a la izquierda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                title="Desplazar a la derecha"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: Ultra-Wide Weekly Board with Extra Large Columns */}
      {viewMode === "weekly_board" && (
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto pb-6 scrollbar-thin scroll-smooth"
        >
          <div className="flex gap-5 min-w-max items-start">
            {weekDays.map((day) => {
              const dayShifts = shiftsByDate[day.dateKey] || [];
              const isToday = day.isToday;
              const isSelected = day.dateKey === selectedDayKey;

              return (
                <div
                  key={day.dateKey}
                  className={`w-[360px] sm:w-[390px] xl:w-[410px] rounded-3xl border transition-all flex flex-col min-h-[700px] shrink-0 ${
                    isToday
                      ? "bg-slate-50/60 dark:bg-slate-900/60 border-indigo-400 dark:border-indigo-700 shadow-md ring-2 ring-indigo-400/20"
                      : "bg-slate-50/30 dark:bg-slate-900/30 border-slate-200/90 dark:border-slate-800/90 shadow-xs"
                  }`}
                >
                  {/* Day Column Header */}
                  <div
                    className={`p-4 border-b rounded-t-3xl flex items-center justify-between sticky top-0 z-10 backdrop-blur-md ${
                      isToday
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black text-lg shadow-xs ${
                          isToday
                            ? "bg-white text-indigo-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        <span>{day.dayNumber}</span>
                      </div>
                      <div>
                        <div className={`text-xs font-black uppercase tracking-wider ${isToday ? "text-indigo-100" : "text-slate-800 dark:text-slate-200"}`}>
                          {day.dayFull}
                        </div>
                        <div className={`text-xs font-semibold ${isToday ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"}`}>
                          {dayShifts.length} {dayShifts.length === 1 ? "clase programada" : "clases programadas"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNewShift(day.dateKey)}
                      className={`p-2 rounded-xl transition-all ${
                        isToday
                          ? "bg-white/20 hover:bg-white/30 text-white"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-600"
                      }`}
                      title={`Agregar clase el ${day.dayFull} ${day.dayNumber}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day Classes List */}
                  <div className="p-3.5 flex-1 space-y-3.5 overflow-y-auto max-h-[850px]">
                    {dayShifts.length === 0 ? (
                      <div className="py-24 text-center text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                          <Clock className="w-6 h-6 opacity-60" />
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                          Sin clases este día
                        </span>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                          No hay horarios configurados para este {day.dayFull}.
                        </p>
                        <button
                          type="button"
                          onClick={() => onNewShift(day.dateKey)}
                          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all shadow-2xs"
                        >
                          + Programar Clase
                        </button>
                      </div>
                    ) : (
                      dayShifts.map((shift) => renderClassCard(shift, false))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Daily Detailed Agenda (Full Width Grid for high density of 8+ classes) */}
      {viewMode === "daily_agenda" && (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          {/* Day Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Agenda Completa del Día
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {activeDayObj.dayFull} {activeDayObj.dayNumber} de {activeDayObj.monthName} {activeDayObj.year}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {(shiftsByDate[activeDayObj.dateKey] || []).length} clases en total
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNewShift(activeDayObj.dateKey)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Clase en {activeDayObj.dayShort}</span>
            </button>
          </div>

          {/* List of Classes for the Day in a 2-Column Wide Grid */}
          {(shiftsByDate[activeDayObj.dateKey] || []).length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No hay clases programadas para este {activeDayObj.dayFull}
              </p>
              <button
                type="button"
                onClick={() => onNewShift(activeDayObj.dateKey)}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold btn-primary"
              >
                + Crear primera clase
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {(shiftsByDate[activeDayObj.dateKey] || []).map((shift) => renderClassCard(shift, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
