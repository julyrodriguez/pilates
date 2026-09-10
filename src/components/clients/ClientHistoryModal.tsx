"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Client, Booking, Plan } from "@/types";
import { useData } from "@/context/DataContext";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
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
  ChevronLeft,
  ChevronRight,
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

function formatBookingDate(dateStr: string): { dayNumber: string; dayName: string; monthName: string; full: string } {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
    return {
      dayNumber: String(d),
      dayName: days[date.getDay()],
      monthName: months[m - 1],
      full: `${days[date.getDay()]} ${d} de ${months[m - 1]}`,
    };
  } catch {
    return { dayNumber: "", dayName: "", monthName: "", full: dateStr };
  }
}

function formatMonthYearHeader(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${months[month - 1]} ${year}`;
}

export function ClientHistoryModal({ isOpen, onClose, client }: ClientHistoryModalProps) {
  const { bookings: fallbackBookings, plans, updateClient, deleteClient, getClientMonthlyUsage } = useData();
  const [activeTab, setActiveTab] = useState<"month" | "all" | "settings">("month");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Monthly bookings state
  const [monthBookings, setMonthBookings] = useState<Booking[]>([]);
  const [loadingMonthBookings, setLoadingMonthBookings] = useState<boolean>(false);

  // History state: only latest 10 (with option to load more)
  const [historyBookings, setHistoryBookings] = useState<Booking[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyLimit, setHistoryLimit] = useState<number>(10);
  const [hasMoreHistory, setHasMoreHistory] = useState<boolean>(false);
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

  useEffect(() => {
    if (client) {
      setCustomPrice(client.customPrice);
      setHasCustomPrice(client.customPrice !== undefined && client.customPrice !== null);
      setBillingFrequency(client.billingFrequency || "weekly");
      setPlanId(client.planId || "");
    }
  }, [client]);

  // Selected month state for "Semana a semana" (always defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1, 12, 0, 0);
    const prevStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(prevStr);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1, 12, 0, 0);
    const nextStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(nextStr);
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  // Clear states when modal closes or client changes
  useEffect(() => {
    if (!isOpen || !client) {
      setMonthBookings([]);
      setLoadingMonthBookings(false);
      setHistoryBookings([]);
      setLoadingHistory(false);
      setHistoryLimit(10);
      setHasMoreHistory(false);
      setSelectedMonth(new Date().toISOString().slice(0, 7));
    }
  }, [isOpen, client]);

  // Load history bookings on-demand only when "all" (Historial) tab is active
  useEffect(() => {
    if (!isOpen || !client || activeTab !== "all") return;

    let isMounted = true;
    const db = getFirebaseDb();
    if (!db) return;

    setLoadingHistory(true);

    const fetchHistory = async () => {
      try {
        let q;
        if (client.email) {
          q = query(
            collection(db, "pilates_bookings"),
            where("clientEmail", "==", client.email),
            orderBy("shiftDate", "desc"),
            limit(historyLimit + 1)
          );
        } else if (client.phone) {
          q = query(
            collection(db, "pilates_bookings"),
            where("clientPhone", "==", client.phone),
            orderBy("shiftDate", "desc"),
            limit(historyLimit + 1)
          );
        } else {
          q = query(
            collection(db, "pilates_bookings"),
            where("clientName", "==", client.name),
            orderBy("shiftDate", "desc"),
            limit(historyLimit + 1)
          );
        }

        const snap = await getDocs(q);
        if (!isMounted) return;

        const loaded = snap.docs
          .map((d) => d.data() as Booking)
          .filter((b) => b && b.id && !b.id.startsWith("_"));

        if (loaded.length > historyLimit) {
          setHasMoreHistory(true);
          setHistoryBookings(loaded.slice(0, historyLimit));
        } else {
          setHasMoreHistory(false);
          setHistoryBookings(loaded);
        }
      } catch (err: any) {
        console.warn("Error fetching history with composite index, using fallback:", err);
        try {
          let fallbackQ;
          if (client.email) {
            fallbackQ = query(collection(db, "pilates_bookings"), where("clientEmail", "==", client.email));
          } else if (client.phone) {
            fallbackQ = query(collection(db, "pilates_bookings"), where("clientPhone", "==", client.phone));
          } else {
            fallbackQ = query(collection(db, "pilates_bookings"), where("clientName", "==", client.name));
          }

          const snap = await getDocs(fallbackQ);
          if (!isMounted) return;

          const loaded = snap.docs
            .map((d) => d.data() as Booking)
            .filter((b) => b && b.id && !b.id.startsWith("_"))
            .sort((a, b) => (b.shiftDate + b.shiftTime).localeCompare(a.shiftDate + a.shiftTime));

          if (loaded.length > historyLimit) {
            setHasMoreHistory(true);
            setHistoryBookings(loaded.slice(0, historyLimit));
          } else {
            setHasMoreHistory(false);
            setHistoryBookings(loaded);
          }
        } catch (fallbackErr) {
          console.error("Error in fallback history fetch:", fallbackErr);
        }
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [isOpen, client, activeTab, historyLimit]);

  // Fetch bookings for the selected month
  useEffect(() => {
    if (!isOpen || !client) return;

    let isMounted = true;
    const db = getFirebaseDb();
    setLoadingMonthBookings(true);

    const fetchMonthBookings = async () => {
      try {
        const clientEmailNorm = (client.email || "").trim().toLowerCase();
        const cleanPhone = (p: string) => (p || "").replace(/\D/g, "");
        const clientPhoneDigits = cleanPhone(client.phone || "");
        const clientNameNorm = (client.name || "").trim().toLowerCase();

        let loaded: Booking[] = [];

        if (db) {
          try {
            let snap;
            if (client.email) {
              snap = await getDocs(query(collection(db, "pilates_bookings"), where("clientEmail", "==", client.email)));
            } else if (client.phone) {
              snap = await getDocs(query(collection(db, "pilates_bookings"), where("clientPhone", "==", client.phone)));
            } else {
              snap = await getDocs(query(collection(db, "pilates_bookings"), where("clientName", "==", client.name)));
            }
            if (snap) {
              loaded = snap.docs
                .map((d) => d.data() as Booking)
                .filter((b) => b && b.id && !b.id.startsWith("_"));
            }
          } catch (err) {
            console.warn("Direct month bookings query warning:", err);
          }
        }

        // Combinar con las reservas en tiempo real de DataContext sin duplicados
        const allCandidates = [...loaded, ...fallbackBookings];
        const uniqueMap = new Map<string, Booking>();
        allCandidates.forEach((b) => {
          if (b && b.id && !b.id.startsWith("_")) {
            uniqueMap.set(b.id, b);
          }
        });

        const combined = Array.from(uniqueMap.values())
          .filter((b) => {
            if (!b.shiftDate || !b.shiftDate.startsWith(selectedMonth)) return false;

            const bEmailNorm = (b.clientEmail || "").trim().toLowerCase();
            const bPhoneDigits = cleanPhone(b.clientPhone || "");
            const bNameNorm = (b.clientName || "").trim().toLowerCase();

            const matchEmail = Boolean(clientEmailNorm && bEmailNorm && bEmailNorm === clientEmailNorm);
            const matchPhone = Boolean(
              clientPhoneDigits.length >= 6 &&
              bPhoneDigits.length >= 6 &&
              (bPhoneDigits.endsWith(clientPhoneDigits) || clientPhoneDigits.endsWith(bPhoneDigits) || bPhoneDigits === clientPhoneDigits)
            );
            const matchName = Boolean(clientNameNorm && bNameNorm && bNameNorm === clientNameNorm);

            return matchEmail || matchPhone || matchName;
          })
          .sort((a, b) => (a.shiftDate + a.shiftTime).localeCompare(b.shiftDate + b.shiftTime));

        if (isMounted) {
          setMonthBookings(combined);
        }
      } catch (err) {
        console.error("Error fetching month bookings:", err);
        if (isMounted) setMonthBookings([]);
      } finally {
        if (isMounted) setLoadingMonthBookings(false);
      }
    };

    fetchMonthBookings();

    return () => {
      isMounted = false;
    };
  }, [isOpen, client, selectedMonth, fallbackBookings]);

  // Lista de meses disponibles para el selector rápido
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const currentMonth = new Date().toISOString().slice(0, 7);
    monthsSet.add(currentMonth);

    if (client?.monthlyPayments) {
      Object.keys(client.monthlyPayments).forEach((monthKey) => {
        monthsSet.add(monthKey);
      });
    }

    if (client?.monthlyUsageMap) {
      Object.keys(client.monthlyUsageMap).forEach((monthKey) => {
        monthsSet.add(monthKey);
      });
    }

    if (client?.weeklyUsageMap) {
      Object.keys(client.weeklyUsageMap).forEach((mondayStr) => {
        monthsSet.add(mondayStr.slice(0, 7));
      });
    }

    const [currY, currM] = currentMonth.split("-").map(Number);
    for (let offset = -5; offset <= 3; offset++) {
      const d = new Date(currY, currM - 1 + offset, 1, 12, 0, 0);
      monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [client]);

  const assignedPlan = useMemo(() => {
    if (!client?.planId) return null;
    return plans.find((p) => p.id === client.planId);
  }, [client?.planId, plans]);

  if (!isOpen || !client) return null;

  const monthlyUsage = getClientMonthlyUsage(client.id, selectedMonth);
  const activeCount = monthBookings.filter((b) => b.status !== "cancelled").length;
  const effectiveUsed = Math.max(monthlyUsage.used, activeCount);
  const effectiveRemaining = Math.max(0, monthlyUsage.total - effectiveUsed);
  const isComplete = monthlyUsage.total > 0 && effectiveUsed === monthlyUsage.total;
  const isExceeded = monthlyUsage.total > 0 && effectiveUsed > monthlyUsage.total;

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
      setActiveTab("month");
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
            onClick={() => setActiveTab("month")}
            className={`py-2 px-1.5 sm:px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === "month"
                ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Mes</span>
              <span className="hidden sm:inline">Clases del Mes</span>
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
              <span className="sm:hidden">Historial {historyBookings.length > 0 ? `(${historyBookings.length})` : ""}</span>
              <span className="hidden sm:inline">Historial ({historyBookings.length > 0 ? historyBookings.length : 10})</span>
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
          {/* TAB 1: CLASES DEL MES */}
          {activeTab === "month" && (
            <div className="space-y-3">
              {/* Month Navigation Toolbar */}
              <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  
                  {/* Quick Month Select */}
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden py-1 px-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    {availableMonths.map((m) => (
                      <option key={m} value={m} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 font-bold">
                        {formatMonthYearHeader(m)}
                      </option>
                    ))}
                  </select>

                  {selectedMonth !== currentMonthStr && (
                    <button
                      type="button"
                      onClick={handleCurrentMonth}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer transition-colors shrink-0"
                    >
                      Hoy
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Monthly Overview Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                      <span>Consumo de {formatMonthYearHeader(selectedMonth)}</span>
                      {assignedPlan && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {assignedPlan.name}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {client.planId ? (
                        <span>
                          {effectiveUsed} de {monthlyUsage.total} clases del mes usadas
                        </span>
                      ) : (
                        <span>
                          {activeCount} {activeCount === 1 ? "clase registrada" : "clases registradas"} (Sin plan asignado)
                        </span>
                      )}
                    </div>
                  </div>

                  {client.planId && (
                    <div className="shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                          isExceeded
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                            : isComplete
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        {isExceeded ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Excedido ({effectiveUsed}/{monthlyUsage.total})</span>
                          </>
                        ) : isComplete ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Cupo Completo ({monthlyUsage.total})</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{effectiveRemaining} disp.</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar (if client has plan) */}
                {client.planId && (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isExceeded
                            ? "bg-rose-500"
                            : isComplete
                            ? "bg-emerald-500"
                            : "bg-indigo-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (effectiveUsed / (monthlyUsage.total || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>0 clases</span>
                      <span>{monthlyUsage.total} clases permitidas</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Classes Direct List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Clases de {formatMonthYearHeader(selectedMonth)} ({monthBookings.length}):
                  </span>
                  {loadingMonthBookings && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  )}
                </div>

                {loadingMonthBookings && monthBookings.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span>Cargando clases del mes...</span>
                  </div>
                ) : monthBookings.length === 0 ? (
                  <div className="py-12 sm:py-16 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      Sin clases en {formatMonthYearHeader(selectedMonth)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      La clienta no tiene turnos registrados en este mes.
                    </p>
                  </div>
                ) : (
                  monthBookings.map((b) => {
                    const dateInfo = formatBookingDate(b.shiftDate);
                    const isCancelled = b.status === "cancelled";

                    return (
                      <div
                        key={b.id}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isCancelled
                            ? "bg-slate-50/50 dark:bg-slate-950/30 border-slate-200/60 dark:border-slate-800/60 opacity-60"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-800/60"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Date badge */}
                          <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                            isCancelled
                              ? "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400"
                              : "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-300"
                          }`}>
                            <span className="text-[10px] font-bold uppercase leading-none">
                              {dateInfo.dayName.slice(0, 3)}
                            </span>
                            <span className="text-sm font-black leading-tight">
                              {dateInfo.dayNumber}
                            </span>
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="font-black text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-1.5">
                              <span className={isCancelled ? "line-through text-slate-400" : ""}>
                                {b.shiftTitle}
                              </span>
                              <DisciplineBadge discipline={b.discipline} size="sm" />
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-medium">
                              <span>📅 {dateInfo.full}</span>
                              <span>⏰ {b.shiftTime} hs</span>
                              {b.instructorName && <span>👤 {b.instructorName}</span>}
                              {b.room && <span>📍 {b.room}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="self-end sm:self-center shrink-0">
                          {isCancelled ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              Cancelada
                            </span>
                          ) : b.status === "attended" ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Asistió
                            </span>
                          ) : b.status === "no_show" ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                              ✕ Ausente
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                              Confirmada
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HISTORIAL (ÚLTIMAS 10) */}
          {activeTab === "all" && (
            <div className="space-y-2.5">
              {loadingHistory && historyBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Cargando historial de reservas...</span>
                </div>
              ) : historyBookings.length === 0 ? (
                <div className="py-12 sm:py-16 text-center text-slate-400 text-xs">
                  Sin reservas registradas.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Mostrando {historyBookings.length} {historyBookings.length === 1 ? "reserva reciente" : "reservas recientes"}
                    </span>
                    {loadingHistory && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    )}
                  </div>

                  {historyBookings.map((b) => (
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
                        ) : b.status === "no_show" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400">
                            Ausente
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                            Confirmada
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {hasMoreHistory && (
                    <button
                      type="button"
                      onClick={() => setHistoryLimit((prev) => prev + 10)}
                      disabled={loadingHistory}
                      className="w-full mt-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      {loadingHistory ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Cargando...</span>
                        </>
                      ) : (
                        <span>+ Cargar 10 anteriores</span>
                      )}
                    </button>
                  )}
                </>
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
    </div>
  );
}
