"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ChevronDown,
  CalendarDays,
  CreditCard,
  Layers,
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

export function StatisticsDashboard() {
  const { clients, plans, bookings, shifts, disciplines } = useData();

  // Fecha actual como referencia
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth(); // 0-11

  // Filtros de período
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(currentMonthIdx); // "all" o 0-11

  // Generar lista de años disponibles (desde 2025 hasta el año actual)
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

  // ==========================================
  // 1. ESTADÍSTICAS DE CLIENTAS Y PLANES
  // ==========================================
  const clientStats = useMemo(() => {
    const totalClients = clients.length;
    const clientsWithPlan = clients.filter((c) => Boolean(c.planId));
    const clientsWithoutPlan = clients.filter((c) => !c.planId);

    // Desglose por cada plan disponible
    const planBreakdown = plans.map((plan) => {
      const matchingClients = clients.filter((c) => c.planId === plan.id);
      const count = matchingClients.length;
      const percentage = totalClients > 0 ? (count / totalClients) * 100 : 0;
      
      // Total facturado base/personalizado de estos clientes por mes
      const monthlyRevenue = matchingClients.reduce((acc, c) => {
        const price = c.customPrice !== undefined ? c.customPrice : plan.price;
        return acc + price;
      }, 0);

      return {
        plan,
        count,
        percentage,
        monthlyRevenue,
      };
    });

    // Clientas sin plan (clases sueltas)
    const singleClassCount = clientsWithoutPlan.length;
    const singleClassPercentage = totalClients > 0 ? (singleClassCount / totalClients) * 100 : 0;

    // Frecuencia de cobro (Semanal vs Mensual)
    const weeklyCount = clientsWithPlan.filter((c) => c.billingFrequency === "weekly").length;
    const monthlyCount = clientsWithPlan.filter((c) => c.billingFrequency === "monthly" || !c.billingFrequency).length;

    // Estado de pagos
    const paidClientsCount = clients.filter((c) => c.paymentStatus === "paid").length;
    const pendingClientsCount = clients.filter((c) => c.paymentStatus !== "paid").length;

    return {
      totalClients,
      clientsWithPlanCount: clientsWithPlan.length,
      planBreakdown,
      singleClassCount,
      singleClassPercentage,
      weeklyCount,
      monthlyCount,
      paidClientsCount,
      pendingClientsCount,
    };
  }, [clients, plans]);

  // ==========================================
  // 2. ESTADÍSTICAS ECONÓMICAS Y FACTURACIÓN
  // ==========================================
  const economicStats = useMemo(() => {
    // Cálculo mensual proyectado de clientas con plan
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

    // Facturación estimada por reservas del período seleccionado
    const periodBookings = bookings.filter((b) => {
      if (!b.shiftDate || b.status === "cancelled") return false;
      const [yStr, mStr] = b.shiftDate.split("-");
      const bYear = parseInt(yStr, 10);
      const bMonth = parseInt(mStr, 10) - 1;

      if (bYear !== selectedYear) return false;
      if (selectedMonth !== "all" && bMonth !== selectedMonth) return false;
      return true;
    });

    // Reservas de clases sueltas (alumnos sin plan)
    const singleBookings = periodBookings.filter((b) => {
      const client = clients.find(
        (c) =>
          (c.email && b.clientEmail && c.email.toLowerCase() === b.clientEmail.toLowerCase()) ||
          c.name.toLowerCase() === b.clientName.toLowerCase()
      );
      return !client || !client.planId;
    });

    // Precio promedio estimado por clase suelta si no está especificado
    const defaultSinglePrice = 14000;
    const singleClassesRevenue = singleBookings.length * defaultSinglePrice;

    // Desglose mes a mes del año seleccionado (Enero a Diciembre)
    const monthlyBreakdown = MONTH_NAMES.map((monthName, idx) => {
      const isCurrentMonth = selectedYear === currentYear && idx === currentMonthIdx;
      const isFutureMonth = selectedYear === currentYear && idx > currentMonthIdx;

      // Reservas de este mes específico
      const mBookings = bookings.filter((b) => {
        if (!b.shiftDate || b.status === "cancelled") return false;
        const [yStr, mStr] = b.shiftDate.split("-");
        return parseInt(yStr, 10) === selectedYear && parseInt(mStr, 10) - 1 === idx;
      });

      // Si es el mes actual: toma las clientas activas con plan este mes + clases sueltas de este mes
      // Si es un mes pasado o futuro: solo cuenta si hubo reservas/actividad real en ese mes
      let revenueFromPlans = 0;
      let revenueFromSingles = 0;

      if (isCurrentMonth) {
        // En el mes actual, sumamos las clientas que tienen planes asignados activos
        revenueFromPlans = monthlyProjectedFromPlans;

        // Y clases sueltas reservadas este mes
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
        // En un mes con turnos históricos, calculamos según las clientas que reservaron en ese mes
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
        singlesCount: mBookings.length > 0 ? mBookings.length : 0,
        revenueFromPlans,
        revenueFromSingles,
        totalEstimated,
        isCurrentMonth,
        isFutureMonth,
      };
    });

    // Total anual real: suma exacta de cada uno de los 12 meses
    const annualTotalProjected = monthlyBreakdown.reduce((acc, m) => acc + m.totalEstimated, 0);

    // Para el período seleccionado en los KPI superiores:
    const activeMonthData =
      selectedMonth !== "all"
        ? monthlyBreakdown[selectedMonth]
        : null;

    const totalMonthlyRevenue =
      selectedMonth === "all"
        ? annualTotalProjected
        : activeMonthData
        ? activeMonthData.totalEstimated
        : 0;

    const totalPaidRevenue =
      selectedMonth === "all"
        ? paidProjectedFromPlans + singleClassesRevenue
        : selectedMonth === currentMonthIdx
        ? paidProjectedFromPlans + singleClassesRevenue
        : activeMonthData && activeMonthData.totalEstimated > 0
        ? activeMonthData.totalEstimated
        : 0;

    const totalPendingRevenue =
      selectedMonth === "all"
        ? pendingProjectedFromPlans
        : selectedMonth === currentMonthIdx
        ? pendingProjectedFromPlans
        : 0;

    // Ticket promedio por clienta
    const activePeriodPlansRevenue =
      selectedMonth === "all"
        ? monthlyBreakdown.reduce((acc, m) => acc + m.revenueFromPlans, 0)
        : activeMonthData
        ? activeMonthData.revenueFromPlans
        : 0;

    const activePeriodSinglesRevenue =
      selectedMonth === "all"
        ? monthlyBreakdown.reduce((acc, m) => acc + m.revenueFromSingles, 0)
        : activeMonthData
        ? activeMonthData.revenueFromSingles
        : 0;

    const averageTicket =
      clientStats.clientsWithPlanCount > 0
        ? Math.round(monthlyProjectedFromPlans / clientStats.clientsWithPlanCount)
        : 0;

    return {
      monthlyProjectedFromPlans,
      activePeriodPlansRevenue,
      activePeriodSinglesRevenue,
      paidProjectedFromPlans,
      pendingProjectedFromPlans,
      singleClassesRevenue,
      singleBookingsCount: singleBookings.length,
      totalMonthlyRevenue,
      totalPaidRevenue,
      totalPendingRevenue,
      averageTicket,
      monthlyBreakdown,
      annualTotalProjected,
      periodBookingsCount: periodBookings.length,
    };
  }, [
    clients,
    plans,
    bookings,
    selectedYear,
    selectedMonth,
    clientStats,
    currentYear,
    currentMonthIdx,
  ]);

  // ==========================================
  // 3. ESTADÍSTICAS DE DISCIPLINAS Y CLASES
  // ==========================================
  const disciplineStats = useMemo(() => {
    const disciplineCount: Record<string, number> = {};

    bookings.forEach((b) => {
      if (b.status !== "cancelled" && b.discipline) {
        disciplineCount[b.discipline] = (disciplineCount[b.discipline] || 0) + 1;
      }
    });

    const total = Object.values(disciplineCount).reduce((a, b) => a + b, 0);

    return Object.entries(disciplineCount).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count);
  }, [bookings]);

  // Formatear moneda en ARS
  const formatMoney = (val: number) => {
    return `$${val.toLocaleString("es-AR")}`;
  };

  const periodLabel =
    selectedMonth === "all"
      ? `Año ${selectedYear}`
      : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Selector de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              Panel de Estadísticas y Finanzas
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analítica de clientas, planes asignados y rendimiento económico en tiempo real
          </p>
        </div>

        {/* Selectores de Mes y Año */}
        <div className="flex items-center gap-2">
          {/* Selector de Mes */}
          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
            }
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
          >
            <option value="all">🗓️ Todo el Año (Anual)</option>
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx} value={idx}>
                {m}
              </option>
            ))}
          </select>

          {/* Selector de Año */}
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

      {/* KPI Cards Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Facturación Estimada */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Facturación {selectedMonth === "all" ? "Anual Proyectada" : "del Mes"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {formatMoney(economicStats.totalMonthlyRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Cobrado: {formatMoney(economicStats.totalPaidRevenue)}</span>
          </div>
        </div>

        {/* KPI 2: Total Clientas y Distribución */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total de Alumnos
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {clientStats.totalClients}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{clientStats.clientsWithPlanCount}</span> con plan • <span className="font-bold text-slate-600 dark:text-slate-300">{clientStats.singleClassCount}</span> sueltas
          </div>
        </div>

        {/* KPI 3: Ticket Promedio por Alumno */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Arancel Promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {formatMoney(economicStats.averageTicket)}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Por alumno con plan activo
          </div>
        </div>

        {/* KPI 4: Reservas en el Período */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Turnos Reservados ({periodLabel})
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {economicStats.periodBookingsCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Clases asistidas y confirmadas
          </div>
        </div>
      </div>

      {/* Grid: 2 Columnas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================================ */}
        {/* BLOQUE IZQUIERDO: DISTRIBUCIÓN DE CLIENTAS POR PLAN */}
        {/* ============================================================ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Distribución de Alumnos por Plan</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cantidad y porcentaje de alumnos en cada modalidad
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black">
              {clientStats.totalClients} Alumnos
            </span>
          </div>

          {/* Lista de Planes con Barras de Progreso */}
          <div className="space-y-4">
            {clientStats.planBreakdown.map(({ plan, count, percentage, monthlyRevenue }) => (
              <div
                key={plan.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {plan.name} ({plan.classesPerWeek}x sem)
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      Base: ${plan.price.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-black">
                    <span className="text-slate-900 dark:text-slate-100">
                      {count} {count === 1 ? "alumna" : "alumnas"}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Barra de Porcentaje */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Subtotales del plan */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                  <span>Facturación mensual por este plan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatMoney(monthlyRevenue)}
                  </span>
                </div>
              </div>
            ))}

            {/* Clases Sueltas (Sin Plan) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    Sin Plan (Clases sueltas)
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-black">
                  <span className="text-slate-900 dark:text-slate-100">
                    {clientStats.singleClassCount} {clientStats.singleClassCount === 1 ? "alumna" : "alumnas"}
                  </span>
                  <span className="text-slate-500">
                    ({clientStats.singleClassPercentage.toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-slate-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${clientStats.singleClassPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Resumen de Cobro y Pagos */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center">
              <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                Alumnos al Día
              </div>
              <div className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                {clientStats.paidClientsCount}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-center">
              <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                Pendientes de Pago
              </div>
              <div className="text-lg font-black text-amber-900 dark:text-amber-200">
                {clientStats.pendingClientsCount}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BLOQUE DERECHO: DESGLOSE ECONÓMICO Y EVOLUCIÓN MENSUAL */}
        {/* ============================================================ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Facturación y Rendimiento Económico</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ingresos por planes, clases sueltas y estado de cobros
              </p>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {periodLabel}
            </span>
          </div>

          {/* Cards de Resumen Económico */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Planes y Abonos
              </span>
              <div className="text-base font-black text-slate-900 dark:text-slate-100">
                {formatMoney(economicStats.activePeriodPlansRevenue)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {clientStats.clientsWithPlanCount} alumnos
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Clases Sueltas
              </span>
              <div className="text-base font-black text-slate-900 dark:text-slate-100">
                {formatMoney(economicStats.activePeriodSinglesRevenue)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {economicStats.singleBookingsCount} reservas
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Pendiente de Cobro
              </span>
              <div className="text-base font-black text-amber-600 dark:text-amber-400">
                {formatMoney(economicStats.totalPendingRevenue)}
              </div>
              <span className="text-[10px] text-amber-500 block">
                Abonos por liquidar
              </span>
            </div>
          </div>

          {/* Gráfico / Barras de Evolución Anual Mes a Mes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <span>Evolución Mensual ({selectedYear})</span>
              </span>
              <span className="text-indigo-600 dark:text-indigo-400">
                Total Anual Estimado: {formatMoney(economicStats.annualTotalProjected)}
              </span>
            </div>

            {/* Grilla visual de los 12 meses */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
              {economicStats.monthlyBreakdown.map((m) => {
                const isSelected = selectedMonth === m.monthIndex;
                return (
                  <button
                    key={m.monthIndex}
                    type="button"
                    onClick={() => setSelectedMonth(m.monthIndex)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-400/40"
                        : m.isCurrentMonth
                        ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100"
                        : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>{m.monthName.slice(0, 3)}</span>
                      {m.isCurrentMonth && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <div className="text-xs font-black mt-1">
                      {formatMoney(m.totalEstimated)}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 ${
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
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN INFERIOR: DISCIPLINAS Y ASISTENCIA */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Disciplinas Más Demandadas</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Volumen de reservas acumuladas por cada tipo de clase
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {disciplineStats.map((disc, idx) => (
            <div
              key={disc.name}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {disc.name}
                </span>
                <span className="font-black text-purple-600 dark:text-purple-400">
                  {disc.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${disc.percentage}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {disc.count} turnos tomados
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
