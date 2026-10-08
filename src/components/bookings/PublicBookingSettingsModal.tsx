"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { BlockedDate } from "@/types";
import { formatDateSpanish } from "@/lib/dateUtils";
import {
  X,
  SlidersHorizontal,
  Calendar,
  CalendarX,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";

interface PublicBookingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublicBookingSettingsModal({
  isOpen,
  onClose,
}: PublicBookingSettingsModalProps) {
  const { settings, updateSettings } = useData();

  // Local form state
  const [weeksAhead, setWeeksAhead] = useState<number>(2);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [publicNoticeBanner, setPublicNoticeBanner] = useState<string>("");

  // Add blocked date form state
  const [newDate, setNewDate] = useState<string>("");
  const [newReason, setNewReason] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Today in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Sync state when modal opens or settings changes
  useEffect(() => {
    if (isOpen && settings) {
      setWeeksAhead(settings.bookingWeeksAhead ?? 2);
      setBlockedDates(Array.isArray(settings.blockedDates) ? [...settings.blockedDates] : []);
      setPublicNoticeBanner(settings.publicNoticeBanner || "");
      setNewDate("");
      setNewReason("");
      setInputError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleAddBlockedDate = () => {
    setInputError(null);
    if (!newDate) {
      setInputError("Por favor selecciona una fecha.");
      return;
    }

    if (blockedDates.some((b) => b.date === newDate)) {
      setInputError("Esta fecha ya se encuentra en la lista de días bloqueados.");
      return;
    }

    const newItem: BlockedDate = {
      date: newDate,
      reason: newReason.trim() || "Cerrado",
      createdAt: new Date().toISOString(),
    };

    setBlockedDates((prev) => [...prev, newItem].sort((a, b) => a.date.localeCompare(b.date)));
    setNewDate("");
    setNewReason("");
  };

  const handleRemoveBlockedDate = (dateToRemove: string) => {
    setBlockedDates((prev) => prev.filter((b) => b.date !== dateToRemove));
  };

  const handleClearPastDates = () => {
    setBlockedDates((prev) => prev.filter((b) => b.date >= todayStr));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setInputError(null);
    try {
      await updateSettings({
        bookingWeeksAhead: weeksAhead,
        blockedDates: blockedDates,
        publicNoticeBanner: publicNoticeBanner.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    } catch (err) {
      console.error("Error guardando ajustes del portal de reservas:", err);
      setInputError("Ocurrió un error al guardar los ajustes. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasPastDates = blockedDates.some((b) => b.date < todayStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl animate-modal my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Configurar Portal de Reservas</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Controla qué semanas y días específicos ven y reservan las clientas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-1">
          {/* Quick preview link */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Ver cómo lo ven las clientas en tiempo real:</span>
            </div>
            <a
              href="/reservar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Abrir /reservar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 1. Control de Semanas Visibles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Semanas Visibles a Futuro</span>
              </label>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {weeksAhead} {weeksAhead === 1 ? "semana" : "semanas"} activa{weeksAhead === 1 ? "" : "s"}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Determina con cuánta anticipación pueden ver y agendar turnos las clientas en el calendario:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { count: 1, label: "1 Semana", desc: "Solo semana en curso" },
                { count: 2, label: "2 Semanas", desc: "Actual y siguiente (Recomendado)" },
                { count: 3, label: "3 Semanas", desc: "Hasta 3 semanas" },
                { count: 4, label: "4 Semanas", desc: "Mes completo" },
              ].map((opt) => {
                const isSelected = weeksAhead === opt.count;
                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setWeeksAhead(opt.count)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-2xs"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Días Bloqueados / Feriados */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CalendarX className="w-3.5 h-3.5 text-rose-500" />
                  <span>Días Bloqueados / Feriados Específicos</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Inhabilita días puntuales (ej. 12/10 feriado, mantenimiento o vacaciones). Las clientas los verán como cerrados.
                </p>
              </div>

              {hasPastDates && (
                <button
                  type="button"
                  onClick={handleClearPastDates}
                  className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium cursor-pointer"
                >
                  Limpiar fechas pasadas
                </button>
              )}
            </div>

            {/* Form to add a blocked day */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Bloquear nueva fecha:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-indigo-500"
                  />
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Motivo (ej. Feriado 12/10, Cerrado...)"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddBlockedDate();
                      }
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddBlockedDate}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bloquear</span>
                  </button>
                </div>
              </div>

              {inputError && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {inputError}
                </p>
              )}
            </div>

            {/* List of blocked dates */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fechas bloqueadas actualmente ({blockedDates.length})
              </span>

              {blockedDates.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
                  No hay días bloqueados. El estudio muestra disponibilidad habitual para todas las fechas con clases creadas.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {blockedDates.map((item) => {
                    const isPast = item.date < todayStr;
                    return (
                      <div
                        key={item.date}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                          isPast
                            ? "bg-slate-100/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-60"
                            : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {formatDateSpanish(item.date)}
                            </span>
                            {isPast && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                                Pasado
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium truncate">
                            {item.reason || "Cerrado"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDate(item.date)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/80 transition-colors cursor-pointer shrink-0"
                          title="Desbloquear este día"
                          aria-label={`Desbloquear fecha ${item.date}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. Aviso Informativo Superior para Clientas */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Aviso Informativo para Clientas (Opcional)</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Si escribes un texto aquí, aparecerá como un cartel de aviso destacado en la parte superior de la página de reservas:
            </p>
            <input
              type="text"
              value={publicNoticeBanner}
              onChange={(e) => setPublicNoticeBanner(e.target.value)}
              placeholder="Ej: Recordá que el 12/10 el estudio permanecerá cerrado por feriado nacional."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                ¡Cambios guardados con éxito!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
