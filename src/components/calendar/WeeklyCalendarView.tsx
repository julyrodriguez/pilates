"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Shift, Instructor, Booking } from "@/types";
import { useData } from "@/context/DataContext";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
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
  Loader2,
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

type ShiftTimeStatus = "past" | "current" | "future";

function getShiftTimeStatus(dateStr: string, startTimeStr: string, endTimeStr: string): ShiftTimeStatus {
  try {
    const now = new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = (endTimeStr || "").includes(":")
      ? endTimeStr.split(":").map(Number)
      : [startH + 1, startM];

    const start = new Date(year, month - 1, day, startH, startM, 0, 0);
    const end = new Date(year, month - 1, day, endH, endM, 0, 0);

    const nowMs = now.getTime();
    if (nowMs >= start.getTime() && nowMs <= end.getTime()) {
      return "current";
    }
    if (nowMs > end.getTime()) {
      return "past";
    }
    return "future";
  } catch {
    return "future";
  }
}

export function WeeklyCalendarView({
  shifts: propShifts,
  instructors,
  onNewShift,
  onEditShift,
  onDeleteShift,
  onBookClient,
  onViewAttendees,
}: WeeklyCalendarViewProps) {
  const { disciplines, bookings: propBookings } = useData();
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  // Predeterminada: Agenda por día
  const [viewMode, setViewMode] = useState<"daily_agenda" | "weekly_board">("daily_agenda");
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getInitialDayKey);
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>("all");
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>("all");
  const [mobileMenuShiftId, setMobileMenuShiftId] = useState<string | null>(null);

  // Datos obtenidos bajo demanda para Agenda (día) o Tablero (semana)
  const [fetchedShifts, setFetchedShifts] = useState<Shift[]>([]);
  const [fetchedBookings, setFetchedBookings] = useState<Booking[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Caché en memoria para transiciones instantáneas
  const dataCache = useRef<Record<string, { shifts: Shift[]; bookings: Booking[] }>>({});

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

  // =========================================================================
  // CARGA SEGMENTADA EN TIEMPO REAL: Solo el día en Agenda / Toda la semana en Tablero
  // =========================================================================
  useEffect(() => {
    let isMounted = true;
    const db = getFirebaseDb();

    const currentKey =
      viewMode === "daily_agenda"
        ? `day_${selectedDayKey}`
        : `week_${weekDays[0]?.dateKey}_${weekDays[4]?.dateKey}`;

    if (dataCache.current[currentKey]) {
      setFetchedShifts(dataCache.current[currentKey].shifts);
      setFetchedBookings(dataCache.current[currentKey].bookings);
      setIsLoadingData(false);
    } else {
      setIsLoadingData(true);
    }

    if (!db) {
      setFetchedShifts(propShifts);
      setFetchedBookings(propBookings);
      setIsLoadingData(false);
      return;
    }

    const unsubscribes: Array<() => void> = [];

    try {
      if (viewMode === "daily_agenda") {
        // 1. Consulta exclusiva del DÍA seleccionado en Agenda
        const shiftsQuery = query(
          collection(db, "pilates_shifts"),
          where("date", "==", selectedDayKey)
        );
        const unsubShifts = onSnapshot(
          shiftsQuery,
          (snap) => {
            if (!isMounted) return;
            const loaded = snap.docs
              .map((d) => d.data() as Shift)
              .filter((s) => s && s.id && !s.id.startsWith("_"));

            setFetchedShifts(loaded);
            if (!dataCache.current[currentKey]) {
              dataCache.current[currentKey] = { shifts: loaded, bookings: [] };
            } else {
              dataCache.current[currentKey].shifts = loaded;
            }
            setIsLoadingData(false);
          },
          (err) => {
            console.warn("Error fetching day shifts in calendar:", err);
            if (isMounted) setIsLoadingData(false);
          }
        );
        unsubscribes.push(unsubShifts);

        const bookingsQuery = query(
          collection(db, "pilates_bookings"),
          where("shiftDate", "==", selectedDayKey)
        );
        const unsubBookings = onSnapshot(
          bookingsQuery,
          (snap) => {
            if (!isMounted) return;
            const loaded = snap.docs
              .map((d) => d.data() as Booking)
              .filter((b) => b && b.id && !b.id.startsWith("_") && b.shiftId !== "deleted");

            setFetchedBookings(loaded);
            if (!dataCache.current[currentKey]) {
              dataCache.current[currentKey] = { shifts: [], bookings: loaded };
            } else {
              dataCache.current[currentKey].bookings = loaded;
            }
          },
          (err) => console.warn("Error fetching day bookings in calendar:", err)
        );
        unsubscribes.push(unsubBookings);
      } else {
        // 2. Consulta de la SEMANA completa en Tablero
        const mondayStr = weekDays[0]?.dateKey;
        const fridayStr = weekDays[4]?.dateKey;

        if (mondayStr && fridayStr) {
          const shiftsQuery = query(
            collection(db, "pilates_shifts"),
            where("date", ">=", mondayStr),
            where("date", "<=", fridayStr)
          );
          const unsubShifts = onSnapshot(
            shiftsQuery,
            (snap) => {
              if (!isMounted) return;
              const loaded = snap.docs
                .map((d) => d.data() as Shift)
                .filter((s) => s && s.id && !s.id.startsWith("_"));

              setFetchedShifts(loaded);
              if (!dataCache.current[currentKey]) {
                dataCache.current[currentKey] = { shifts: loaded, bookings: [] };
              } else {
                dataCache.current[currentKey].shifts = loaded;
              }
              setIsLoadingData(false);
            },
            (err) => {
              console.warn("Error fetching week shifts in calendar:", err);
              if (isMounted) setIsLoadingData(false);
            }
          );
          unsubscribes.push(unsubShifts);

          const bookingsQuery = query(
            collection(db, "pilates_bookings"),
            where("shiftDate", ">=", mondayStr),
            where("shiftDate", "<=", fridayStr)
          );
          const unsubBookings = onSnapshot(
            bookingsQuery,
            (snap) => {
              if (!isMounted) return;
              const loaded = snap.docs
                .map((d) => d.data() as Booking)
                .filter((b) => b && b.id && !b.id.startsWith("_") && b.shiftId !== "deleted");

              setFetchedBookings(loaded);
              if (!dataCache.current[currentKey]) {
                dataCache.current[currentKey] = { shifts: [], bookings: loaded };
              } else {
                dataCache.current[currentKey].bookings = loaded;
              }
            },
            (err) => console.warn("Error fetching week bookings in calendar:", err)
          );
          unsubscribes.push(unsubBookings);
        }
      }
    } catch (err) {
      console.warn("Firestore subscription error in calendar:", err);
      if (isMounted) setIsLoadingData(false);
    }

    return () => {
      isMounted = false;
      unsubscribes.forEach((u) => u());
    };
  }, [viewMode, selectedDayKey, weekDays, propShifts, propBookings]);

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

  // Filtrado de turnos
  const activeShiftsSource = fetchedShifts.length > 0 || isLoadingData ? fetchedShifts : propShifts;
  const activeBookingsSource = fetchedBookings.length > 0 || isLoadingData ? fetchedBookings : propBookings;

  const filteredShifts = useMemo(() => {
    return activeShiftsSource.filter((s) => {
      if (selectedInstructorFilter !== "all" && s.instructorId !== selectedInstructorFilter) {
        return false;
      }
      if (selectedDisciplineFilter !== "all" && s.discipline !== selectedDisciplineFilter) {
        return false;
      }
      return true;
    });
  }, [activeShiftsSource, selectedInstructorFilter, selectedDisciplineFilter]);

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
    activeBookingsSource.forEach((b) => {
      if (b.status !== "cancelled") {
        if (!map[b.shiftId]) map[b.shiftId] = [];
        map[b.shiftId].push(b);
      }
    });
    return map;
  }, [activeBookingsSource]);

  // Detección de la clase actual (en curso) y la próxima clase de la semana para auto-enfoque
  const { currentShiftId, nextUpcomingShiftId } = useMemo(() => {
    const allShifts = Object.values(shiftsByDate).flat();
    let currentId: string | null = null;
    let nextId: string | null = null;

    const now = new Date();
    let minFutureDiff = Infinity;

    allShifts.forEach((s) => {
      const status = getShiftTimeStatus(s.date, s.startTime, s.endTime);
      if (status === "current" && !currentId) {
        currentId = s.id;
      } else if (status === "future") {
        try {
          const [year, month, day] = s.date.split("-").map(Number);
          const [startH, startM] = s.startTime.split(":").map(Number);
          const shiftDate = new Date(year, month - 1, day, startH, startM, 0, 0);
          const diff = shiftDate.getTime() - now.getTime();
          if (diff > 0 && diff < minFutureDiff) {
            minFutureDiff = diff;
            nextId = s.id;
          }
        } catch {}
      }
    });

    return { currentShiftId: currentId, nextUpcomingShiftId: nextId };
  }, [shiftsByDate]);

  // =========================================================================
  // AUTO-ENFOQUE / SCROLL AUTOMÁTICO EN TABLERO: En la clase en curso o próxima
  // =========================================================================
  useEffect(() => {
    if (viewMode === "weekly_board" && !isLoadingData && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        if (!scrollContainerRef.current) return;
        const currentCard = scrollContainerRef.current.querySelector('[data-focus-target="current"]');
        const nextCard = scrollContainerRef.current.querySelector('[data-focus-target="next"]');
        const todayColumn = scrollContainerRef.current.querySelector('[data-is-today="true"]');

        const target = currentCard || nextCard || todayColumn;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [viewMode, currentMonday, isLoadingData, currentShiftId, nextUpcomingShiftId]);

  // Estadísticas del día seleccionado (para Agenda Diaria)
  const activeDayShifts = useMemo(() => {
    return shiftsByDate[activeDayObj.dateKey] || [];
  }, [shiftsByDate, activeDayObj.dateKey]);

  const totalDayShifts = activeDayShifts.length;
  const totalDayCapacity = activeDayShifts.reduce((acc, s) => acc + s.capacity, 0);
  const totalDayBooked = activeDayShifts.reduce((acc, s) => acc + s.bookedCount, 0);
  const dayOccupancyRate = totalDayCapacity > 0 ? Math.round((totalDayBooked / totalDayCapacity) * 100) : 0;

  // Estadísticas de la semana (para Tablero Semanal)
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

  // =========================================================================
  // 1. CARD COMPACTA PARA EL TABLERO SEMANAL (Con distinción pasada/en vivo/futura)
  // =========================================================================
  const renderCompactClassCard = (shift: Shift) => {
    const timeStatus = getShiftTimeStatus(shift.date, shift.startTime, shift.endTime);
    const isPast = timeStatus === "past";
    const isCurrent = timeStatus === "current" || shift.id === currentShiftId;
    const isNextUpcoming = shift.id === nextUpcomingShiftId;

    const isFull = shift.bookedCount >= shift.capacity;
    const isAlmostFull = !isFull && shift.bookedCount >= shift.capacity - 2 && shift.capacity > 2;
    const availableCount = Math.max(0, shift.capacity - shift.bookedCount);
    const occupancyPct = Math.round((shift.bookedCount / shift.capacity) * 100);

    return (
      <div
        key={shift.id}
        data-focus-target={isCurrent ? "current" : isNextUpcoming ? "next" : undefined}
        className={`p-3 rounded-2xl border transition-all shadow-2xs relative overflow-hidden group ${
          isCurrent
            ? "border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/80 shadow-md ring-2 ring-emerald-400/40"
            : isPast
            ? "opacity-65 bg-slate-100/80 dark:bg-slate-900/40 border-slate-200/90 dark:border-slate-800/80 text-slate-500 grayscale-[35%]"
            : isFull
            ? "bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-950/70 hover:shadow-md"
            : isAlmostFull
            ? "bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-950/70 hover:shadow-md"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md"
        }`}
      >
        {/* Left Status Bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            isCurrent
              ? "bg-emerald-500"
              : isPast
              ? "bg-slate-400 dark:bg-slate-600"
              : isFull
              ? "bg-rose-500"
              : isAlmostFull
              ? "bg-amber-500"
              : "bg-indigo-500"
          }`}
        />

        <div className="pl-1.5 space-y-2">
          {/* Row 1: Time, Status / Live Badge & Discipline */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 font-black text-xs">
              <div
                className={`px-1.5 py-0.5 rounded-lg flex items-center gap-1 ${
                  isCurrent
                    ? "bg-emerald-600 text-white shadow-xs"
                    : isPast
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isCurrent && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center gap-1 shadow-2xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  EN CURSO
                </span>
              )}
              {isPast && (
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  Finalizada
                </span>
              )}
              <DisciplineBadge discipline={shift.discipline} size="sm" />
            </div>
          </div>

          {/* Row 2: Title & Instructor */}
          <div>
            <h4 className={`text-xs font-bold truncate transition-colors ${
              isPast ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            }`}>
              {shift.title}
            </h4>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="truncate">Prof. {shift.instructorName}</span>
            </div>
          </div>

          {/* Row 3: Visual Capacity Bar & Quick Badge */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span
                className={
                  isPast
                    ? "text-slate-500"
                    : isFull
                    ? "text-rose-600 dark:text-rose-400"
                    : isAlmostFull
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {isPast ? "Cupos tomados" : isFull ? "Completo" : `${availableCount} libres`} ({shift.bookedCount}/{shift.capacity})
              </span>
              <span className="text-slate-400 text-[9px]">{occupancyPct}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isPast ? "bg-slate-400 dark:bg-slate-600" : isFull ? "bg-rose-500" : isAlmostFull ? "bg-amber-500" : "bg-emerald-500"
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
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                title="Ver alumnos inscriptos"
              >
                <Users className="w-3 h-3" />
                <span>{shift.bookedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onBookClient(shift)}
                disabled={isFull || isPast}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isPast
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "btn-primary disabled:opacity-40"
                }`}
              >
                + Anotar
              </button>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onEditShift(shift)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Editar clase"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteShift(shift.id)}
                className="p-1 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
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

  // =========================================================================
  // 2. CARD DETALLADA PARA LA AGENDA DEL DÍA (Con distinción pasada/en vivo/futura)
  // =========================================================================
  const renderDetailedClassCard = (shift: Shift) => {
    const shiftAttendees = attendeesByShiftId[shift.id] || [];
    const timeStatus = getShiftTimeStatus(shift.date, shift.startTime, shift.endTime);
    const isPast = timeStatus === "past";
    const isCurrent = timeStatus === "current" || shift.id === currentShiftId;

    const isFull = shift.bookedCount >= shift.capacity;
    const isAlmostFull = !isFull && shift.bookedCount >= shift.capacity - 2 && shift.capacity > 2;
    const availableCount = Math.max(0, shift.capacity - shift.bookedCount);
    const occupancyPct = Math.round((shift.bookedCount / shift.capacity) * 100);
    const isMenuOpen = mobileMenuShiftId === shift.id;

    return (
      <div
        key={shift.id}
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all shadow-xs relative overflow-visible group ${
          isCurrent
            ? "border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/60 shadow-lg ring-2 ring-emerald-400/30"
            : isPast
            ? "opacity-65 bg-slate-100/90 dark:bg-slate-900/50 border-slate-200/90 dark:border-slate-800 text-slate-500 grayscale-[30%]"
            : isFull
            ? "bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-950/60 hover:shadow-md"
            : isAlmostFull
            ? "bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-950/60 hover:shadow-md"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md"
        }`}
      >
        {/* Left Accent Stripe */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl sm:rounded-l-3xl ${
            isCurrent
              ? "bg-emerald-500"
              : isPast
              ? "bg-slate-400 dark:bg-slate-600"
              : isFull
              ? "bg-rose-500"
              : isAlmostFull
              ? "bg-amber-500"
              : "bg-indigo-600"
          }`}
        />

        {/* VISTA MÓVIL (< 1024px) */}
        <div className="pl-1.5 space-y-3 lg:hidden">
          {/* Fila 1: Horario + Disciplina + Live/Past Status + Menú */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`px-2.5 py-1 rounded-xl font-black text-xs flex items-center gap-1 shadow-2xs ${
                  isCurrent
                    ? "bg-emerald-600 text-white"
                    : isPast
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    : "bg-slate-900 text-white dark:bg-indigo-600"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>

              {isCurrent && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  EN CURSO
                </span>
              )}
              {isPast && (
                <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                  Finalizada
                </span>
              )}

              <DisciplineBadge discipline={shift.discipline} size="sm" />
            </div>

            {/* Menú de opciones */}
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
            <h3 className={`text-sm font-bold ${isPast ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
              {shift.title}
            </h3>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Prof. <strong className="text-slate-700 dark:text-slate-300 font-semibold">{shift.instructorName}</strong></span>
            </div>
          </div>

          {/* Fila 3: Aforo y Acciones Rápidas */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPast ? "bg-slate-400" : isFull ? "bg-rose-500" : isAlmostFull ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span
                className={
                  isPast
                    ? "text-slate-500"
                    : isFull
                    ? "text-rose-600 dark:text-rose-400"
                    : isAlmostFull
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {isPast ? "Finalizada" : isFull ? "Completo" : `${availableCount} libres`}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">({shift.bookedCount}/{shift.capacity})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onViewAttendees(shift)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{shift.bookedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onBookClient(shift)}
                disabled={isFull || isPast}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer ${
                  isPast
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "btn-primary disabled:opacity-40"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Inscribir</span>
              </button>
            </div>
          </div>
        </div>

        {/* VISTA DESKTOP (>= 1024px) */}
        <div className="pl-2 space-y-3.5 hidden lg:block">
          {/* Top Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-2xs ${
                  isCurrent
                    ? "bg-emerald-600 text-white"
                    : isPast
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    : "bg-slate-900 text-white dark:bg-indigo-600"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>

              {isCurrent && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>EN CURSO AHORA</span>
                </div>
              )}

              {isPast && (
                <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold text-xs">
                  Clase Finalizada
                </span>
              )}

              <DisciplineBadge discipline={shift.discipline} size="md" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {shift.level}
              </span>
            </div>

            {/* Acciones de edición y borrado */}
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
            <h3 className={`text-base font-bold transition-colors ${
              isPast ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            }`}>
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
                    isPast ? "bg-slate-400" : isFull ? "bg-rose-500" : isAlmostFull ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                <span className="text-slate-800 dark:text-slate-200">
                  {isPast
                    ? "Clase completada"
                    : isFull
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
                        ? isPast
                          ? "bg-slate-400 dark:bg-slate-600 text-white"
                          : "bg-indigo-600 text-white shadow-2xs"
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

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
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
                disabled={isFull || isPast}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
                  isPast
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "btn-primary disabled:opacity-40"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Inscribir</span>
              </button>
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

              {/* Estadísticas contextuales: Diarias en Agenda / Semanales en Tablero */}
              {viewMode === "daily_agenda" ? (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider text-[9px]">
                    Estadísticas del día ({activeDayObj.dayShort} {activeDayObj.dayNumber})
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{totalDayShifts} {totalDayShifts === 1 ? "clase" : "clases"}</span>
                  <span>•</span>
                  <span>{totalDayBooked}/{totalDayCapacity} camas</span>
                  <span>•</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{dayOccupancyRate}% ocupación diaria</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[9px]">
                    Estadísticas de la semana
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{totalWeekShifts} clases</span>
                  <span>•</span>
                  <span>{totalWeekBooked}/{totalWeekCapacity} camas</span>
                  <span>•</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{weekOccupancyRate}% ocupación semanal</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Controls & Filters */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
            {/* View Mode Toggle */}
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

            {/* Desktop Filters */}
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

        {/* 5-Days Selector (SOLO EN AGENDA DIARIA - SIN CONTADOR DE CLASES) */}
        {viewMode === "daily_agenda" && (
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="flex sm:grid sm:grid-cols-5 gap-1.5 sm:gap-2.5 w-full overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x">
              {weekDays.map((d) => {
                const isSelected = d.dateKey === selectedDayKey;

                return (
                  <div
                    key={d.dateKey}
                    onClick={() => setSelectedDayKey(d.dateKey)}
                    className={`min-w-[62px] sm:min-w-0 snap-start flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left gap-1 sm:gap-2 shrink-0 sm:shrink cursor-pointer group/day ${
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

      {/* Loading Indicator */}
      {isLoadingData ? (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 shadow-xs space-y-3">
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>
              {viewMode === "daily_agenda"
                ? `Cargando clases del ${activeDayObj.dayFull} ${activeDayObj.dayNumber}...`
                : `Cargando clases de la semana (${weekRangeTitle})...`}
            </span>
          </div>
          <p className="text-xs text-slate-400">Consultando únicamente los turnos requeridos</p>
        </div>
      ) : null}

      {/* VIEW: AGENDA POR DÍA */}
      {!isLoadingData && viewMode === "daily_agenda" && (
        <div className="w-full">
          {/* Mobile Action */}
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
      {!isLoadingData && viewMode === "weekly_board" && (
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
                      className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                        isToday
                          ? "bg-white/20 hover:bg-white/30 text-white"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-600"
                      }`}
                      title={`Agregar clase el ${day.dayFull}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Compact Classes List */}
                  <div className="p-3 flex-1 space-y-2.5 overflow-y-auto max-h-[800px]">
                    {dayShifts.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                        <Clock className="w-8 h-8 opacity-40 mb-2" />
                        <span className="text-xs font-bold text-slate-500">Sin clases</span>
                        <button
                          type="button"
                          onClick={() => onNewShift(day.dateKey)}
                          className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
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
