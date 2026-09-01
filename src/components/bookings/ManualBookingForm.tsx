"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Shift } from "@/types";
import { useData } from "@/context/DataContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  HeartPulse,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  Sparkles,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ManualBookingFormProps {
  preselectedShift?: Shift | null;
  onSuccess: (bookingResult: { cancellationCode: string; cancellationUrl: string }) => void;
  onCancel: () => void;
}

export function ManualBookingForm({
  preselectedShift,
  onSuccess,
  onCancel,
}: ManualBookingFormProps) {
  const { shifts, clients, bookings, createBooking, getClientWeeklyUsage } = useData();

  const availableShifts = shifts.filter(
    (s) => s.bookedCount < s.capacity || s.id === preselectedShift?.id
  );

  const [shiftId, setShiftId] = useState(
    preselectedShift?.id || (availableShifts[0] ? availableShifts[0].id : "")
  );
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalizar teléfono
  const cleanPhone = (val: string) => val.replace(/\D/g, "");

  // Autocompletado: buscar coincidencia en la base de clientas
  const matchedClient = useMemo(() => {
    const emailNorm = clientEmail.trim().toLowerCase();
    const phoneDigits = cleanPhone(clientPhone);
    const nameNorm = clientName.trim().toLowerCase();

    if (!emailNorm && phoneDigits.length < 6 && nameNorm.length < 3) return null;

    return clients.find((c) => {
      const matchEmail = Boolean(emailNorm && c.email && c.email.toLowerCase() === emailNorm);
      const cPhone = cleanPhone(c.phone || "");
      const matchPhone = Boolean(
        phoneDigits.length >= 6 &&
        cPhone.length >= 6 &&
        (cPhone.endsWith(phoneDigits) || phoneDigits.endsWith(cPhone) || cPhone === phoneDigits)
      );
      const matchNameExact = Boolean(nameNorm && c.name && c.name.toLowerCase() === nameNorm);

      return matchEmail || matchPhone || matchNameExact;
    });
  }, [clientEmail, clientPhone, clientName, clients]);

  // Lista de sugerencias por si empieza a escribir el nombre
  const suggestions = useMemo(() => {
    const query = clientName.trim().toLowerCase();
    if (query.length < 2) return [];
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) &&
          c.name.toLowerCase() !== clientName.trim().toLowerCase()
      )
      .slice(0, 3);
  }, [clientName, clients]);

  // Si encontramos a la clienta por email/teléfono, autorrellenar los demás campos
  const handleSelectClient = (c: { name: string; email?: string; phone?: string; notes?: string }) => {
    setClientName(c.name || "");
    if (c.email) setClientEmail(c.email);
    if (c.phone) setClientPhone(c.phone);
    if (c.notes && !notes) setNotes(c.notes);
  };

  React.useEffect(() => {
    if (matchedClient) {
      if (!clientName && matchedClient.name) {
        setClientName(matchedClient.name);
      }
      if (!clientEmail && matchedClient.email) {
        setClientEmail(matchedClient.email);
      }
      if (!clientPhone && matchedClient.phone) {
        setClientPhone(matchedClient.phone);
      }
    }
  }, [matchedClient]);

  // Detectar si el alumno ya se encuentra inscripto en este turno
  const isAlreadyBooked = useMemo(() => {
    if (!shiftId) return false;
    const emailNorm = clientEmail.trim().toLowerCase();
    const phoneDigits = cleanPhone(clientPhone);

    if (!emailNorm && phoneDigits.length < 6) return false;

    return bookings.some((b) => {
      if (b.shiftId !== shiftId || b.status === "cancelled") return false;
      const matchEmail = Boolean(emailNorm && b.clientEmail && b.clientEmail.toLowerCase() === emailNorm);
      const bPhoneDigits = cleanPhone(b.clientPhone || "");
      const matchPhone = Boolean(
        phoneDigits.length >= 6 &&
        bPhoneDigits.length >= 6 &&
        (bPhoneDigits.endsWith(phoneDigits) || phoneDigits.endsWith(bPhoneDigits) || bPhoneDigits === phoneDigits)
      );
      return matchEmail || matchPhone;
    });
  }, [shiftId, clientEmail, clientPhone, bookings]);

  // Obtener uso semanal de plan del alumno para la semana del turno actual
  const clientWeeklyUsage = useMemo(() => {
    if (!matchedClient || !shiftId) {
      return { used: 0, total: 0, remaining: 0, planName: "", hasPlan: false };
    }
    const currentShift = shifts.find((s) => s.id === shiftId);
    if (!currentShift) {
      return { used: 0, total: 0, remaining: 0, planName: "", hasPlan: false };
    }
    return getClientWeeklyUsage(matchedClient.id, currentShift.date);
  }, [matchedClient, shiftId, shifts, getClientWeeklyUsage]);

  // Validaciones estrictas de nombre y contacto
  const hasName = clientName.trim().length > 0;
  const hasContact = clientEmail.trim().length > 0 || clientPhone.trim().length > 0;
  const isSubmitDisabled = loading || !shiftId || !hasName || !hasContact || isAlreadyBooked;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId) {
      setError("Por favor, selecciona un turno disponible.");
      return;
    }

    if (!hasName) {
      setError("Por favor ingresa el nombre y apellido del alumno.");
      return;
    }

    if (!hasContact) {
      setError("Debes ingresar al menos un medio de contacto (Correo electrónico o Teléfono / WhatsApp).");
      return;
    }

    if (isAlreadyBooked) {
      setError("Este alumno ya se encuentra inscripto en este turno con reserva confirmada.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createBooking({
        shiftId,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        notes,
      });
      onSuccess(result);
    } catch (err: any) {
      setError(err.message || "No se pudo registrar la reserva.");
    } finally {
      setLoading(false);
    }
  };

  // Fecha base para la semana (Lunes a Viernes)
  const initialBaseDate =
    preselectedShift?.date ||
    (availableShifts[0] ? availableShifts[0].date : new Date().toISOString().split("T")[0]);

  const [currentWeekMonday, setCurrentWeekMonday] = useState<string>(() => {
    const d = new Date(initialBaseDate + "T12:00:00");
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
  });

  const [selectedDayDate, setSelectedDayDate] = useState<string>(() => {
    return preselectedShift?.date || initialBaseDate;
  });

  const handlePrevWeek = () => {
    const d = new Date(currentWeekMonday + "T12:00:00");
    d.setDate(d.getDate() - 7);
    const newMon = d.toISOString().split("T")[0];
    setCurrentWeekMonday(newMon);
    setSelectedDayDate(newMon);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekMonday + "T12:00:00");
    d.setDate(d.getDate() + 7);
    const newMon = d.toISOString().split("T")[0];
    setCurrentWeekMonday(newMon);
    setSelectedDayDate(newMon);
  };

  // Días laborables (Lunes a Viernes) de la semana activa
  const weekDays = useMemo(() => {
    const monday = new Date(currentWeekMonday + "T12:00:00");
    const namesShort = ["Lun", "Mar", "Mié", "Jue", "Vie"];
    const namesFull = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    const list = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const count = availableShifts.filter((s) => s.date === dateStr).length;
      list.push({
        dateStr,
        dayNum: d.getDate(),
        dayShort: namesShort[i],
        dayFull: namesFull[i],
        count,
      });
    }
    return list;
  }, [currentWeekMonday, availableShifts]);

  // Turnos disponibles para el día seleccionado
  const shiftsForSelectedDay = useMemo(() => {
    return availableShifts
      .filter((s) => s.date === selectedDayDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [availableShifts, selectedDayDate]);

  // Helper para chequear si el alumno está inscripto en cualquier turno
  const isClientBookedInAnyShift = useCallback(
    (shiftIdToCheck: string) => {
      const emailNorm = clientEmail.trim().toLowerCase();
      const phoneDigits = cleanPhone(clientPhone);

      if (!emailNorm && phoneDigits.length < 6) return false;

      return bookings.some((b) => {
        if (b.shiftId !== shiftIdToCheck || b.status === "cancelled") return false;
        const matchEmail = Boolean(emailNorm && b.clientEmail && b.clientEmail.toLowerCase() === emailNorm);
        const bPhoneDigits = cleanPhone(b.clientPhone || "");
        const matchPhone = Boolean(
          phoneDigits.length >= 6 &&
          bPhoneDigits.length >= 6 &&
          (bPhoneDigits.endsWith(phoneDigits) || phoneDigits.endsWith(bPhoneDigits) || bPhoneDigits === phoneDigits)
        );
        return matchEmail || matchPhone;
      });
    },
    [clientEmail, clientPhone, bookings]
  );

  const currentSelectedShift = shifts.find((s) => s.id === shiftId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Warning si ya está inscripto en el turno seleccionado */}
      {isAlreadyBooked && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1 shadow-2xs">
          <div className="font-bold flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Alumno ya inscripto en este turno</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Este alumno ya cuenta con un cupo activo en esta clase. No es posible inscribirlo dos veces en el mismo horario.
          </p>
        </div>
      )}

      {/* Selector de Turno / Clase con Filtro de Días (Lunes a Viernes) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Seleccionar Turno / Clase</span>
          </label>

          {/* Navegación semanal */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1">
              Semana
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5-Day Selector Grid */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
          {weekDays.map((d) => {
            const isSelected = d.dateStr === selectedDayDate;
            const hasSelectedShiftOnThisDay = currentSelectedShift?.date === d.dateStr;
            const hasShifts = d.count > 0;

            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => setSelectedDayDate(d.dateStr)}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40 font-black"
                    : hasShifts
                    ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                    : "bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border border-transparent opacity-60"
                }`}
              >
                {hasSelectedShiftOnThisDay && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs" />
                  </span>
                )}
                <span className="text-[9px] uppercase font-bold tracking-wider">{d.dayShort}</span>
                <span className="text-xs font-black">{d.dayNum}</span>
                <span className={`text-[8px] font-bold mt-0.5 px-1 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}>
                  {d.count} {d.count === 1 ? "turno" : "turnos"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Classes List for Selected Day */}
        <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin pr-0.5">
          {shiftsForSelectedDay.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              No hay turnos disponibles para este día.
            </div>
          ) : (
            shiftsForSelectedDay.map((s) => {
              const isSelected = shiftId === s.id;
              const isClientBookedInThisShift = isClientBookedInAnyShift(s.id);

              return (
                <div
                  key={s.id}
                  onClick={() => !isClientBookedInThisShift && setShiftId(s.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-xs flex items-center justify-between gap-2.5 transition-all ${
                    isClientBookedInThisShift
                      ? "bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
                      : isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm cursor-pointer ring-2 ring-indigo-400/40"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300 cursor-pointer shadow-2xs"
                  }`}
                >
                  {/* Left: Prominent Time Badge */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className={`px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[70px] sm:min-w-[76px] transition-colors ${
                        isClientBookedInThisShift
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          : isSelected
                          ? "bg-white/20 text-white"
                          : "bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                      }`}
                    >
                      <span className="text-sm sm:text-base font-black tracking-tight leading-none">
                        {s.startTime}
                      </span>
                      <span
                        className={`text-[9px] font-bold mt-0.5 ${
                          isSelected
                            ? "text-indigo-100"
                            : isClientBookedInThisShift
                            ? "text-slate-400"
                            : "text-indigo-500/80 dark:text-indigo-400"
                        }`}
                      >
                        a {s.endTime} hs
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-black text-xs sm:text-sm truncate ${
                            isClientBookedInThisShift ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {s.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {s.room}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] font-medium mt-0.5 ${
                          isSelected
                            ? "text-indigo-100"
                            : isClientBookedInThisShift
                            ? "text-slate-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        Prof. {s.instructorName}
                      </div>
                    </div>
                  </div>

                  {/* Right: Spots & Price */}
                  <div className="flex flex-col items-end shrink-0 pl-1">
                    {isClientBookedInThisShift ? (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-300/50">
                        Ya inscripto
                      </span>
                    ) : (
                      <>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {s.capacity - s.bookedCount} libres
                        </span>
                        <span
                          className={`text-[10px] font-bold mt-1 ${
                            isSelected ? "text-indigo-100" : "text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          ${s.price.toLocaleString("es-AR")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Student Name with Autocomplete Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Nombre Completo del Alumno <span className="text-rose-500">*</span>
          </label>
          {matchedClient && (
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Alumno encontrado</span>
            </span>
          )}
        </div>

        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej. Martina Silveyra"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Quick Autocomplete Suggestions Pills */}
        {suggestions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400">¿Quisiste decir?</span>
            {suggestions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectClient(c)}
                className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                + {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="alumno@ejemplo.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Teléfono de Contacto (WhatsApp)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="11 1234 5678"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Información del Plan del Alumno para el Administrador */}
      {clientWeeklyUsage.hasPlan && (
        clientWeeklyUsage.remaining === 0 ? (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs space-y-2 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="font-bold flex items-center gap-2 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>⚠️ Excediendo cupo semanal: {clientWeeklyUsage.planName}</span>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white shadow-2xs">
                0 turnos libres en plan • Permiso Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              El alumno ya utilizó sus <strong>{clientWeeklyUsage.used} de {clientWeeklyUsage.total} clases</strong> de su abono para esta semana. Al ser administrador, <strong>puedes confirmar esta reserva adicional</strong> si fue autorizada o abonada por separado.
            </p>
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-indigo-950 dark:text-indigo-200 truncate">
                    Miembro activo de {clientWeeklyUsage.planName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Utilizó {clientWeeklyUsage.used} de {clientWeeklyUsage.total} clases esta semana
                  </div>
                </div>
              </div>

              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black bg-indigo-600 text-white shadow-2xs shrink-0">
                {clientWeeklyUsage.remaining} {clientWeeklyUsage.remaining === 1 ? "turno disponible" : "turnos disponibles"}
              </span>
            </div>

            {/* Mini barra de progreso visual */}
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((clientWeeklyUsage.used / Math.max(1, clientWeeklyUsage.total)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Observaciones posturales o de salud (Opcional)
        </label>
        <div className="relative">
          <HeartPulse className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Hernia de disco lumbar L5-S1, embarazo semana 18, molestia en hombro..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
            isSubmitDisabled
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700"
              : "btn-primary"
          }`}
        >
          {isSubmitDisabled && !loading ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>
            {loading
              ? "Confirmando..."
              : !hasName
              ? "Ingresa el nombre del alumno"
              : !hasContact
              ? "Ingresa correo o teléfono"
              : isAlreadyBooked
              ? "Alumno ya inscripto en este turno"
              : "Confirmar Reserva"}
          </span>
        </button>
      </div>
    </form>
  );
}
