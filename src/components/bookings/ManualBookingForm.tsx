"use client";

import React, { useState } from "react";
import { Shift } from "@/types";
import { useData } from "@/context/DataContext";
import { User, Mail, Phone, Calendar, HeartPulse, CheckCircle2 } from "lucide-react";

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
  const { shifts, createBooking } = useData();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId) {
      setError("Por favor, selecciona un turno disponible.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createBooking({
        shiftId,
        clientName,
        clientEmail,
        clientPhone,
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
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Select Shift */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
          Turno / Clase
        </label>
        <select
          required
          value={shiftId}
          onChange={(e) => setShiftId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
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
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-rose-300/70">
            <span>Sala: {currentSelectedShift.room}</span>
            <span className="font-bold text-rose-600 dark:text-rose-300">
              Valor: ${currentSelectedShift.price.toLocaleString("es-AR")}
            </span>
          </div>
        )}
      </div>

      {/* Student Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
          Nombre Completo del Alumno
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej. Martina Silveyra"
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
          />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Correo Electrónico (para confirmación y link)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="alumno@ejemplo.com"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Teléfono de Contacto (WhatsApp)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              required
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+54 9 11 ..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
            />
          </div>
        </div>
      </div>

      {/* Notes / Postural requirements */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
          Observaciones posturales o de salud (Opcional)
        </label>
        <div className="relative">
          <HeartPulse className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Hernia de disco lumbar L5-S1, embarazo semana 18, molestia en hombro..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-200/50 dark:border-rose-900/30">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-rose-900/40 text-xs font-semibold text-slate-700 dark:text-rose-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !shiftId}
          className="px-5 py-2 rounded-xl text-xs font-bold btn-rose-primary disabled:opacity-50 flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{loading ? "Confirmando..." : "Confirmar Reserva"}</span>
        </button>
      </div>
    </form>
  );
}
