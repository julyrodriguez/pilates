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
  Search,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { Client } from "@/types";

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

  // Estado para el menú desplegable del buscador predictivo de clientas
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedClientObj, setSelectedClientObj] = useState<Client | null>(null);

  // Normalizar teléfono
  const cleanPhone = (val: string) => val.replace(/\D/g, "");

  // Normalizar texto sin tildes ni mayúsculas para búsquedas precisas
  const normalizeStr = (str: string) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Lista de clientas filtradas en tiempo real: PRIORIZANDO LAS QUE ARRANCAN IGUAL (startsWith)
  const filteredClients = useMemo(() => {
    const query = normalizeStr(clientName);
    if (!query) {
      return clients.slice(0, 8);
    }

    const queryDigits = clientName.replace(/\D/g, "");

    return clients
      .map((c) => {
        const nameNorm = normalizeStr(c.name);
        const nameWords = nameNorm.split(/\s+/);
        const emailNorm = normalizeStr(c.email || "");
        const phoneDigits = cleanPhone(c.phone || "");

        // 1. Máxima prioridad: El nombre completo arranca exactamente con lo que escribe
        const startsWithFullName = nameNorm.startsWith(query);
        // 2. Segunda prioridad: Alguno de sus nombres o apellidos arranca con lo que escribe
        const startsWithAnyWord = nameWords.some((w) => w.startsWith(query));
        // 3. Tercera prioridad: Email arranca con la búsqueda
        const startsWithEmail = emailNorm.startsWith(query);
        // 4. Cuarta prioridad: Coincidencia de teléfono
        const matchPhone = queryDigits.length >= 2 && phoneDigits.includes(queryDigits);

        let priority = 0;
        if (startsWithFullName) {
          priority = 4;
        } else if (startsWithAnyWord) {
          priority = 3;
        } else if (startsWithEmail) {
          priority = 2;
        } else if (matchPhone) {
          priority = 1;
        }

        return { client: c, priority };
      })
      .filter((item) => item.priority > 0)
      .sort((a, b) => b.priority - a.priority || a.client.name.localeCompare(b.client.name))
      .map((item) => item.client)
      .slice(0, 6);
  }, [clientName, clients]);

  // Comparador robusto de números de teléfono (ignora espacios, guiones, paréntesis, +549, etc.)
  const matchPhoneNumbers = (inputPhone: string, dbPhone: string): boolean => {
    const p1 = cleanPhone(inputPhone);
    const p2 = cleanPhone(dbPhone);

    if (p1.length < 6 || p2.length < 6) return false;

    // Coincidencia exacta de dígitos
    if (p1 === p2) return true;

    // Comparar terminaciones de 6 a 10 dígitos (por diferencias de código de país/área)
    const minLen = Math.min(p1.length, p2.length);
    for (let len = minLen; len >= 6; len--) {
      if (p1.slice(-len) === p2.slice(-len)) {
        return true;
      }
    }

    return false;
  };

  // Autocompletado y Detección de Plan: Únicamente activo cuando la clienta fue seleccionada o detectada al salir del campo (onBlur)
  const matchedClient = selectedClientObj;

  // Seleccionar una clienta desde el buscador
  const handleSelectClient = (c: Client) => {
    setSelectedClientObj(c);
    setClientName(c.name || "");
    setClientEmail(c.email || "");
    setClientPhone(c.phone || "");
    if (c.healthNotes) {
      setNotes(c.healthNotes);
    }
    setIsDropdownOpen(false);
  };

  // Autocompletar cuando el usuario escribe o sale del input de teléfono
  const handlePhoneChange = (val: string) => {
    const digits = (val || "").replace(/\D/g, "");
    setClientPhone(digits);
    if (digits.length >= 6) {
      const found = clients.find((c) => matchPhoneNumbers(digits, c.phone || ""));
      if (found) {
        setSelectedClientObj(found);
        if (!clientName.trim()) setClientName(found.name);
        if (!clientEmail.trim() && found.email) setClientEmail(found.email);
        if (!notes.trim() && found.healthNotes) setNotes(found.healthNotes);
      }
    }
  };

  const handlePhoneBlur = () => {
    const digits = cleanPhone(clientPhone);
    if (digits.length >= 6) {
      const found = clients.find((c) => matchPhoneNumbers(clientPhone, c.phone || ""));
      if (found) {
        setSelectedClientObj(found);
        if (!clientName.trim()) setClientName(found.name);
        if (!clientEmail.trim() && found.email) setClientEmail(found.email);
        if (!notes.trim() && found.healthNotes) setNotes(found.healthNotes);
      }
    }
  };

  // Autocompletar cuando el usuario escribe o sale del input de correo
  const handleEmailChange = (val: string) => {
    setClientEmail(val);
    const emailNorm = val.trim().toLowerCase();
    if (emailNorm.includes("@") && emailNorm.length >= 5) {
      const found = clients.find((c) => c.email && c.email.trim().toLowerCase() === emailNorm);
      if (found) {
        setSelectedClientObj(found);
        if (!clientName.trim()) setClientName(found.name);
        if (!clientPhone.trim() && found.phone) setClientPhone(found.phone);
        if (!notes.trim() && found.healthNotes) setNotes(found.healthNotes);
      }
    }
  };

  const handleEmailBlur = () => {
    const emailNorm = clientEmail.trim().toLowerCase();
    if (!emailNorm || !emailNorm.includes("@")) return;

    const found = clients.find((c) => c.email && c.email.trim().toLowerCase() === emailNorm);
    if (found) {
      setSelectedClientObj(found);
      if (!clientName.trim()) setClientName(found.name);
      if (!clientPhone.trim() && found.phone) setClientPhone(found.phone);
      if (!notes.trim() && found.healthNotes) setNotes(found.healthNotes);
    }
  };

  // Limpiar campos para ingresar una clienta nueva
  const handleClearClient = () => {
    setSelectedClientObj(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setNotes("");
    setIsDropdownOpen(false);
  };

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
        allowPast: true,
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

      {/* Interactive Client Search Input & Dropdown */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Nombre Completo del Alumno / Buscar Guardados</span>
            <span className="text-rose-500">*</span>
          </label>
          {matchedClient ? (
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
              <Check className="w-3 h-3" />
              <span>Clienta guardada vinculada</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">
              {clients.length} clientas en base de datos
            </span>
          )}
        </div>

        {/* Input Container */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            required
            value={clientName}
            onFocus={() => {
              if (clientName.trim().length >= 1) {
                setIsDropdownOpen(true);
              }
            }}
            onChange={(e) => {
              const val = e.target.value;
              setClientName(val);
              if (val.trim().length >= 1) {
                setIsDropdownOpen(true);
              } else {
                setIsDropdownOpen(false);
              }
              if (selectedClientObj && selectedClientObj.name !== val) {
                setSelectedClientObj(null);
              }
            }}
            placeholder="Escribe el nombre para buscar clienta guardada o ingresar nueva..."
            className="w-full pl-9 pr-16 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />

          {/* Right Action Icons (Clear / Toggle Dropdown) */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {clientName && (
              <button
                type="button"
                onClick={handleClearClient}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Limpiar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Ver todas las clientas guardadas"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Floating Dropdown Results Menu */}
        {isDropdownOpen && (
          <>
            {/* Backdrop to close dropdown on outside click */}
            <div
              className="fixed inset-0 z-20"
              onClick={() => setIsDropdownOpen(false)}
            />

            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-64 flex flex-col animate-in fade-in-50 zoom-in-95 duration-100">
              {/* Header */}
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Clientas Guardadas</span>
                <span>{filteredClients.length} sugerencias</span>
              </div>

              {/* Client List */}
              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      No hay coincidencias para &quot;{clientName}&quot;
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Puedes completar los datos abajo para registrar a esta clienta como nueva.
                    </p>
                  </div>
                ) : (
                  filteredClients.map((c) => {
                    const isSelected = matchedClient?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}>
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs truncate flex items-center gap-1.5">
                              <span>{c.name}</span>
                              {c.planName && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                  {c.planName}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-2">
                              {c.phone && <span>📞 {c.phone}</span>}
                              {c.email && <span className="truncate">✉️ {c.email}</span>}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
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
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
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
              inputMode="numeric"
              value={clientPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={handlePhoneBlur}
              placeholder="1112345678"
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
