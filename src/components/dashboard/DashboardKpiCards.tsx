"use client";

import React from "react";
import { useData } from "@/context/DataContext";
import {
  CalendarDays,
  Percent,
  BookmarkCheck,
  Ban,
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
      color: "bg-slate-900 dark:bg-indigo-600 text-white",
    },
    {
      title: "Ocupación en Vivo",
      value: `${occupancyPercentage}%`,
      subtext: `${totalCapacityToday - totalBookedToday} cupos disponibles hoy`,
      icon: Percent,
      color: "bg-indigo-600 text-white",
    },
    {
      title: "Reservas Activas",
      value: totalConfirmed,
      subtext: "Alumnos confirmados en agenda",
      icon: BookmarkCheck,
      color: "bg-emerald-600 text-white",
    },
    {
      title: "Cancelaciones",
      value: totalCancelled,
      subtext: "Cupos re-liberados con enlace único",
      icon: Ban,
      color: "bg-slate-700 text-white",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-card p-4 relative overflow-hidden group hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl ${card.color} flex items-center justify-center shadow-xs`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {card.value}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
