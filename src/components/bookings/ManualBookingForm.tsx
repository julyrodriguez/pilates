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
  Sparkles,
  Lock,
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
  const { shifts, clients, bookings, createBooking } = useData();

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

  const currentSelectedShift = shifts.find((s) => s.id === shiftId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Warning si ya está inscripto en el turno */}
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

      {/* Select Shift */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Turno / Clase
        </label>
        <select
          required
          value={shiftId}
          onChange={(e) => setShiftId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
        >
          {availableShifts.length === 0 ? (
            <option value="">No hay turnos con cupos libres</option>
          ) : (
            availableShifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.date} • {s.startTime} hs - {s.title} ({s.instructorName}) [
                {s.capacity - s.bookedCount} cupos libres]
              </option>
            ))
          )}
        </select>
        {currentSelectedShift && (
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Sala: {currentSelectedShift.room}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              Valor: ${currentSelectedShift.price.toLocaleString("es-AR")}
            </span>
          </div>
        )}
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
