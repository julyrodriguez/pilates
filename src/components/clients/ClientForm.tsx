"use client";

import React, { useState } from "react";
import { Client } from "@/types";
import { User, Mail, Phone, HeartPulse } from "lucide-react";

interface ClientFormProps {
  initialClient?: Client | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientForm({ initialClient, onSuccess, onCancel }: ClientFormProps) {
  const [name, setName] = useState(initialClient?.name || "");
  const [email, setEmail] = useState(initialClient?.email || "");
  const [phone, setPhone] = useState(initialClient?.phone || "");
  const [healthNotes, setHealthNotes] = useState(initialClient?.healthNotes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulating instant save / update
    setTimeout(() => {
      setSaving(false);
      onSuccess();
    }, 200);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
          Nombre Completo
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Sofía Benítez"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alumno@ejemplo.com"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Teléfono
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 9 11 ..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
          Notas Clínicas / Patologías Posturales
        </label>
        <div className="relative">
          <HeartPulse className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows={2}
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            placeholder="Ej. Escoliosis leve, hiperlaxitud, rehabilitación de meniscos..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
          />
        </div>
      </div>

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
          disabled={saving}
          className="px-5 py-2 rounded-xl text-xs font-bold btn-rose-primary"
        >
          {saving ? "Guardando..." : "Guardar Alumno"}
        </button>
      </div>
    </form>
  );
}
