"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { Booking, Shift } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Ban,
  ArrowLeft,
  Sparkles,
  CalendarClock,
  Check,
  Search,
} from "lucide-react";

interface CancellationCardProps {
  initialCode: string;
}

function formatDateDDMMAAAA(dateStr?: string): string {
  if (!dateStr) return "-";
  const trimmed = dateStr.trim();
  const parts = trimmed.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return trimmed;
}

function getDayNameShort(dateStr: string): string {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const d = new Date(dateStr + "T12:00:00");
  return days[d.getDay()] || "";
}

export function CancellationCard({ initialCode }: CancellationCardProps) {
  const { bookings, shifts, cancelBookingByCode, rescheduleBooking } = useData();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [activeTab, setActiveTab] = useState<"reschedule" | "cancel">("reschedule");
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedBookingCode, setSelectedBookingCode] = useState<string>(initialCode.toUpperCase());
  const [selectedNewShiftId, setSelectedNewShiftId] = useState<string | null>(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("all");
  const [shiftSearchQuery, setShiftSearchQuery] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    booking?: Booking;
    type?: "cancel" | "reschedule";
  } | null>(null);

  // Booking principal encontrado por código
  const initialBooking = useMemo(() => {
    return bookings.find(
      (b) => b.cancellationCode.toUpperCase() === code.trim().toUpperCase()
    );
  }, [bookings, code]);

  // Obtener TODOS los turnos activos y FUTUROS de este cliente
  const upcomingClientBookings = useMemo(() => {
    if (!initialBooking) return [];

    const now = new Date();
    const emailNorm = initialBooking.clientEmail?.toLowerCase() || "";
    const phone = initialBooking.clientPhone || "";

    return bookings.filter((b) => {
      if (b.status !== "confirmed") return false;

      // Coincidencia de cliente
      const isSameClient =
        (emailNorm && b.clientEmail.toLowerCase() === emailNorm) ||
        (phone && b.clientPhone === phone) ||
        b.cancellationCode.toUpperCase() === initialBooking.cancellationCode.toUpperCase();

      if (!isSameClient) return false;

      // FILTRO ESTRICTO: Solo turnos cuya fecha y hora de inicio sean estrictamente futuras
      const shiftDateTime = new Date(`${b.shiftDate}T${b.shiftTime}:00`);
      return shiftDateTime.getTime() > now.getTime();
    }).sort((a, b) => (a.shiftDate + a.shiftTime).localeCompare(b.shiftDate + b.shiftTime));
  }, [bookings, initialBooking]);

  // Turno actualmente seleccionado para operar
  const activeBooking = useMemo(() => {
    if (upcomingClientBookings.length > 0) {
      const found = upcomingClientBookings.find(
        (b) => b.cancellationCode.toUpperCase() === selectedBookingCode.trim().toUpperCase()
      );
      if (found) return found;
      return upcomingClientBookings[0];
    }
    return initialBooking;
  }, [upcomingClientBookings, selectedBookingCode, initialBooking]);

  // Validar si para el turno activo faltan menos de 3 horas
  const isUnder3Hours = useMemo(() => {
    if (!activeBooking) return false;
    const shiftDateTime = new Date(`${activeBooking.shiftDate}T${activeBooking.shiftTime}:00`);
    const diffHours = (shiftDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours < 3;
  }, [activeBooking]);

  // Clases disponibles para reprogramar (futuras, con cupo y EXCLUYENDO en las que ya está inscripta)
  const availableRescheduleShifts = useMemo(() => {
    if (!activeBooking) return [];
    const now = new Date();

    return shifts.filter((s) => {
      // No el mismo turno actual
      if (s.id === activeBooking.shiftId) return false;

      // No ningún otro turno en el que la clienta ya esté participando
      const alreadyBooked = upcomingClientBookings.some(
        (b) => b.shiftId === s.id && b.status !== "cancelled"
      );
      if (alreadyBooked) return false;

      // Solo con cupo disponible
      if (s.bookedCount >= s.capacity) return false;

      // Solo turnos futuros
      const shiftDateTime = new Date(`${s.date}T${s.startTime}:00`);
      return shiftDateTime.getTime() > now.getTime();
    }).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [shifts, activeBooking, upcomingClientBookings]);

  // Días únicos disponibles para filtrar
  const availableDays = useMemo(() => {
    const days = Array.from(new Set(availableRescheduleShifts.map((s) => s.date))).sort();
    return days;
  }, [availableRescheduleShifts]);

  // Clases filtradas por el día y búsqueda seleccionados
  const filteredRescheduleShifts = useMemo(() => {
    return availableRescheduleShifts.filter((s) => {
      if (selectedDayFilter !== "all" && s.date !== selectedDayFilter) return false;
      if (shiftSearchQuery) {
        const q = shiftSearchQuery.toLowerCase();
        const matches =
          s.title.toLowerCase().includes(q) ||
          s.instructorName.toLowerCase().includes(q) ||
          s.startTime.includes(q) ||
          s.room.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [availableRescheduleShifts, selectedDayFilter, shiftSearchQuery]);

  // Manejador de Cancelación
  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking) return;

    setProcessing(true);
    try {
      const res = await cancelBookingByCode(activeBooking.cancellationCode, reason || "Cancelado por el alumno vía web");
      setResult({
        ...res,
        type: "cancel",
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Error al procesar la cancelación.",
        type: "cancel",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Manejador de Reprogramación
  const handleReschedule = async () => {
    if (!activeBooking || !selectedNewShiftId) return;

    setProcessing(true);
    try {
      const res = await rescheduleBooking(activeBooking.cancellationCode, selectedNewShiftId);
      setResult({
        ...res,
        type: "reschedule",
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Error al reprogramar el turno.",
        type: "reschedule",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {result ? (
        <div className="glass-card p-6 sm:p-8 text-center animate-modal">
          {result.success ? (
            <>
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {result.type === "reschedule" ? "¡Turno Reprogramado con Éxito!" : "Turno Cancelado Exitosamente"}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {result.message}
              </p>

              {result.booking && result.type === "reschedule" && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-left mb-6 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                    Tu Nuevo Turno Confirmado
                  </span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {result.booking.shiftTitle}
                  </div>
                  <div className="text-indigo-700 dark:text-indigo-300 font-bold">
                    {formatDateDDMMAAAA(result.booking.shiftDate)} • {result.booking.shiftTime} hs
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Prof. {result.booking.instructorName} • {result.booking.room}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Aviso sobre tu Reserva
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {result.message}
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/reservar"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold btn-primary inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ver Horarios del Estudio</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Gestión de Reserva de Turno
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Modifica tu horario o cancela tu cupo sin intermediarios
            </p>
          </div>

          {activeBooking ? (
            <div className="space-y-5">
              {/* Si la persona tiene múltiples turnos futuros, mostrar selector */}
              {upcomingClientBookings.length > 1 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Tus Turnos Futuros Agendados ({upcomingClientBookings.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {upcomingClientBookings.map((b) => {
                      const isSelected = b.cancellationCode === activeBooking.cancellationCode;

                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBookingCode(b.cancellationCode)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>{b.shiftTitle}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className={`text-[11px] mt-0.5 ${isSelected ? "text-indigo-100 font-semibold" : "text-slate-500"}`}>
                            {formatDateDDMMAAAA(b.shiftDate)} • {b.shiftTime} hs
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Target booking active card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {activeBooking.shiftTitle}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {activeBooking.cancellationCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-semibold">{formatDateDDMMAAAA(activeBooking.shiftDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-semibold">{activeBooking.shiftTime} hs</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{activeBooking.room} (Prof. {activeBooking.instructorName})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  Alumno/a: <strong className="text-slate-800 dark:text-slate-200">{activeBooking.clientName}</strong>
                </div>
              </div>

              {/* Check de 3 horas */}
              {isUnder3Hours ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Gestión Web No Disponible (Menos de 3 Horas)</span>
                  </div>
                  <p className="leading-relaxed">
                    Las modificaciones y cancelaciones solo pueden realizarse con un mínimo de <strong>3 horas de anticipación</strong>. Para esta clase faltan menos de 3 horas o ya ha comenzado.
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Por favor comunícate directamente con la recepción del estudio si tienes un imprevisto.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/reservar"
                      className="w-full py-2 rounded-xl text-xs font-bold btn-primary text-center block"
                    >
                      Volver a Horarios Disponibles
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Action Tabs: Modificar vs Cancelar */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
                    <button
                      type="button"
                      onClick={() => setActiveTab("reschedule")}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === "reschedule"
                          ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Modificar Horario</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("cancel")}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === "cancel"
                          ? "bg-white dark:bg-red-600 text-rose-600 dark:text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancelar Turno</span>
                    </button>
                  </div>

                  {/* TAB 1: MODIFICAR TURNO */}
                  {activeTab === "reschedule" && (
                    <div className="space-y-4">
                      {/* Day Tabs Section */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>1. Selecciona el Día de la Semana:</span>
                          </label>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {availableRescheduleShifts.length} clases totales con cupo
                          </span>
                        </div>

                        {/* Grid de Días de la Semana: Lunes a Viernes */}
                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                          {[
                            { name: "Lunes", dateMatch: availableDays.find((d) => new Date(d + "T12:00:00").getDay() === 1) },
                            { name: "Martes", dateMatch: availableDays.find((d) => new Date(d + "T12:00:00").getDay() === 2) },
                            { name: "Miércoles", dateMatch: availableDays.find((d) => new Date(d + "T12:00:00").getDay() === 3) },
                            { name: "Jueves", dateMatch: availableDays.find((d) => new Date(d + "T12:00:00").getDay() === 4) },
                            { name: "Viernes", dateMatch: availableDays.find((d) => new Date(d + "T12:00:00").getDay() === 5) },
                          ].map((dayObj) => {
                            const hasShifts = !!dayObj.dateMatch;
                            const isSelected = dayObj.dateMatch && selectedDayFilter === dayObj.dateMatch;
                            const count = dayObj.dateMatch
                              ? availableRescheduleShifts.filter((s) => s.date === dayObj.dateMatch).length
                              : 0;

                            return (
                              <button
                                key={dayObj.name}
                                type="button"
                                disabled={!hasShifts}
                                onClick={() => {
                                  if (dayObj.dateMatch) {
                                    setSelectedDayFilter(dayObj.dateMatch);
                                  }
                                }}
                                className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all border ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30"
                                    : hasShifts
                                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer"
                                    : "bg-slate-100/60 dark:bg-slate-950/40 border-slate-200/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                                }`}
                              >
                                <span className={`text-[10px] font-black uppercase tracking-wider ${
                                  isSelected ? "text-indigo-100" : hasShifts ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                                }`}>
                                  {dayObj.name.slice(0, 3)}
                                </span>
                                <span className="text-xs font-black mt-0.5">
                                  {dayObj.name}
                                </span>
                                <span className={`text-[10px] font-semibold mt-0.5 ${
                                  isSelected ? "text-indigo-200" : hasShifts ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                                }`}>
                                  {hasShifts ? `${count} clases` : "Sin clases"}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Botón Ver Todos los Días */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedDayFilter("all")}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                              selectedDayFilter === "all"
                                ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-2xs"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline text-[11px]"
                            }`}
                          >
                            Mostrar Todos los Días Juntos ({availableRescheduleShifts.length})
                          </button>

                          {selectedDayFilter !== "all" && (
                            <span className="text-[11px] font-bold text-slate-500">
                              Filtrando: <strong className="text-indigo-600 dark:text-indigo-400">{getDayNameShort(selectedDayFilter)} {formatDateDDMMAAAA(selectedDayFilter)}</strong>
                            </span>
                          )}
                        </div>

                        {/* Search Input Filter */}
                        <div className="relative pt-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={shiftSearchQuery}
                            onChange={(e) => setShiftSearchQuery(e.target.value)}
                            placeholder="Buscar por horario (ej. 09:00), instructor o disciplina..."
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      {/* Header 2: Selecciona la Clase */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>2. Elige el Horario que Prefieres:</span>
                        </label>
                      </div>

                      {/* Shifts of Selected Day */}
                      {filteredRescheduleShifts.length === 0 ? (
                        <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                          <p className="font-bold text-slate-700 dark:text-slate-300">
                            No hay turnos con cupo disponible para el filtro seleccionado.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Prueba seleccionando otro día arriba o tocando en &quot;Mostrar Todos los Días Juntos&quot;.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                          {filteredRescheduleShifts.map((s) => {
                            const isSelected = selectedNewShiftId === s.id;
                            const available = s.capacity - s.bookedCount;

                            return (
                              <div
                                key={s.id}
                                onClick={() => setSelectedNewShiftId(s.id)}
                                className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span className="text-sm">{s.title}</span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    }`}>
                                      {s.discipline}
                                    </span>
                                  </div>
                                  <div className={`text-sm font-black ${isSelected ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`}>
                                    {getDayNameShort(s.date)} {formatDateDDMMAAAA(s.date)} • {s.startTime} a {s.endTime} hs
                                  </div>
                                  <div className={`text-[11px] ${isSelected ? "text-indigo-100" : "text-slate-500"}`}>
                                    Prof. {s.instructorName} • {s.room}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className={`text-xs font-bold block ${isSelected ? "text-indigo-100" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    {available} {available === 1 ? "lugar libre" : "lugares libres"}
                                  </span>
                                  {isSelected ? (
                                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white text-indigo-600 text-[10px] font-black shadow-xs">
                                      ✓ Horario Elegido
                                    </span>
                                  ) : (
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] text-slate-400 font-semibold border border-slate-200 dark:border-slate-800">
                                      Toca para elegir
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                        <Link
                          href="/reservar"
                          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1 py-2"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Volver</span>
                        </Link>

                        <button
                          type="button"
                          onClick={handleReschedule}
                          disabled={processing || !selectedNewShiftId}
                          className="px-6 py-2.5 rounded-xl text-xs font-black btn-primary disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                        >
                          <CalendarClock className="w-4 h-4" />
                          <span>{processing ? "Guardando cambio..." : "Confirmar Cambio de Horario"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CANCELAR TURNO */}
                  {activeTab === "cancel" && (
                    <form onSubmit={handleCancel} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Motivo de la cancelación (Opcional)
                        </label>
                        <select
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                        >
                          <option value="">Selecciona un motivo...</option>
                          <option value="Imprevisto laboral o personal">Imprevisto laboral o personal</option>
                          <option value="Motivos de salud / Lesión">Motivos de salud / Lesión</option>
                          <option value="Error al elegir el horario">Error al elegir el horario</option>
                          <option value="Reprogramaré para otro día">Reprogramaré para otro día</option>
                        </select>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-200 text-[11px] leading-relaxed">
                        <strong>Política de Cancelación:</strong> Se permite cancelar hasta 3 horas antes del inicio de la clase. Al confirmar, tu lugar quedará libre automáticamente.
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <Link
                          href="/reservar"
                          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline flex items-center justify-center gap-1 py-2"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>No cancelar</span>
                        </Link>

                        <button
                          type="submit"
                          disabled={processing}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Ban className="w-4 h-4" />
                          <span>{processing ? "Cancelando..." : "Confirmar Cancelación"}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSelectedBookingCode(code);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ingresa tu Código de Reserva
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej. PIL-M4RT-892"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono font-bold text-center tracking-wider text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={processing || !code}
                className="w-full py-2.5 rounded-xl text-xs font-bold btn-primary disabled:opacity-50"
              >
                {processing ? "Buscando..." : "Buscar y Gestionar Turno"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
