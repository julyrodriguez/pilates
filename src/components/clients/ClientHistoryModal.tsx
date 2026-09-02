"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Client, Booking, Plan } from "@/types";
import { useData } from "@/context/DataContext";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
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
  CreditCard,
  List,
  Loader2,
  Trash2,
} from "lucide-react";
import { ConfirmModal } from "@/components/common/ConfirmModal";

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
  const { bookings: fallbackBookings, plans, updateClient, deleteClient, toggleClientWeeklyPayment } = useData();
  const [activeTab, setActiveTab] = useState<"weeks" | "all" | "settings">("weeks");
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [weekPaymentToConfirm, setWeekPaymentToConfirm] = useState<{
    mondayStr: string;
    rangeLabel: string;
    isPaid: boolean;
  } | null>(null);

  // Firestore on-demand state for this client
  const [fetchedBookings, setFetchedBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !client) {
      setFetchedBookings([]);
      return;
    }

    let isMounted = true;
    const db = getFirebaseDb();
    if (!db) return;

    setLoadingBookings(true);

    let q;
    if (client.email) {
      q = query(collection(db, "pilates_bookings"), where("clientEmail", "==", client.email));
    } else if (client.phone) {
      q = query(collection(db, "pilates_bookings"), where("clientPhone", "==", client.phone));
    } else {
      q = query(collection(db, "pilates_bookings"), where("clientName", "==", client.name));
    }

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!isMounted) return;
        const loaded = snap.docs
          .map((d) => d.data() as Booking)
          .filter((b) => b && b.id && !b.id.startsWith("_"));
        setFetchedBookings(loaded);
        setLoadingBookings(false);
      },
      (err) => {
        console.warn("Error fetching client bookings on demand:", err);
        if (isMounted) setLoadingBookings(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isOpen, client]);

  // Form states for quick client settings
  const [hasCustomPrice, setHasCustomPrice] = useState(
    client?.customPrice !== undefined && client?.customPrice !== null
  );
  const [customPrice, setCustomPrice] = useState<number | undefined>(client?.customPrice);
  const [billingFrequency, setBillingFrequency] = useState<"weekly" | "monthly">(
    client?.billingFrequency || "weekly"
  );
  const [planId, setPlanId] = useState(client?.planId || "");
  const [savingSettings, setSavingSettings] = useState(false);

  React.useEffect(() => {
    if (client) {
      setCustomPrice(client.customPrice);
      setHasCustomPrice(client.customPrice !== undefined && client.customPrice !== null);
      setBillingFrequency(client.billingFrequency || "weekly");
      setPlanId(client.planId || "");
    }
  }, [client]);

  // Todas las reservas del cliente
  const clientBookings = useMemo(() => {
    if (!client) return [];
    const sourceBookings = fetchedBookings.length > 0 || loadingBookings ? fetchedBookings : fallbackBookings;
    return sourceBookings.filter((b) => {
      const matchesEmail = Boolean(client.email && b.clientEmail && b.clientEmail.toLowerCase() === client.email.toLowerCase());
      const matchesPhone = Boolean(client.phone && b.clientPhone && b.clientPhone === client.phone);
      const matchesName = Boolean(b.clientName && b.clientName.toLowerCase() === client.name.toLowerCase());
      return matchesEmail || matchesPhone || matchesName;
    }).sort((a, b) => (b.shiftDate + b.shiftTime).localeCompare(a.shiftDate + a.shiftTime));
  }, [fetchedBookings, loadingBookings, fallbackBookings, client]);

  // Agrupación por semana (Lunes a Domingo) calculada incondicionalmente
  const bookingsByWeek = useMemo(() => {
    if (!client) return [];
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
      const isPaid = Boolean(client.weeklyPayments && client.weeklyPayments[mondayStr]);

      return {
        mondayStr,
        rangeLabel: formatWeekRange(mondayStr),
        bookings: weekBookings,
        activeCount: activeBookings.length,
        isPaid,
      };
    });
  }, [clientBookings, client]);

  const assignedPlan = useMemo(() => {
    if (!client?.planId) return null;
    return plans.find((p) => p.id === client.planId);
  }, [client?.planId, plans]);

  if (!isOpen || !client) return null;

  const maxWeekly = assignedPlan ? assignedPlan.classesPerWeek : (client.planClassesPerWeek || 0);

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
    const finalCustomPrice =
      planId && hasCustomPrice && customPrice !== undefined && !isNaN(Number(customPrice))
        ? Number(customPrice)
        : undefined;

    try {
      await updateClient(client.id, {
        planId: planId || "",
        planName: selPlan ? selPlan.name : "",
        planClassesPerWeek: selPlan ? selPlan.classesPerWeek : 0,
        customPrice: finalCustomPrice,
        billingFrequency,
      });
      setActiveTab("weeks");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const activePriceDisplay = client.planId
    ? client.customPrice !== undefined
      ? client.customPrice
      : assignedPlan?.price || 0
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl animate-modal my-4 sm:my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0">
              {client.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                  {client.name}
                </h2>
                {assignedPlan && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                    {assignedPlan.name}
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-medium">
                {client.phone && <span>📞 {client.phone}</span>}
                {client.email && <span className="truncate max-w-[180px] sm:max-w-none">✉️ {client.email}</span>}
                {activePriceDisplay !== null ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    • {client.billingFrequency === "monthly" ? "Mensual" : "Semanal"}: ${activePriceDisplay.toLocaleString("es-AR")}
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">
                    • Sin Plan (Clase suelta)
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Symmetric Segmented Control */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mt-3 sm:mt-4 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("weeks")}
            className={`py-2 px-1.5 sm:px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === "weeks"
                ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Semanas</span>
              <span className="hidden sm:inline">Semana a Semana</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`py-2 px-1.5 sm:px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === "all"
                ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Historial ({clientBookings.length})</span>
              <span className="hidden sm:inline">Historial ({clientBookings.length})</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`py-2 px-1.5 sm:px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === "settings"
                ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Ajustes</span>
              <span className="hidden sm:inline">Ajustes de Plan</span>
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-3 pr-0.5 sm:pr-1 scrollbar-thin">
          {/* TAB 1: SEMANAS Y PAGOS */}
          {activeTab === "weeks" && (
            <div className="space-y-3">
              {bookingsByWeek.length === 0 ? (
                <div className="py-12 sm:py-16 text-center text-slate-400 text-xs">
                  <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Sin clases registradas</p>
                  <p className="mt-0.5 text-slate-400">No hay registros de turnos para este alumno aún.</p>
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
                      <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                            onClick={() => toggleWeekExpand(week.mondayStr)}
                          >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                                Semana: {week.rangeLabel}
                              </div>
                              <div className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                                <span className={isFullQuota ? "text-rose-600 dark:text-rose-400 font-bold" : "text-indigo-600 dark:text-indigo-400 font-bold"}>
                                  {week.activeCount} {hasPlan ? `de ${maxWeekly}` : ""} {week.activeCount === 1 ? "turno" : "turnos"}
                                </span>
                                <span>•</span>
                                <span className="text-[10px] sm:text-[11px] text-slate-400">
                                  {isExpanded ? "Ocultar" : "Ver clases"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleWeekExpand(week.mondayStr)}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Payment Toggle Row */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Estado del abono:
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setWeekPaymentToConfirm({
                                mondayStr: week.mondayStr,
                                rangeLabel: week.rangeLabel,
                                isPaid: week.isPaid,
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                              week.isPaid
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                            }`}
                            title="Haz clic para alternar el pago de esta semana"
                          >
                            {week.isPaid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>✓ Semana Pagada</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span>⏳ Pago Pendiente</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Shifts Detail of this week */}
                      {isExpanded && (
                        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
                          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Clases de esta semana:
                          </div>

                          {week.bookings.map((b) => (
                            <div
                              key={b.id}
                              className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="font-black text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-1.5">
                                  <span>{b.shiftTitle}</span>
                                  <DisciplineBadge discipline={b.discipline} size="sm" />
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                  <span>📅 {b.shiftDate}</span>
                                  <span>⏰ {b.shiftTime} hs</span>
                                  <span>👤 {b.instructorName}</span>
                                </div>
                              </div>

                              <div className="self-end sm:self-center">
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
                <div className="py-12 sm:py-16 text-center text-slate-400 text-xs">
                  Sin reservas registradas.
                </div>
              ) : (
                clientBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-black text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-1.5">
                        <span>{b.shiftTitle}</span>
                        <DisciplineBadge discipline={b.discipline} size="sm" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 mt-1">
                        <span>📅 {b.shiftDate}</span>
                        <span>⏰ {b.shiftTime} hs</span>
                        <span>Prof. {b.instructorName}</span>
                      </div>
                    </div>

                    <div className="self-end sm:self-center">
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
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Configuración de Plan y Arancel</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Define la frecuencia y arancel mensual o semanal de este alumno
                </p>

                {/* Billing Frequency Buttons */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Frecuencia de Cobro
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBillingFrequency("weekly")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                        billingFrequency === "weekly"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      📅 Semanal
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingFrequency("monthly")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                        billingFrequency === "monthly"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      🗓️ Mensual
                    </button>
                  </div>
                </div>

                {/* Plan Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Plan Asignado
                  </label>
                  <select
                    value={planId}
                    onChange={(e) => {
                      const newPlanId = e.target.value;
                      setPlanId(newPlanId);
                      if (!newPlanId) {
                        setHasCustomPrice(false);
                        setCustomPrice(undefined);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Sin Plan (Clase suelta individual)</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.classesPerWeek}x sem) - Base: ${p.price.toLocaleString("es-AR")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Adjusted Price with Checkbox */}
                {(() => {
                  const selPlan = plans.find((p) => p.id === planId);
                  if (!selPlan) return null;

                  return (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Arancel base del plan:
                        </span>
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          ${selPlan.price.toLocaleString("es-AR")}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasCustomPrice}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setHasCustomPrice(checked);
                              if (checked) {
                                setCustomPrice(customPrice !== undefined ? customPrice : selPlan.price);
                              } else {
                                setCustomPrice(undefined);
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Ajustar arancel personalizado
                          </span>
                        </label>

                        {hasCustomPrice && (
                          <div className="mt-2.5">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Arancel Ajustado Personalizado ($)
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-slate-400 font-bold text-xs">$</span>
                              <input
                                type="number"
                                step="500"
                                value={customPrice !== undefined ? customPrice : selPlan.price}
                                onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Ej. 14000 o 52000"
                                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold btn-primary shadow-xs text-center cursor-pointer"
                >
                  {savingSettings ? "Guardando..." : "Guardar Ajustes de Cobro"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Borrar Alumno</span>
          </button>

          <button
            onClick={onClose}
            disabled={deleting}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Client */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="¿Eliminar Alumno?"
        message={`¿Estás seguro de que deseas borrar a ${client.name}? Se eliminará su ficha y registro de alumnos.`}
        confirmText="Sí, Borrar Alumno"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={async () => {
          if (!client) return;
          setDeleting(true);
          try {
            await deleteClient(client.id);
            setShowDeleteConfirm(false);
            onClose();
          } catch (err) {
            console.error("Error al borrar alumno:", err);
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Confirmation Modal for Individual Week Payment toggle */}
      <ConfirmModal
        isOpen={!!weekPaymentToConfirm}
        title={weekPaymentToConfirm?.isPaid ? "Desmarcar Pago Semanal" : "Confirmar Pago Semanal"}
        message={
          weekPaymentToConfirm?.isPaid
            ? `¿Deseas marcar la semana (${weekPaymentToConfirm?.rangeLabel}) de ${client.name} como PENDIENTE de pago?`
            : `¿Deseas registrar el cobro y marcar la semana (${weekPaymentToConfirm?.rangeLabel}) de ${client.name} como PAGADA?`
        }
        confirmText={weekPaymentToConfirm?.isPaid ? "Sí, Marcar Pendiente" : "Sí, Marcar Pagada"}
        onConfirm={async () => {
          if (weekPaymentToConfirm) {
            await toggleClientWeeklyPayment(client.id, weekPaymentToConfirm.mondayStr);
            setWeekPaymentToConfirm(null);
          }
        }}
        onCancel={() => setWeekPaymentToConfirm(null)}
      />
    </div>
  );
}
