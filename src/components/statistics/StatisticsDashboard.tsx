"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import {
  DollarSign,
  Users,
  Award,
  Calendar,
  BarChart3,
  CalendarDays,
  Activity,
} from "lucide-react";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type StatTab = "overview" | "finance" | "plans" | "disciplines";

export function StatisticsDashboard() {
  const { clients, plans, bookings, shifts } = useData();

  // Fecha actual como referencia
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth(); // 0-11

  // Filtros y Pestaña activa
  const [activeTab, setActiveTab] = useState<StatTab>("overview");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(currentMonthIdx);

  // Lista de años disponibles
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentYear, 2025]);
    shifts.forEach((s) => {
      if (s.date) {
        const y = parseInt(s.date.split("-")[0], 10);
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    bookings.forEach((b) => {
      if (b.shiftDate) {
        const y = parseInt(b.shiftDate.split("-")[0], 10);
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [shifts, bookings, currentYear]);

  // 1. Estadísticas de Clientes y Planes
  const clientStats = useMemo(() => {
    const totalClients = clients.length;
    const clientsWithPlan = clients.filter((c) => Boolean(c.planId));
    const clientsWithoutPlan = clients.filter((c) => !c.planId);

    const planBreakdown = plans.map((plan) => {
      const matchingClients = clients.filter((c) => c.planId === plan.id);
      const count = matchingClients.length;
      const percentage = totalClients > 0 ? (count / totalClients) * 100 : 0;
      const monthlyRevenue = matchingClients.reduce((acc, c) => {
        const price = c.customPrice !== undefined ? c.customPrice : plan.price;
        return acc + price;
      }, 0);

      return { plan, count, percentage, monthlyRevenue };
    });

    const singleClassCount = clientsWithoutPlan.length;
    const singleClassPercentage = totalClients > 0 ? (singleClassCount / totalClients) * 100 : 0;
    const paidClientsCount = clients.filter((c) => c.paymentStatus === "paid").length;
    const pendingClientsCount = clients.filter((c) => c.paymentStatus !== "paid").length;

    return {
      totalClients,
      clientsWithPlanCount: clientsWithPlan.length,
      planBreakdown,
      singleClassCount,
      singleClassPercentage,
      paidClientsCount,
      pendingClientsCount,
    };
  }, [clients, plans]);

  // 2. Estadísticas Económicas
  const economicStats = useMemo(() => {
    let monthlyProjectedFromPlans = 0;
    let paidProjectedFromPlans = 0;
    let pendingProjectedFromPlans = 0;

    clients.forEach((c) => {
      if (c.planId) {
        const assignedPlan = plans.find((p) => p.id === c.planId);
        const fee = c.customPrice !== undefined ? c.customPrice : assignedPlan?.price || 0;
        monthlyProjectedFromPlans += fee;

        if (c.paymentStatus === "paid") {
          paidProjectedFromPlans += fee;
        } else {
          pendingProjectedFromPlans += fee;
        }
      }
    });

    const defaultSinglePrice = 14000;

    // Desglose mensual
    const monthlyBreakdown = MONTH_NAMES.map((monthName, idx) => {
      const isCurrentMonth = selectedYear === currentYear && idx === currentMonthIdx;

      const mBookings = bookings.filter((b) => {
        if (!b.shiftDate || b.status === "cancelled") return false;
        const [yStr, mStr] = b.shiftDate.split("-");
        return parseInt(yStr, 10) === selectedYear && parseInt(mStr, 10) - 1 === idx;
      });

      let revenueFromPlans = 0;
      let revenueFromSingles = 0;

      if (isCurrentMonth) {
        revenueFromPlans = monthlyProjectedFromPlans;
        const mSingles = mBookings.filter((b) => {
          const client = clients.find(
            (c) =>
              (c.email && b.clientEmail && c.email.toLowerCase() === b.clientEmail.toLowerCase()) ||
              c.name.toLowerCase() === b.clientName.toLowerCase()
          );
          return !client || !client.planId;
        });
        revenueFromSingles = mSingles.length * defaultSinglePrice;
      } else if (mBookings.length > 0) {
        const activeClientsInMonth = new Set<string>();
        let singleCount = 0;

        mBookings.forEach((b) => {
          const client = clients.find(
            (c) =>
              (c.email && b.clientEmail && c.email.toLowerCase() === b.clientEmail.toLowerCase()) ||
              c.name.toLowerCase() === b.clientName.toLowerCase()
          );
          if (client && client.planId) {
            activeClientsInMonth.add(client.id);
          } else {
            singleCount++;
          }
        });

        activeClientsInMonth.forEach((clientId) => {
          const client = clients.find((c) => c.id === clientId);
          if (client && client.planId) {
            const plan = plans.find((p) => p.id === client.planId);
            revenueFromPlans += client.customPrice !== undefined ? client.customPrice : plan?.price || 0;
          }
        });
        revenueFromSingles = singleCount * defaultSinglePrice;
      }

      const totalEstimated = revenueFromPlans + revenueFromSingles;

      return {
        monthName,
        monthIndex: idx,
        bookingsCount: mBookings.length,
        revenueFromPlans,
        revenueFromSingles,
        totalEstimated,
        isCurrentMonth,
      };
    });

    const annualTotalProjected = monthlyBreakdown.reduce((acc, m) => acc + m.totalEstimated, 0);

    const activeMonthData =
      selectedMonth !== "all" ? monthlyBreakdown[selectedMonth] : null;

    const totalPeriodRevenue =
      selectedMonth === "all" ? annualTotalProjected : activeMonthData ? activeMonthData.totalEstimated : 0;

    const totalPaidRevenue =
      selectedMonth === "all"
        ? paidProjectedFromPlans
        : selectedMonth === currentMonthIdx
        ? paidProjectedFromPlans
        : activeMonthData?.totalEstimated || 0;

    const totalPendingRevenue =
      selectedMonth === "all" || selectedMonth === currentMonthIdx ? pendingProjectedFromPlans : 0;

    const periodBookings = bookings.filter((b) => {
      if (!b.shiftDate || b.status === "cancelled") return false;
      const [yStr, mStr] = b.shiftDate.split("-");
      const bYear = parseInt(yStr, 10);
      const bMonth = parseInt(mStr, 10) - 1;
      if (bYear !== selectedYear) return false;
      if (selectedMonth !== "all" && bMonth !== selectedMonth) return false;
      return true;
    });

    const averageTicket =
      clientStats.clientsWithPlanCount > 0
        ? Math.round(monthlyProjectedFromPlans / clientStats.clientsWithPlanCount)
        : 0;

    return {
      monthlyProjectedFromPlans,
      totalPeriodRevenue,
      totalPaidRevenue,
      totalPendingRevenue,
      averageTicket,
      monthlyBreakdown,
      annualTotalProjected,
      periodBookingsCount: periodBookings.length,
    };
  }, [clients, plans, bookings, selectedYear, selectedMonth, clientStats, currentYear, currentMonthIdx]);

  // 3. Estadísticas de Disciplinas
  const disciplineStats = useMemo(() => {
    const disciplineCount: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.status !== "cancelled" && b.discipline) {
        disciplineCount[b.discipline] = (disciplineCount[b.discipline] || 0) + 1;
      }
    });
    const total = Object.values(disciplineCount).reduce((a, b) => a + b, 0);
    return Object.entries(disciplineCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [bookings]);

  const formatMoney = (val: number) => `$${val.toLocaleString("es-AR")}`;

  const periodLabel =
    selectedMonth === "all"
      ? `Año ${selectedYear}`
      : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Card Propio de la Página */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs shrink-0">
            <BarChart3 className="w-5 h-5 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
              Estadísticas y Métricas
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rendimiento del estudio, facturación proyectada y análisis de ocupación en tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Período y Pestañas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3">
        {/* VISTA MOBILE: Segmented Control 2x2 nativo */}
        <div className="block sm:hidden space-y-2.5">
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900"
              }`}
            >
              <span>📊</span>
              <span>Resumen</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("finance")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs transition-all cursor-pointer ${
                activeTab === "finance"
                  ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900"
              }`}
            >
              <span>💰</span>
              <span>Facturación</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plans")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs transition-all cursor-pointer ${
                activeTab === "plans"
                  ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900"
              }`}
            >
              <span>👥</span>
              <span>Alumnos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("disciplines")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs transition-all cursor-pointer ${
                activeTab === "disciplines"
                  ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900"
              }`}
            >
              <span>🧘‍♀️</span>
              <span>Disciplinas</span>
            </button>
          </div>

          {/* Selectores Mobile */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
              }
              className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs truncate"
            >
              <option value="all">🗓️ Todo el Año</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* VISTA DESKTOP / TABLET */}
        <div className="hidden sm:flex sm:items-center justify-between gap-2.5">
          {/* Pestañas de Navegación */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              📊 Resumen General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("finance")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "finance"
                  ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              💰 Ingresos & Facturación
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plans")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "plans"
                  ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              👥 Alumnos & Planes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("disciplines")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "disciplines"
                  ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              🧘‍♀️ Disciplinas
            </button>
          </div>

          {/* Filtros de Mes y Año */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
              }
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs truncate"
            >
              <option value="all">🗓️ Todo el Año</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. PESTAÑA: RESUMEN GENERAL (OVERVIEW) */}
      {/* ============================================================ */}
      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-6">
          {/* 4 KPIs Clave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  Ingresos ({periodLabel})
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 truncate">
                {formatMoney(economicStats.totalPeriodRevenue)}
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                Cobrado: {formatMoney(economicStats.totalPaidRevenue)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  Alumnos Activos
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
                {clientStats.totalClients}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {clientStats.clientsWithPlanCount} con plan activo
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  Turnos Reservados
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
                {economicStats.periodBookingsCount}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                En {periodLabel}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  Arancel Promedio
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 truncate">
                {formatMoney(economicStats.averageTicket)}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                Por alumno mensual
              </div>
            </div>
          </div>

          {/* Resumen rápido de Pagos & Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Estado de Cobros
              </h3>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                    Al Día
                  </span>
                  <div className="text-lg sm:text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {clientStats.paidClientsCount} alumnos
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                    {clientStats.totalClients > 0
                      ? `${((clientStats.paidClientsCount / clientStats.totalClients) * 100).toFixed(0)}% del total`
                      : "0%"}
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 block">
                    Pendientes
                  </span>
                  <div className="text-lg sm:text-xl font-black text-amber-900 dark:text-amber-200 mt-0.5">
                    {clientStats.pendingClientsCount} alumnos
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-1 truncate">
                    {formatMoney(economicStats.totalPendingRevenue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Modalidad de Alumnos
              </h3>
              <div className="space-y-2.5 sm:space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] sm:text-xs font-bold mb-1">
                    <span>Con Plan / Abono Fijo</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {clientStats.clientsWithPlanCount} alumnos (
                      {clientStats.totalClients > 0
                        ? `${((clientStats.clientsWithPlanCount / clientStats.totalClients) * 100).toFixed(0)}%`
                        : "0%"}
                      )
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 sm:h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{
                        width: `${
                          clientStats.totalClients > 0
                            ? (clientStats.clientsWithPlanCount / clientStats.totalClients) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] sm:text-xs font-bold mb-1">
                    <span>Clases Sueltas (Sin Plan)</span>
                    <span className="text-slate-500">
                      {clientStats.singleClassCount} alumnos ({clientStats.singleClassPercentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 sm:h-2.5 overflow-hidden">
                    <div
                      className="bg-slate-400 h-full rounded-full"
                      style={{ width: `${clientStats.singleClassPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. PESTAÑA: FINANZAS & FACTURACIÓN */}
      {/* ============================================================ */}
      {activeTab === "finance" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Evolución Mensual ({selectedYear})</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Haz clic en cualquier mes para filtrar el período
                </p>
              </div>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                Total Anual Estimado: {formatMoney(economicStats.annualTotalProjected)}
              </span>
            </div>

            {/* Grilla de 12 meses adaptada a Mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {economicStats.monthlyBreakdown.map((m) => {
                const isSelected = selectedMonth === m.monthIndex;
                return (
                  <button
                    key={m.monthIndex}
                    type="button"
                    onClick={() => setSelectedMonth(m.monthIndex)}
                    className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/40"
                        : m.isCurrentMonth
                        ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100"
                        : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{m.monthName}</span>
                      {m.isCurrentMonth && !isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <div className="text-sm sm:text-base font-black mt-1">
                      {formatMoney(m.totalEstimated)}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 font-medium truncate ${
                        isSelected ? "text-indigo-100" : "text-slate-400"
                      }`}
                    >
                      {m.bookingsCount} turnos
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. PESTAÑA: ALUMNOS & PLANES */}
      {/* ============================================================ */}
      {activeTab === "plans" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Distribución de Alumnos por Plan</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Desglose de alumnos inscriptos en cada modalidad
                </p>
              </div>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                {clientStats.totalClients} Alumnos en total
              </span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {clientStats.planBreakdown.map(({ plan, count, percentage, monthlyRevenue }) => (
                <div
                  key={plan.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
                      {plan.name} ({plan.classesPerWeek}x sem)
                    </div>
                    <div className="font-black text-slate-900 dark:text-slate-100 shrink-0">
                      {count} alumnos ({percentage.toFixed(0)}%)
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium gap-0.5 pt-0.5">
                    <span>Arancel base: ${plan.price.toLocaleString("es-AR")}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Total: {formatMoney(monthlyRevenue)} / mes
                    </span>
                  </div>
                </div>
              ))}

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                    Sin Plan (Clases Sueltas)
                  </div>
                  <div className="font-black text-slate-700 dark:text-slate-300 shrink-0">
                    {clientStats.singleClassCount} alumnos ({clientStats.singleClassPercentage.toFixed(0)}%)
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-400 h-full rounded-full"
                    style={{ width: `${clientStats.singleClassPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. PESTAÑA: DISCIPLINAS */}
      {/* ============================================================ */}
      {activeTab === "disciplines" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Disciplinas Más Demandadas</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Volumen de turnos por especialidad
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {disciplineStats.map((disc) => (
                <div
                  key={disc.name}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
                      {disc.name}
                    </span>
                    <span className="font-black text-purple-600 dark:text-purple-400 shrink-0">
                      {disc.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${disc.percentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {disc.count} turnos tomados
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
