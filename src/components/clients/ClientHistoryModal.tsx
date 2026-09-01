"use client";

import React, { useState, useMemo } from "react";
import { Client, Booking, Plan } from "@/types";
import { useData } from "@/context/DataContext";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import {
  X,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  User,
  Phone,
  Mail,
  HeartPulse,
  Settings2,
  CalendarDays,
  ListOrdered,
} from "lucide-react";

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

function getMondayFromDateStr(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr + "T12:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  return `${monday.getDate()} ${months[monday.getMonth()]} - ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

export function ClientHistoryModal({ isOpen, onClose, client }: ClientHistoryModalProps) {
  const { bookings, plans, updateClient, toggleClientWeeklyPayment } = useData();
  const [activeTab, setActiveTab] = useState<"weeks" | "all" | "settings">("weeks");
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  // Form states for quick client settings
  const [customPrice, setCustomPrice] = useState<number | undefined>(client?.customPrice);
  const [billingFrequency, setBillingFrequency] = useState<"weekly" | "monthly">(
    client?.billingFrequency || "weekly"
  );
  const [planId, setPlanId] = useState(client?.planId || "");
  const [savingSettings, setSavingSettings] = useState(false);

  React.useEffect(() => {
    if (client) {
      setCustomPrice(client.customPrice);
      setBillingFrequency(client.billingFrequency || "weekly");
      setPlanId(client.planId || "");
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const assignedPlan = plans.find((p) => p.id === client.planId);
  const maxWeekly = assignedPlan ? assignedPlan.classesPerWeek : (client.planClassesPerWeek || 0);

  // Todas las reservas del cliente
  const clientBookings = bookings.filter((b) => {
    const matchesEmail = client.email && b.clientEmail && b.clientEmail.toLowerCase() === client.email.toLowerCase();
    const matchesPhone = client.phone && b.clientPhone && b.clientPhone === client.phone;
    const matchesName = b.clientName.toLowerCase() === client.name.toLowerCase();
    return matchesEmail || matchesPhone || matchesName;
  }).sort((a, b) => (b.shiftDate + b.shiftTime).localeCompare(a.shiftDate + a.shiftTime));

  // Agrupación por semana (Lunes a Domingo)
  const bookingsByWeek = useMemo(() => {
    const map: Record<string, Booking[]> = {};

    clientBookings.forEach((b) => {
      const mondayStr = getMondayFromDateStr(b.shiftDate);
      if (!map[mondayStr]) map[mondayStr] = [];
      map[mondayStr].push(b);
    });

    // Ordenar semanas de más reciente a más antigua
    const sortedWeeks = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return sortedWeeks.map((mondayStr) => {
      const weekBookings = map[mondayStr].sort((a, b) => (a.shiftDate + a.shiftTime).localeCompare(b.shiftDate + b.shiftTime));
      const activeBookings = weekBookings.filter((b) => b.status !== "cancelled");
      const isPaid = !!(client.weeklyPayments && client.weeklyPayments[mondayStr]);

      return {
        mondayStr,
        rangeLabel: formatWeekRange(mondayStr),
        bookings: weekBookings,
        activeCount: activeBookings.length,
        isPaid,
      };
    });
  }, [clientBookings, client.weeklyPayments]);

  const toggleWeekExpand = (mondayStr: string) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [mondayStr]: !prev[mondayStr],
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const selPlan = plans.find((p) => p.id === planId);
    try {
      await updateClient(client.id, {
        planId: planId || "",
        planName: selPlan ? selPlan.name : "",
        planClassesPerWeek: selPlan ? selPlan.classesPerWeek : 0,
        customPrice: customPrice !== undefined ? Number(customPrice) : selPlan?.price,
        billingFrequency,
      });
      setActiveTab("weeks");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const activePriceDisplay = client.customPrice !== undefined
    ? client.customPrice
    : assignedPlan?.price || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl animate-modal my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  {client.name}
                </h2>
                {assignedPlan && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {assignedPlan.name}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5 font-medium">
                {client.phone && <span>📞 {client.phone}</span>}
                {client.email && <span>✉️ {client.email}</span>}
                <span>• Cobro {client.billingFrequency === "monthly" ? "Mensual" : "Semanal"}: ${activePriceDisplay.toLocaleString("es-AR")}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("weeks")}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === "weeks"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Turnos Semana a Semana & Pagos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Historial Completo ({clientBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ml-auto ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Ajustar Cobro & Plan</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 scrollbar-thin">
          {/* TAB 1: SEMANAS Y PAGOS */}
          {activeTab === "weeks" && (
            <div className="space-y-3">
              {bookingsByWeek.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No hay registros de clases para este alumno aún.
                </div>
              ) : (
                bookingsByWeek.map((week) => {
                  const isExpanded = !!expandedWeeks[week.mondayStr];
                  const hasPlan = !!client.planId;
                  const isFullQuota = hasPlan && week.activeCount >= maxWeekly;

                  return (
                    <div
                      key={week.mondayStr}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 overflow-hidden shadow-2xs"
                    >
                      {/* Week Card Header */}
                      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/60">
                        {/* Week Title and Quota */}
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => toggleWeekExpand(week.mondayStr)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                            <Calendar className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <span>Semana: {week.rangeLabel}</span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                              <span className={isFullQuota ? "text-rose-600 dark:text-rose-400 font-bold" : "text-indigo-600 dark:text-indigo-400 font-bold"}>
                                {week.activeCount} {hasPlan ? `de ${maxWeekly}` : ""} {week.activeCount === 1 ? "turno usado" : "turnos usados"}
                              </span>
                              <span>•</span>
                              <span className="text-[11px] text-slate-400">
                                {isExpanded ? "Toca para ocultar detalle" : "Toca para ver clases"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Toggle & Expand Arrow */}
                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => toggleClientWeeklyPayment(client.id, week.mondayStr)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              week.isPaid
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
                            }`}
                            title="Haz clic para alternar el pago de esta semana"
                          >
                            {week.isPaid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Pagada</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span>Pendiente</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleWeekExpand(week.mondayStr)}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Shifts Detail of this week */}
                      {isExpanded && (
                        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Clases tomadas en esta semana:
                          </div>

                          {week.bookings.map((b) => (
                            <div
                              key={b.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                  <span>{b.shiftTitle}</span>
                                  <DisciplineBadge discipline={b.discipline} size="sm" />
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                  <span>📅 {b.shiftDate}</span>
                                  <span>⏰ {b.shiftTime} hs</span>
                                  <span>👤 {b.instructorName}</span>
                                </div>
                              </div>

                              <div>
                                {b.status === "cancelled" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                    Cancelada
                                  </span>
                                ) : b.status === "attended" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    Asistió
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                                    Confirmada
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: HISTORIAL COMPLETO */}
          {activeTab === "all" && (
            <div className="space-y-2">
              {clientBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Sin reservas registradas.
                </div>
              ) : (
                clientBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{b.shiftTitle}</span>
                        <DisciplineBadge discipline={b.discipline} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>{b.shiftDate}</span>
                        <span>{b.shiftTime} hs</span>
                        <span>Prof. {b.instructorName}</span>
                      </div>
                    </div>

                    <div>
                      {b.status === "cancelled" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">
                          Cancelada
                        </span>
                      ) : b.status === "attended" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          Asistió
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                          Confirmada
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: AJUSTES DE COBRO & PLAN */}
          {activeTab === "settings" && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Modalidad de Cobro y Membresía de {client.name}
                </h4>

                {/* Billing Frequency (Semanal o Mensual) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Frecuencia de Cobro
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBillingFrequency("weekly")}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        billingFrequency === "weekly"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      📅 Cobro Semanal
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingFrequency("monthly")}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        billingFrequency === "monthly"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      🗓️ Cobro Mensual
                    </button>
                  </div>
                </div>

                {/* Plan Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plan Asignado
                  </label>
                  <select
                    value={planId}
                    onChange={(e) => {
                      setPlanId(e.target.value);
                      const p = plans.find((x) => x.id === e.target.value);
                      if (p && customPrice === undefined) {
                        setCustomPrice(p.price);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Sin Plan (Clase suelta)</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.classesPerWeek} clases x semana) - Base: ${p.price.toLocaleString("es-AR")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Adjusted Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Arancel Ajustado Personalizado ($)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={customPrice !== undefined ? customPrice : ""}
                    onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ej. 14000 o 52000"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Si dejas este campo en blanco, se usará el valor base del plan seleccionado.
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold btn-primary"
                >
                  {savingSettings ? "Guardando..." : "Guardar Ajustes de Cobro"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
