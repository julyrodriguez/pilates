"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Client, Shift, Booking, FixedBookingSubscription } from "@/types";
import { useData } from "@/context/DataContext";
import { getFirebaseDb } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarCheck,
  CalendarDays,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  X,
  Repeat,
} from "lucide-react";

interface ClientFixedBookingTabProps {
  client: Client;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { day: 1, name: "Lunes", short: "Lun" },
  { day: 2, name: "Martes", short: "Mar" },
  { day: 3, name: "Miércoles", short: "Mié" },
  { day: 4, name: "Jueves", short: "Jue" },
  { day: 5, name: "Viernes", short: "Vie" },
  { day: 6, name: "Sábado", short: "Sáb" },
];

function formatMonthHeader(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${months[month - 1]} ${year}`;
}

function formatDateDisplay(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${days[date.getDay()]} ${d} de ${months[m - 1]}`;
  } catch {
    return dateStr;
  }
}

export function ClientFixedBookingTab({
  client,
  onSuccess,
}: ClientFixedBookingTabProps) {
  const {
    createBooking,
    addShift,
    updateClient,
    cancelBookingByCode,
    settings,
  } = useData();

  // Current and available months for selector
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const availableMonths = useMemo(() => {
    const list: string[] = [];
    const [currY, currM] = currentMonthKey.split("-").map(Number);
    for (let offset = 0; offset <= 3; offset++) {
      const d = new Date(currY, currM - 1 + offset, 1, 12, 0, 0);
      list.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }
    return list;
  }, [currentMonthKey]);

  // Form selections
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [selectedDay, setSelectedDay] = useState<number>(2); // Martes default
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Dates and shifts loading state
  const [monthShifts, setMonthShifts] = useState<Shift[]>([]);
  const [clientExistingBookings, setClientExistingBookings] = useState<Booking[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Checked dates for the recurring booking (by default all weeks selected)
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [resultNotice, setResultNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Subscriptions list
  const activeSubscriptions = useMemo(() => {
    return (client.fixedSubscriptions || []).filter((s) => s.active);
  }, [client.fixedSubscriptions]);

  // Calculate all calendar dates of that day in the chosen month
  const targetDatesInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d, 12, 0, 0);
      if (dateObj.getDay() === selectedDay) {
        dates.push(
          `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        );
      }
    }
    return dates;
  }, [selectedMonth, selectedDay]);

  // Fetch shifts & client bookings for the target dates
  const loadMonthData = useCallback(async () => {
    if (targetDatesInMonth.length === 0) return;
    setLoadingShifts(true);
    try {
      const db = getFirebaseDb();
      if (!db) return;

      const startDate = targetDatesInMonth[0];
      const endDate = targetDatesInMonth[targetDatesInMonth.length - 1];

      // 1. Fetch shifts on those dates
      const sQuery = query(
        collection(db, "pilates_shifts"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );
      const sSnap = await getDocs(sQuery);
      const shiftsFound = sSnap.docs
        .map((d) => d.data() as Shift)
        .filter(
          (s) =>
            s && s.id && !s.id.startsWith("_") && targetDatesInMonth.includes(s.date)
        );
      setMonthShifts(shiftsFound);

      // 2. Fetch existing bookings for this client
      const bQuery = query(
        collection(db, "pilates_bookings"),
        where("shiftDate", ">=", startDate),
        where("shiftDate", "<=", endDate)
      );
      const bSnap = await getDocs(bQuery);
      const clientEmail = (client.email || "").toLowerCase().trim();
      const clientPhoneDigits = (client.phone || "").replace(/\D/g, "");

      const clientBookings = bSnap.docs
        .map((d) => d.data() as Booking)
        .filter((b) => {
          if (!b || b.status === "cancelled") return false;
          const bEmail = (b.clientEmail || "").toLowerCase().trim();
          const bPhoneDigits = (b.clientPhone || "").replace(/\D/g, "");
          const matchEmail = Boolean(clientEmail && bEmail && bEmail === clientEmail);
          const matchPhone = Boolean(
            clientPhoneDigits.length >= 6 &&
              bPhoneDigits.length >= 6 &&
              (bPhoneDigits.endsWith(clientPhoneDigits) || clientPhoneDigits.endsWith(bPhoneDigits))
          );
          return matchEmail || matchPhone || b.clientName === client.name;
        });

      setClientExistingBookings(clientBookings);
    } catch (err) {
      console.warn("Error loading month shifts for fixed booking:", err);
    } finally {
      setLoadingShifts(false);
    }
  }, [targetDatesInMonth, client]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  // Available shift times found on that day in this month
  const availableTimes = useMemo(() => {
    const timeMap = new Map<
      string,
      { time: string; instructorName: string; count: number }
    >();

    monthShifts.forEach((s) => {
      if (s.startTime) {
        const existing = timeMap.get(s.startTime);
        if (!existing) {
          timeMap.set(s.startTime, {
            time: s.startTime,
            instructorName: s.instructorName || "",
            count: 1,
          });
        } else {
          existing.count += 1;
        }
      }
    });

    const list = Array.from(timeMap.values()).sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    // Common default times if no shifts are created yet
    if (list.length === 0) {
      return [
        { time: "08:00", instructorName: "Selene De Prate", count: 0 },
        { time: "09:00", instructorName: "Selene De Prate", count: 0 },
        { time: "10:00", instructorName: "Selene De Prate", count: 0 },
        { time: "11:00", instructorName: "Selene De Prate", count: 0 },
        { time: "14:00", instructorName: "Selene De Prate", count: 0 },
        { time: "15:00", instructorName: "Selene De Prate", count: 0 },
        { time: "16:00", instructorName: "Selene De Prate", count: 0 },
        { time: "17:00", instructorName: "Selene De Prate", count: 0 },
        { time: "18:00", instructorName: "Selene De Prate", count: 0 },
        { time: "19:00", instructorName: "Selene De Prate", count: 0 },
      ];
    }
    return list;
  }, [monthShifts]);

  // Set default selected time
  useEffect(() => {
    if (availableTimes.length > 0) {
      if (!selectedTime || !availableTimes.some((t) => t.time === selectedTime)) {
        const preferred =
          availableTimes.find((t) => t.time === "15:00") || availableTimes[0];
        setSelectedTime(preferred.time);
      }
    }
  }, [availableTimes, selectedTime]);

  // Match each date with its shift status and whether client is already booked
  const weekSlots = useMemo(() => {
    return targetDatesInMonth.map((dateStr, idx) => {
      const shift = monthShifts.find(
        (s) => s.date === dateStr && s.startTime === selectedTime
      );

      const alreadyBooked = clientExistingBookings.some(
        (b) =>
          b.shiftDate === dateStr &&
          b.shiftTime === selectedTime &&
          b.status !== "cancelled"
      );

      const isFull = shift ? shift.bookedCount >= shift.capacity : false;

      return {
        weekNumber: idx + 1,
        date: dateStr,
        shift,
        alreadyBooked,
        isFull,
      };
    });
  }, [targetDatesInMonth, monthShifts, selectedTime, clientExistingBookings]);

  // Whenever weekSlots changes, pre-check all eligible dates (not already booked)
  useEffect(() => {
    const defaultChecked = new Set<string>();
    weekSlots.forEach((slot) => {
      if (!slot.alreadyBooked) {
        defaultChecked.add(slot.date);
      }
    });
    setCheckedDates(defaultChecked);
  }, [weekSlots]);

  const toggleDateCheck = (dateStr: string) => {
    setCheckedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const selectAllDates = () => {
    const all = new Set<string>();
    weekSlots.forEach((s) => {
      if (!s.alreadyBooked) all.add(s.date);
    });
    setCheckedDates(all);
  };

  const unselectAllDates = () => {
    setCheckedDates(new Set());
  };

  // Helper to calculate shift end time (+50 min)
  const calculateEndTime = (startTime: string) => {
    try {
      const [h, m] = startTime.split(":").map(Number);
      const totalMin = h * 60 + m + 50;
      const endH = Math.floor(totalMin / 60) % 24;
      const endM = totalMin % 60;
      return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    } catch {
      return "00:50";
    }
  };

  // Handle submitting the fixed booking
  const handleConfirmFixedBooking = async () => {
    if (checkedDates.size === 0) {
      setResultNotice({
        type: "error",
        message: "Por favor selecciona al menos una fecha para agendar.",
      });
      return;
    }

    setSubmitting(true);
    setResultNotice(null);

    try {
      const datesToProcess = Array.from(checkedDates).sort();
      const createdBookingIds: string[] = [];
      let representativeInstructor = "Selene De Prate";

      for (const dateStr of datesToProcess) {
        let shift = monthShifts.find(
          (s) => s.date === dateStr && s.startTime === selectedTime
        );

        // If shift does not exist on that date yet, create it on the fly
        if (!shift) {
          const firstExisting = monthShifts.find(
            (s) => s.startTime === selectedTime
          );
          shift = await addShift({
            title: "Pilates Reformer",
            discipline: "reformer",
            date: dateStr,
            startTime: selectedTime,
            endTime: calculateEndTime(selectedTime),
            capacity: 5,
            instructorId: firstExisting?.instructorId || "inst-default",
            instructorName: firstExisting?.instructorName || "Selene De Prate",
            room: "Sala Reformer",
            price: 0,
            level: "Todos los niveles",
          });
        }

        if (shift.instructorName) {
          representativeInstructor = shift.instructorName;
        }

        // Create booking
        const res = await createBooking({
          shiftId: shift.id,
          clientName: client.name,
          clientEmail: client.email || "",
          clientPhone: client.phone || "",
          allowPast: true,
          planId: client.planId,
          planName: client.planName,
          planClassesPerWeek: client.planClassesPerWeek,
          notes: "Turno fijo agendado por administración",
        });

        if (res.booking?.id) {
          createdBookingIds.push(res.booking.id);
        }
      }

      // Save the subscription on client doc
      const dayName =
        DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.name || "Día fijo";

      const newSubscription: FixedBookingSubscription = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        dayOfWeek: selectedDay,
        dayName,
        time: selectedTime,
        monthKey: selectedMonth,
        dates: datesToProcess,
        bookingIds: createdBookingIds,
        createdAt: new Date().toISOString(),
        active: true,
        instructorName: representativeInstructor,
        discipline: "Pilates Reformer",
      };

      const existingSubs = client.fixedSubscriptions || [];
      await updateClient(client.id, {
        fixedSubscriptions: [newSubscription, ...existingSubs],
      });

      setResultNotice({
        type: "success",
        message: `¡Reserva fija confirmada con éxito! Se agendaron ${datesToProcess.length} turnos los días ${dayName} a las ${selectedTime} hs para ${client.name}.`,
      });

      // Reload shifts & notify parent
      await loadMonthData();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error creating fixed booking:", err);
      setResultNotice({
        type: "error",
        message:
          "Ocurrió un error al agendar los turnos fijos. Por favor intenta nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancelling a fixed subscription
  const handleCancelSubscription = async (sub: FixedBookingSubscription) => {
    const confirmCancel = window.confirm(
      `¿Deseas dar de baja la suscripción fija de los ${sub.dayName} a las ${sub.time} hs de ${formatMonthHeader(sub.monthKey)}?`
    );
    if (!confirmCancel) return;

    try {
      const updatedSubs = (client.fixedSubscriptions || []).map((s) =>
        s.id === sub.id ? { ...s, active: false } : s
      );

      await updateClient(client.id, {
        fixedSubscriptions: updatedSubs,
      });

      setResultNotice({
        type: "success",
        message: `La suscripción fija de los ${sub.dayName} ${sub.time} hs ha sido dada de baja.`,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error updating subscription:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Subscriptions Banner / List if any exists */}
      {activeSubscriptions.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                Suscripciones Fijas Activas ({activeSubscriptions.length})
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Activa
            </span>
          </div>

          <div className="space-y-2">
            {activeSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      🗓️ Todos los {sub.dayName} a las {sub.time} hs
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      • {formatMonthHeader(sub.monthKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Fechas agendadas:</span>
                    {sub.dates.map((d) => (
                      <span
                        key={d}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300"
                      >
                        {d.slice(8, 10)}/{d.slice(5, 7)}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCancelSubscription(sub)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-1.5 self-end sm:self-center cursor-pointer"
                  title="Dar de baja esta suscripción fija"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dar de baja</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Creation Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Crear Reserva Fija Mensual</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Agenda a {client.name} automáticamente en el mismo día y horario para todas o algunas semanas del mes.
          </p>
        </div>

        {resultNotice && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 ${
              resultNotice.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200"
            }`}
          >
            {resultNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{resultNotice.message}</span>
            <button
              type="button"
              onClick={() => setResultNotice(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. Selector de Mes y Día de la Semana */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              1. Mes a Agendar:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-slate-100 cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthHeader(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Horario */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              3. Horario del Turno Fijo:
            </label>
            <div className="relative">
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-slate-100 cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
              >
                {availableTimes.map((t) => (
                  <option key={t.time} value={t.time}>
                    {t.time} hs {t.instructorName ? `(${t.instructorName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Día de la Semana (Segmented Control) */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            2. Día de la Semana:
          </label>
          <div className="grid grid-cols-6 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            {DAYS_OF_WEEK.map((d) => {
              const isSelected = selectedDay === d.day;
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setSelectedDay(d.day)}
                  className={`py-2 px-1 rounded-xl text-center transition-all font-black text-xs cursor-pointer ${
                    isSelected
                      ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="block sm:hidden">{d.short}</span>
                  <span className="hidden sm:block">{d.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Selector de Semanas / Fechas del Mes */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                4. Semanas a reservar de {formatMonthHeader(selectedMonth)}:
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Puedes agendar todo el mes o desmarcar semanas puntuales
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={selectAllDates}
                className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Todas
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={unselectAllDates}
                className="text-slate-500 hover:underline cursor-pointer"
              >
                Ninguna
              </button>
            </div>
          </div>

          {loadingShifts ? (
            <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Cargando turnos de las semanas...</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {weekSlots.map((slot) => {
                const isChecked = checkedDates.has(slot.date);
                const isAlreadyBooked = slot.alreadyBooked;
                const shiftBooked = slot.shift?.bookedCount || 0;
                const shiftCap = slot.shift?.capacity || 5;

                return (
                  <label
                    key={slot.date}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isAlreadyBooked
                        ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
                        : isChecked
                        ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/80"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isAlreadyBooked}
                        onChange={() => toggleDateCheck(slot.date)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 disabled:opacity-50 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                          <span>Semana {slot.weekNumber}:</span>
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {formatDateDisplay(slot.date)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>{selectedTime} hs</span>
                          {slot.shift?.instructorName && (
                            <span>• Prof. {slot.shift.instructorName}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isAlreadyBooked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          Ya reservado
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            slot.isFull
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {slot.shift
                            ? `${shiftBooked}/${shiftCap} cupos`
                            : "Turno a crear"}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {checkedDates.size}
            </span>{" "}
            {checkedDates.size === 1 ? "clase seleccionada" : "clases seleccionadas"}
          </div>

          <button
            type="button"
            disabled={submitting || checkedDates.size === 0}
            onClick={handleConfirmFixedBooking}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Agendando turnos fijos...</span>
              </>
            ) : (
              <>
                <CalendarCheck className="w-4 h-4" />
                <span>
                  Confirmar Reserva Fija ({checkedDates.size}{" "}
                  {checkedDates.size === 1 ? "clase" : "clases"})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
