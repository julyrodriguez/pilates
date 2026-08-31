"use client";

import React, { useState } from "react";
import { Shift } from "@/types";
import { useData } from "@/context/DataContext";
import { User, Mail, Phone, HeartPulse, Sparkles } from "lucide-react";

interface PublicBookingFormProps {
  shift: Shift;
  onSuccess: (result: { cancellationCode: string; cancellationUrl: string; booking: any }) => void;
  onCancel: () => void;
}

export function PublicBookingForm({ shift, onSuccess, onCancel }: PublicBookingFormProps) {
  const { createBooking } = useData();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await createBooking({
        shiftId: shift.id,
        clientName,
        clientEmail,
        clientPhone,
        notes,
      });
      onSuccess(result);
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

      {/* Summary Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
        <div className="font-bold text-slate-900 dark:text-slate-100">{shift.title}</div>
        <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
          {shift.date} • {shift.startTime} a {shift.endTime} hs
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
          Prof. {shift.instructorName} • {shift.room}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Tu Nombre y Apellido
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

      {/* Email */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Tu Correo Electrónico
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            required
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="martina@ejemplo.com"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
          Te enviaremos el comprobante y el enlace único de cancelación aquí.
        </span>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Teléfono WhatsApp (para avisos)
        </label>
        <div className="relative">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            required
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+54 9 11 5500-1122"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

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
            placeholder="Ej. Lesión cervical, primer trimestre embarazo, etc."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl text-xs font-bold btn-primary disabled:opacity-50 flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>{submitting ? "Reservando tu lugar..." : "Completar mi Reserva"}</span>
        </button>
      </div>
    </form>
  );
}
