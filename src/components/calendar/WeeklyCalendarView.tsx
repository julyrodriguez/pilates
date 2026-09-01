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
  CalendarDays,
  UserPlus,
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
];

function getInitialDayKey(): string {
  const d = new Date();
  const day = d.getDay();
  if (day === 0 || day === 6) {
    return formatDateKey(getMonday(d));
  }
  return formatDateKey(d);
}

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
  // Predeterminada: Agenda por día
  const [viewMode, setViewMode] = useState<"daily_agenda" | "weekly_board">("daily_agenda");
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getInitialDayKey);
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>("all");
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>("all");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayStr = useMemo(() => formatDateKey(new Date()), []);

  // 5 días de la semana laboral (Lunes a Viernes)
  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
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

  // Día activo seleccionado
  const activeDayObj = useMemo(() => {
    return weekDays.find((d) => d.dateKey === selectedDayKey) || weekDays[0];
  }, [weekDays, selectedDayKey]);

  // Rango de la semana
  const weekRangeTitle = useMemo(() => {
    if (weekDays.length === 0) return "";
    const firstDay = weekDays[0];
    const lastDay = weekDays[weekDays.length - 1];

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
    setSelectedDayKey(getInitialDayKey());
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: "smooth" });
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

  // Mapa de alumnos inscriptos por shiftId
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

  // 1. CARD COMPACTA PARA EL TABLERO SEMANAL (Para ver capacidad a simple vista y permitir muchas clases)
  const renderCompactClassCard = (shift: Shift) => {
    const isFull = shift.bookedCount >= shift.capacity;
    const isAlmostFull = !isFull && shift.bookedCount >= shift.capacity - 2 && shift.capacity > 2;
    const availableCount = Math.max(0, shift.capacity - shift.bookedCount);
    const occupancyPct = Math.round((shift.bookedCount / shift.capacity) * 100);

    return (
      <div
        key={shift.id}
        className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-2xs hover:shadow-md relative overflow-hidden group ${
          isFull
            ? "border-rose-200 dark:border-rose-950/70"
            : isAlmostFull
            ? "border-amber-200 dark:border-amber-950/70"
            : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800"
        }`}
      >
        {/* Left Status Bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            isFull
              ? "bg-rose-500"
              : isAlmostFull
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
        />

        <div className="pl-1.5 space-y-2">
          {/* Row 1: Time, Discipline & Level */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 font-black text-xs text-slate-900 dark:text-slate-100">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{shift.startTime} - {shift.endTime}</span>
            </div>
            <DisciplineBadge discipline={shift.discipline} size="sm" />
          </div>

          {/* Row 2: Title & Instructor */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {shift.title}
            </h4>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between mt-0.5">
              <span className="truncate max-w-[140px]">Prof. {shift.instructorName}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">${shift.price.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Row 3: Visual Capacity Bar & Quick Badge */}
          <div className="space-y-1">
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
                {isFull ? "Completo" : `${availableCount} libres`} ({shift.bookedCount}/{shift.capacity})
              </span>
              <span className="text-slate-400 text-[9px]">{occupancyPct}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? "bg-rose-500" : isAlmostFull ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(occupancyPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Row 4: Actions toolbar */}
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onViewAttendees(shift)}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold flex items-center gap-1"
                title="Ver alumnos inscriptos"
              >
                <Users className="w-3 h-3" />
                <span>{shift.bookedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onBookClient(shift)}
                disabled={isFull}
                className="px-2 py-1 rounded-lg text-[10px] font-bold btn-primary disabled:opacity-40"
              >
                + Anotar
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
      </div>
    );
  };

  // 2. CARD DETALLADA PARA LA AGENDA DEL DÍA
  const renderDetailedClassCard = (shift: Shift) => {
    const shiftAttendees = attendeesByShiftId[shift.id] || [];
    const isFull = shift.bookedCount >= shift.capacity;
    const isAlmostFull = !isFull && shift.bookedCount >= shift.capacity - 2 && shift.capacity > 2;
    const availableCount = Math.max(0, shift.capacity - shift.bookedCount);
    const occupancyPct = Math.round((shift.bookedCount / shift.capacity) * 100);

    return (
      <div
        key={shift.id}
        className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-xs hover:shadow-md relative overflow-hidden group ${
          isFull
            ? "border-rose-200 dark:border-rose-950/60"
            : isAlmostFull
            ? "border-amber-200 dark:border-amber-950/60"
            : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800"
        }`}
      >
        {/* Left Accent Stripe */}
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
          {/* Top Row: Time, Discipline & Level */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-indigo-300 dark:text-white" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {shift.level}
              </span>
            </div>

            <DisciplineBadge discipline={shift.discipline} size="md" />
          </div>

          {/* Title, Instructor and Room */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{shift.room}</span>
              </div>
            </div>
          </div>

          {/* Visual Bed Slots */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 text-xs">
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
              <span className="text-xs font-bold text-slate-500">
                {shift.bookedCount}/{shift.capacity} ({occupancyPct}%)
              </span>
            </div>

            {/* Visual Bed Pills */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
              {Array.from({ length: shift.capacity }).map((_, slotIdx) => {
                const attendee = shiftAttendees[slotIdx];
                const isOccupied = slotIdx < shift.bookedCount;

                return (
                  <div
                    key={slotIdx}
                    title={attendee ? `Ocupado por: ${attendee.clientName}` : `Cama ${slotIdx + 1} libre`}
                    className={`h-7 rounded-xl text-[10px] font-bold flex items-center justify-center transition-all ${
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
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] text-slate-500">
                <span className="font-bold text-slate-600 dark:text-slate-400 mr-1.5">Inscriptos:</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {shiftAttendees.map((a) => a.clientName).join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Footer Actions & Price */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:block">
              <span className="text-[10px] text-slate-400 block font-medium">Arancel por clase</span>
              <span className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                ${shift.price.toLocaleString("es-AR")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => onViewAttendees(shift)}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                title="Ver lista detallada de alumnos"
              >
                <Users className="w-4 h-4" />
                <span>{shift.bookedCount} Alumnos</span>
              </button>

              <button
                type="button"
                onClick={() => onBookClient(shift)}
                disabled={isFull}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold btn-primary disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Inscribir</span>
              </button>

              <button
                type="button"
                onClick={() => onEditShift(shift)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Editar clase"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteShift(shift.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Eliminar clase"
              >
                <Trash2 className="w-4 h-4" />
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
          {/* Week Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center justify-between sm:justify-start bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shrink-0">
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
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all"
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

            <div className="min-w-0">
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{weekRangeTitle}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                <span className="font-bold text-slate-800 dark:text-slate-200">{totalWeekShifts} clases</span>
                <span>•</span>
                <span>{totalWeekBooked}/{totalWeekCapacity} camas ocupadas</span>
                <span>•</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{weekOccupancyRate}% ocupación</span>
              </div>
            </div>
          </div>

          {/* Toggle Mode & Filters & New Class */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("daily_agenda")}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  viewMode === "daily_agenda"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Agenda por Día</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("weekly_board")}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  viewMode === "weekly_board"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tablero Semanal</span>
              </button>
            </div>

            {/* Discipline Dropdown */}
            <select
              value={selectedDisciplineFilter}
              onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
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
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Clase</span>
            </button>
          </div>
        </div>

        {/* Full-Width 5-Days Filter Grid (Lunes a Viernes) */}
        <div className="mt-4 sm:mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 w-full">
            {weekDays.map((d) => {
              const dayCount = (shiftsByDate[d.dateKey] || []).length;
              const isSelected = d.dateKey === selectedDayKey;

              return (
                <button
                  key={d.dateKey}
                  type="button"
                  onClick={() => setSelectedDayKey(d.dateKey)}
                  className={`w-full py-2 sm:py-3 px-1.5 sm:px-3 rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-1 sm:gap-1.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40"
                      : d.isToday
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[9px] sm:text-[11px] uppercase tracking-wider font-extrabold opacity-80 truncate">
                      <span className="sm:hidden">{d.dayShort}</span>
                      <span className="hidden sm:inline">{d.dayFull}</span>
                    </span>
                    <span className="text-xs sm:text-sm font-black block mt-0.5">
                      {d.dayNumber} <span className="hidden sm:inline">{d.monthName.substring(0, 3)}</span>
                    </span>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-black shrink-0 ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {dayCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIEW: AGENDA POR DÍA (Predeterminada) */}
      {viewMode === "daily_agenda" && (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
          {/* Day Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-5 mb-5 sm:mb-6 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Agenda del Día
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {activeDayObj.dayFull} {activeDayObj.dayNumber} de {activeDayObj.monthName} {activeDayObj.year}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {(shiftsByDate[activeDayObj.dateKey] || []).length} clases programadas
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNewShift(activeDayObj.dateKey)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Clase en {activeDayObj.dayShort}</span>
            </button>
          </div>

          {/* Classes Grid */}
          {(shiftsByDate[activeDayObj.dateKey] || []).length === 0 ? (
            <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center">
              <Clock className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay clases programadas para este {activeDayObj.dayFull}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Puedes programar una clase puntual o crear horarios recurrentes para todos los {activeDayObj.dayFull}s.
              </p>
              <button
                type="button"
                onClick={() => onNewShift(activeDayObj.dateKey)}
                className="mt-4 px-4 py-2 text-xs font-bold btn-primary"
              >
                + Programar Clase
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {(shiftsByDate[activeDayObj.dateKey] || []).map((shift) => renderDetailedClassCard(shift))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: TABLERO SEMANAL CON CARDS COMPACTAS */}
      {viewMode === "weekly_board" && (
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto pb-6 scrollbar-thin scroll-smooth"
        >
          <div className="flex gap-4 min-w-max items-start">
            {weekDays.map((day) => {
              const dayShifts = shiftsByDate[day.dateKey] || [];
              const isToday = day.isToday;

              return (
                <div
                  key={day.dateKey}
                  className={`w-[320px] sm:w-[340px] xl:w-[350px] rounded-3xl border transition-all flex flex-col min-h-[650px] shrink-0 ${
                    isToday
                      ? "bg-slate-50/60 dark:bg-slate-900/60 border-indigo-400 dark:border-indigo-700 shadow-md ring-2 ring-indigo-400/20"
                      : "bg-slate-50/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-xs"
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`p-3.5 border-b rounded-t-3xl flex items-center justify-between sticky top-0 z-10 ${
                      isToday
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
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
                        <div className={`text-[11px] font-semibold ${isToday ? "text-indigo-200" : "text-slate-400"}`}>
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
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-600"
                      }`}
                      title={`Agregar clase el ${day.dayFull}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Compact Classes List (Entran muchas clases por día) */}
                  <div className="p-3 flex-1 space-y-2.5 overflow-y-auto max-h-[800px]">
                    {dayShifts.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                        <Clock className="w-8 h-8 opacity-40 mb-2" />
                        <span className="text-xs font-bold text-slate-500">Sin clases</span>
                        <button
                          type="button"
                          onClick={() => onNewShift(day.dateKey)}
                          className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                        >
                          + Programar
                        </button>
                      </div>
                    ) : (
                      dayShifts.map((shift) => renderCompactClassCard(shift))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
