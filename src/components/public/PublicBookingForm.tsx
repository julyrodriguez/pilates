"use client";

import React, { useState, useMemo } from "react";
import { Shift } from "@/types";
import { useData } from "@/context/DataContext";
import {
  User,
  Mail,
  Phone,
  HeartPulse,
  Sparkles,
  Award,
  CheckSquare,
  Square,
  CalendarPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  MapPin,
} from "lucide-react";

interface PublicBookingFormProps {
  shift: Shift;
  onSuccess: (result: { cancellationCode: string; cancellationUrl: string; booking: any }) => void;
  onCancel: () => void;
}

export function PublicBookingForm({ shift, onSuccess, onCancel }: PublicBookingFormProps) {
  const { createBooking, clients, shifts, getClientWeeklyUsage } = useData();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [additionalShiftIds, setAdditionalShiftIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para normalizar números de teléfono para comparación flexible
  const cleanPhone = (val: string) => val.replace(/\D/g, "");

  // Buscar clienta por email o teléfono
  const matchedClient = useMemo(() => {
    const emailNorm = clientEmail.trim().toLowerCase();
    const phoneDigits = cleanPhone(clientPhone);

    if (!emailNorm && phoneDigits.length < 6) return null;

    return clients.find((c) => {
      const matchEmail = Boolean(emailNorm && c.email && c.email.toLowerCase() === emailNorm);
      const clientPhoneDigits = cleanPhone(c.phone || "");
      const matchPhone = Boolean(
        phoneDigits.length >= 6 &&
        clientPhoneDigits.length >= 6 &&
        (clientPhoneDigits.endsWith(phoneDigits) ||
         phoneDigits.endsWith(clientPhoneDigits) ||
         clientPhoneDigits === phoneDigits)
      );

      return matchEmail || matchPhone;
    });
  }, [clientEmail, clientPhone, clients]);

  // Si encontramos a la clienta, autorrellenar nombre, correo y teléfono bidireccionalmente
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

  // Obtener uso semanal de su plan para la semana de este turno
  const weeklyUsage = useMemo(() => {
    if (!matchedClient) {
      return { used: 0, total: 0, remaining: 0, planName: "", hasPlan: false };
    }
    return getClientWeeklyUsage(matchedClient.id, shift.date);
  }, [matchedClient, getClientWeeklyUsage, shift.date]);

  // Otras clases disponibles de la misma semana para sumar al plan
  const otherAvailableWeekShifts = useMemo(() => {
    const baseDate = new Date(shift.date + "T12:00:00");
    const monday = new Date(baseDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const mondayStr = monday.toISOString().split("T")[0];
    const sundayStr = sunday.toISOString().split("T")[0];

    return shifts.filter((s) => {
      if (s.id === shift.id) return false;
      if (s.date < mondayStr || s.date > sundayStr) return false;
      if (s.bookedCount >= s.capacity) return false; // solo clases con lugar
      return true;
    }).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [shifts, shift]);

  // Cantidad máxima de clases ADICIONALES que puede sumar (además de la principal)
  // SOLO disponible si el usuario ingresó sus datos y es miembro de un plan con cupo restante
  const maxAdditionalShifts = useMemo(() => {
    if (weeklyUsage.hasPlan) {
      return Math.max(0, weeklyUsage.remaining - 1);
    }
    return 0; // Particulares o sin datos NO ven la opción de agendar más clases
  }, [weeklyUsage]);

  // Días laborables (Lunes a Viernes) de la semana del turno para el selector
  const weekDays = useMemo(() => {
    const baseDate = new Date(shift.date + "T12:00:00");
    const monday = new Date(baseDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);

    const namesShort = ["Lun", "Mar", "Mié", "Jue", "Vie"];
    const namesFull = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    const list = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const count = otherAvailableWeekShifts.filter((s) => s.date === dateStr).length;
      list.push({
        dateStr,
        dayNum: d.getDate(),
        dayShort: namesShort[i],
        dayFull: namesFull[i],
        count,
      });
    }
    return list;
  }, [shift.date, otherAvailableWeekShifts]);

  const [selectedAddDay, setSelectedAddDay] = useState<string>(() => {
    return shift.date;
  });

  // Clases filtradas por el día seleccionado
  const shiftsForSelectedAddDay = useMemo(() => {
    return otherAvailableWeekShifts.filter((s) => s.date === selectedAddDay);
  }, [otherAvailableWeekShifts, selectedAddDay]);

  // Si deja de ser miembro de plan o cambia email, limpiar selecciones adicionales
  React.useEffect(() => {
    if (!weeklyUsage.hasPlan) {
      setAdditionalShiftIds([]);
    }
  }, [weeklyUsage.hasPlan]);

  const toggleAdditionalShift = (id: string) => {
    setAdditionalShiftIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= maxAdditionalShifts) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const totalShiftsToBook = 1 + additionalShiftIds.length;

  // Validaciones de formulario
  const hasContactInfo = clientEmail.trim().length > 0 || clientPhone.trim().length > 0;
  const hasNameInfo = clientName.trim().length > 0;
  const isFormValid = hasNameInfo && hasContactInfo;
  const isPlanQuotaExceeded = weeklyUsage.hasPlan && weeklyUsage.remaining === 0;
  const isSubmitDisabled = submitting || !isFormValid || isPlanQuotaExceeded;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasNameInfo) {
      setError("Por favor ingresa tu nombre y apellido.");
      return;
    }

    if (!hasContactInfo) {
      setError("Debes ingresar al menos un medio de contacto: Correo Electrónico o Teléfono / WhatsApp.");
      return;
    }

    if (isPlanQuotaExceeded) {
      setError("Has alcanzado el límite de clases semanales de tu plan. No puedes reservar más turnos para esta semana.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Reservar clase principal
      const mainResult = await createBooking({
        shiftId: shift.id,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        notes,
      });

      // 2. Reservar clases adicionales si seleccionó más de una
      for (const addId of additionalShiftIds) {
        await createBooking({
          shiftId: addId,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim(),
          notes: notes ? `${notes} (Reserva grupal semanal)` : "Reserva grupal semanal",
        });
      }

      onSuccess(mainResult);
    } catch (err: any) {
      setError(err.message || "Error al completar tu reserva.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Shift Highlight Banner */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
            Clase Principal Seleccionada
          </span>
          {weeklyUsage.hasPlan ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-600 text-white shadow-2xs">
              ✨ Incluido en tu Plan
            </span>
          ) : (
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              ${shift.price.toLocaleString("es-AR")}
            </span>
          )}
        </div>

        <div className="font-black text-slate-900 dark:text-slate-100 text-sm">{shift.title}</div>
        <div className="text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{shift.date} • {shift.startTime} a {shift.endTime} hs</span>
        </div>
        <div className="text-slate-600 dark:text-slate-300 text-[11px] flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Cesar Diaz 3031, CABA • {shift.room} (Prof. {shift.instructorName})</span>
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Tu Correo Electrónico <span className="text-slate-400 font-normal">(Recomendado)</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="martina@ejemplo.com"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Phone Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Teléfono / WhatsApp
        </label>
        <div className="relative">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="11 1234 5678"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Name Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Tu Nombre y Apellido <span className="text-rose-500">*</span>
        </label>
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
      </div>

      {/* Plan Status Banner (Si la clienta tiene Plan) */}
      {weeklyUsage.hasPlan && (
        weeklyUsage.remaining === 0 ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Cupo Semanal Completo (0 turnos disponibles)</span>
            </div>
            <p className="leading-relaxed">
              Ya has utilizado los <strong>{weeklyUsage.total} de {weeklyUsage.total} turnos</strong> permitidos de tu <strong>{weeklyUsage.planName}</strong> para esta semana.
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              No es posible reservar más clases para esta semana dentro de tu plan. Si necesitas una clase adicional fuera de abono, comunícate con la recepción.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Miembro activa de {weeklyUsage.planName}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                {weeklyUsage.remaining} {weeklyUsage.remaining === 1 ? "turno disponible" : "turnos disponibles"}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              Esta semana utilizaste <strong>{weeklyUsage.used} de {weeklyUsage.total} turnos</strong> de tu abono.
            </div>
          </div>
        )
      )}

      {/* Selector de Clases Adicionales de la Misma Semana (SOLO para Miembros de Plan con cupo disponible) */}
      {weeklyUsage.hasPlan && otherAvailableWeekShifts.length > 0 && maxAdditionalShifts > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <CalendarPlus className="w-4 h-4" />
              <span>Sumar otra clase para esta semana</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {additionalShiftIds.length} de {maxAdditionalShifts} extra seleccionadas
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Selecciona el día para ver los turnos disponibles y sumarlos a tu plan:
          </p>

          {/* 5-Day Selector Grid */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
            {weekDays.map((d) => {
              const isSelected = d.dateStr === selectedAddDay;
              const hasShifts = d.count > 0;
              const hasSelectedShiftInThisDay = additionalShiftIds.some((id) =>
                otherAvailableWeekShifts.some((s) => s.id === id && s.date === d.dateStr)
              );

              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedAddDay(d.dateStr)}
                  className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40 font-black"
                      : hasShifts
                      ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                      : "bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border border-transparent opacity-60"
                  }`}
                >
                  {hasSelectedShiftInThisDay && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                  <span className="text-[9px] uppercase font-bold tracking-wider">{d.dayShort}</span>
                  <span className="text-xs font-black">{d.dayNum}</span>
                  <span className={`text-[8px] font-bold mt-0.5 px-1 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {d.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Classes list for selected day */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-0.5">
            {shiftsForSelectedAddDay.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                No hay turnos con cupo libre para el día seleccionado.
              </div>
            ) : (
              shiftsForSelectedAddDay.map((s) => {
                const isChecked = additionalShiftIds.includes(s.id);
                const disabled = !isChecked && additionalShiftIds.length >= maxAdditionalShifts;

                return (
                  <div
                    key={s.id}
                    onClick={() => !disabled && toggleAdditionalShift(s.id)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : disabled
                        ? "opacity-40 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 pointer-events-none"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-bold block truncate">{s.title}</span>
                        <div className={`text-[10px] ${isChecked ? "text-indigo-100" : "text-slate-400"}`}>
                          ⏰ {s.startTime} a {s.endTime} hs • Prof. {s.instructorName}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-full ${
                      isChecked ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {s.capacity - s.bookedCount} libres
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Health / Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          ¿Tienes alguna lesión o condición física a tener en cuenta? (Opcional)
        </label>
        <div className="relative">
          <HeartPulse className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Dolor lumbar, embarazo, rehabilitación..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
            isSubmitDisabled
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700"
              : "btn-primary"
          }`}
        >
          {isSubmitDisabled && !submitting ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>
            {submitting
              ? "Confirmando..."
              : isPlanQuotaExceeded
              ? "Cupo Semanal Completo (Sin turnos)"
              : !isFormValid
              ? "Completa tus datos para reservar"
              : weeklyUsage.hasPlan
              ? totalShiftsToBook > 1
                ? `Confirmar ${totalShiftsToBook} Clases (Tu Plan)`
                : "Confirmar Clase (Tu Plan)"
              : totalShiftsToBook > 1
              ? `Confirmar ${totalShiftsToBook} Clases`
              : "Confirmar Reserva"}
          </span>
        </button>
      </div>
    </form>
  );
}
