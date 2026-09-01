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
  MoreVertical,
  Filter,
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
  const [mobileMenuShiftId, setMobileMenuShiftId] = useState<string | null>(null);

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

  // Auto-scroll al día de hoy en la vista de Tablero Semanal
  React.useEffect(() => {
    if (viewMode === "weekly_board" && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        if (!scrollContainerRef.current) return;
        const todayEl = scrollContainerRef.current.querySelector('[data-is-today="true"]');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [viewMode, currentMonday]);

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

  // 2. CARD DETALLADA PARA LA AGENDA DEL DÍA (Versión limpia en Mobile, Completa en Desktop)
  const renderDetailedClassCard = (shift: Shift) => {
    const shiftAttendees = attendeesByShiftId[shift.id] || [];
    const isFull = shift.bookedCount >= shift.capacity;
    const isAlmostFull = !isFull && shift.bookedCount >= shift.capacity - 2 && shift.capacity > 2;
    const availableCount = Math.max(0, shift.capacity - shift.bookedCount);
    const occupancyPct = Math.round((shift.bookedCount / shift.capacity) * 100);
    const isMenuOpen = mobileMenuShiftId === shift.id;

    return (
      <div
        key={shift.id}
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-xs hover:shadow-md relative overflow-visible group ${
          isFull
            ? "border-rose-200 dark:border-rose-950/60"
            : isAlmostFull
            ? "border-amber-200 dark:border-amber-950/60"
            : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800"
        }`}
      >
        {/* Left Accent Stripe */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl sm:rounded-l-3xl ${
            isFull
              ? "bg-rose-500"
              : isAlmostFull
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
        />

        {/* ========================================================= */}
        {/* VISTA MÓVIL (< 1024px): Ultra Limpia, Ágil y Sin Saturación */}
        {/* ========================================================= */}
        <div className="pl-1.5 space-y-3 lg:hidden">
          {/* Fila 1: Horario + Disciplina + Menú ... */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 font-black text-xs flex items-center gap-1 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-indigo-300 dark:text-white" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>
              <DisciplineBadge discipline={shift.discipline} size="sm" />
            </div>

            {/* Menú de 3 puntitos para acciones secundarias en Mobile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMobileMenuShiftId(isMenuOpen ? null : shift.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Opciones"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMobileMenuShiftId(null)}
                  />
                  <div className="absolute right-0 top-8 z-30 w-36 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuShiftId(null);
                        onEditShift(shift);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Clase</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuShiftId(null);
                        onDeleteShift(shift.id);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Fila 2: Título + Profesor y Arancel */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {shift.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Prof. <strong className="text-slate-700 dark:text-slate-300 font-semibold">{shift.instructorName}</strong></span>
              <span className="font-bold text-slate-800 dark:text-slate-200">${shift.price.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Fila 3: Aforo y Acciones Rápidas */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isFull ? "bg-rose-500" : isAlmostFull ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span
                className={
                  isFull
                    ? "text-rose-600 dark:text-rose-400"
                    : isAlmostFull
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {isFull ? "Completo" : `${availableCount} libres`}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">({shift.bookedCount}/{shift.capacity})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onViewAttendees(shift)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-200"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{shift.bookedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onBookClient(shift)}
                disabled={isFull}
                className="px-3 py-1.5 rounded-xl text-xs font-bold btn-primary disabled:opacity-40 flex items-center gap-1 shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Inscribir</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VISTA DESKTOP (>= 1024px): Vista Extendida con Camas y Todo */}
        {/* ========================================================= */}
        <div className="pl-2 space-y-3.5 hidden lg:block">
          {/* Top Row: Time, Discipline, Level & Management Actions (Edit/Delete) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-indigo-300 dark:text-white" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>
              <DisciplineBadge discipline={shift.discipline} size="md" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {shift.level}
              </span>
            </div>

            {/* Acciones de gestión de clase: Editar y Borrar (perfectamente contenidas) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEditShift(shift)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Editar clase"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteShift(shift.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Eliminar clase"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Arancel por clase</span>
              <span className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                ${shift.price.toLocaleString("es-AR")}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onViewAttendees(shift)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Ver lista detallada de alumnos"
              >
                <Users className="w-4 h-4" />
                <span>{shift.bookedCount} Alumnos</span>
              </button>

              <button
                type="button"
                onClick={() => onBookClient(shift)}
                disabled={isFull}
                className="px-4 py-2 rounded-xl text-xs font-bold btn-primary disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Inscribir</span>
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
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Main Row: Week Navigation + View Mode + Desktop Filters + New Class */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Week Navigation & Summary */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleTodayWeek}
                className="px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{weekRangeTitle}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                <span className="font-bold text-slate-800 dark:text-slate-200">{totalWeekShifts} clases</span>
                <span>•</span>
                <span>{totalWeekBooked}/{totalWeekCapacity} camas</span>
                <span>•</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{weekOccupancyRate}% ocupación</span>
              </div>
            </div>
          </div>

          {/* Right: Controls & Filters */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
            {/* View Mode Toggle (Daily Agenda vs Weekly Board - Ancho completo en Mobile) */}
            <div className="w-full sm:w-auto flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setViewMode("daily_agenda")}
                className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "daily_agenda"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("weekly_board")}
                className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "weekly_board"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tablero</span>
              </button>
            </div>

            {/* Desktop-Only Filters: Disciplines & Instructors (>= 1024px) */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedDisciplineFilter}
                  onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">Todas las Disciplinas</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.slug || d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  value={selectedInstructorFilter}
                  onChange={(e) => setSelectedInstructorFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">Todos los Instructores</option>
                  {instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* New Class Button (Visible in weekly board) */}
            {viewMode === "weekly_board" && (
              <button
                type="button"
                onClick={() => onNewShift(selectedDayKey)}
                className="w-full sm:w-auto px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold btn-primary flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Clase</span>
              </button>
            )}
          </div>
        </div>

        {/* 5-Days Selector (SOLO SE MUESTRA EN AGENDA DIARIA, OCULTO EN TABLERO SEMANAL) */}
        {viewMode === "daily_agenda" && (
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="flex sm:grid sm:grid-cols-5 gap-1.5 sm:gap-2.5 w-full overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x">
              {weekDays.map((d) => {
                const dayCount = (shiftsByDate[d.dateKey] || []).length;
                const isSelected = d.dateKey === selectedDayKey;

                return (
                  <div
                    key={d.dateKey}
                    onClick={() => setSelectedDayKey(d.dateKey)}
                    className={`min-w-[62px] sm:min-w-0 snap-start flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-1 sm:gap-2 shrink-0 sm:shrink cursor-pointer group/day ${
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
                        {d.dayNumber} <span className="hidden sm:inline text-xs font-bold opacity-85">{d.monthName.substring(0, 3)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {dayCount}
                      </span>

                      {/* Botón "+ Clase" integrado en la card del día (Versión Escritorio) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayKey(d.dateKey);
                          onNewShift(d.dateKey);
                        }}
                        title={`Crear clase el ${d.dayFull}`}
                        className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all shadow-2xs cursor-pointer ${
                          isSelected
                            ? "bg-white text-indigo-600 hover:bg-indigo-50"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Clase</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* VIEW: AGENDA POR DÍA (Predeterminada) */}
      {viewMode === "daily_agenda" && (
        <div className="w-full">
          {/* Mobile Action: Botón arriba de la primera card de clase */}
          <div className="sm:hidden mb-3">
            <button
              type="button"
              onClick={() => onNewShift(activeDayObj.dateKey)}
              className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold btn-primary flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Clase en {activeDayObj.dayShort}</span>
            </button>
          </div>

          {/* Classes Grid */}
          {(shiftsByDate[activeDayObj.dateKey] || []).length === 0 ? (
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center text-slate-400 flex flex-col items-center justify-center shadow-xs">
              <Clock className="w-12 h-12 mb-3 opacity-40 text-indigo-500" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay clases programadas para este {activeDayObj.dayFull}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Puedes programar una clase puntual o crear horarios recurrentes para todos los {activeDayObj.dayFull}s.
              </p>
              <button
                type="button"
                onClick={() => onNewShift(activeDayObj.dateKey)}
                className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Programar Clase en {activeDayObj.dayShort}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
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
                  data-is-today={isToday ? "true" : "false"}
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
