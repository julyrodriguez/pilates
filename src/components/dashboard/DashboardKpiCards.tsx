"use client";

import React from "react";
import { useData } from "@/context/DataContext";
import {
  CalendarDays,
  Percent,
  BookmarkCheck,
  Ban,
  TrendingUp,
  Sparkles,
  Users,
} from "lucide-react";

export function DashboardKpiCards() {
  const { shifts, bookings } = useData();

  const todayStr = new Date().toISOString().split("T")[0];
  const todayShifts = shifts.filter((s) => s.date === todayStr);

  const totalCapacityToday = todayShifts.reduce((acc, s) => acc + s.capacity, 0);
  const totalBookedToday = todayShifts.reduce((acc, s) => acc + s.bookedCount, 0);
  const occupancyPercentage =
    totalCapacityToday > 0
      ? Math.round((totalBookedToday / totalCapacityToday) * 100)
      : 0;

  const totalConfirmed = bookings.filter((b) => b.status === "confirmed").length;
  const totalCancelled = bookings.filter((b) => b.status === "cancelled").length;

  const cards = [
    {
      title: "Clases de Hoy",
      value: todayShifts.length,
      subtext: `${totalBookedToday} de ${totalCapacityToday} cupos reservados`,
      icon: CalendarDays,
      color: "from-rose-500 to-pink-500",
      accent: "text-rose-600 dark:text-rose-400",
      bgAccent: "bg-rose-500/10",
    },
    {
      title: "Ocupación en Vivo",
      value: `${occupancyPercentage}%`,
      subtext: `${totalCapacityToday - totalBookedToday} cupos disponibles hoy`,
      icon: Percent,
      color: "from-pink-500 to-rose-600",
      accent: "text-pink-600 dark:text-pink-400",
      bgAccent: "bg-pink-500/10",
    },
    {
      title: "Reservas Activas",
      value: totalConfirmed,
      subtext: "Alumnos confirmados en agenda",
      icon: BookmarkCheck,
      color: "from-rose-600 to-rose-700",
      accent: "text-rose-600 dark:text-rose-400",
      bgAccent: "bg-rose-500/10",
    },
    {
      title: "Cancelaciones",
      value: totalCancelled,
      subtext: "Cupos re-liberados con enlace único",
      icon: Ban,
      color: "from-amber-500 to-rose-500",
      accent: "text-amber-600 dark:text-amber-400",
      bgAccent: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-card p-4 relative overflow-hidden group hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-rose-300/70">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md shadow-rose-500/20`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl font-black text-slate-800 dark:text-rose-50 tracking-tight">
              {card.value}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-rose-300/70 mt-1 font-medium">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
