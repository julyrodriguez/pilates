"use client";

import React from "react";
import { Shift } from "@/types";
import { Activity, Sparkles, Layers, ShieldCheck } from "lucide-react";

interface OccupancyOverviewChartProps {
  shifts: Shift[];
}

export function OccupancyOverviewChart({ shifts }: OccupancyOverviewChartProps) {
  const disciplineCounts: Record<string, { totalSlots: number; bookedSlots: number; count: number }> = {};

  shifts.forEach((s) => {
    if (!disciplineCounts[s.discipline]) {
      disciplineCounts[s.discipline] = { totalSlots: 0, bookedSlots: 0, count: 0 };
    }
    disciplineCounts[s.discipline].totalSlots += s.capacity;
    disciplineCounts[s.discipline].bookedSlots += s.bookedCount;
    disciplineCounts[s.discipline].count += 1;
  });

  const disciplines = Object.entries(disciplineCounts);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-rose-50">
            Capacidad por Disciplina
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-rose-300/60 font-medium">
          Aforos acumulados
        </span>
      </div>

      <div className="space-y-3.5">
        {disciplines.length === 0 ? (
          <p className="text-xs text-slate-500">No hay datos disponibles.</p>
        ) : (
          disciplines.map(([disc, stats]) => {
            const percent =
              stats.totalSlots > 0
                ? Math.round((stats.bookedSlots / stats.totalSlots) * 100)
                : 0;

            const name =
              disc === "reformer"
                ? "Reformer Clásico"
                : disc === "mat"
                ? "Mat Pilates"
                : disc === "cadillac"
                ? "Cadillac"
                : disc === "tower"
                ? "Tower Combo"
                : disc === "prenatal"
                ? "Prenatal"
                : "Power Pilates";

            return (
              <div key={disc} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-rose-100">{name}</span>
                  <span className="text-rose-600 dark:text-rose-300">
                    {stats.bookedSlots} / {stats.totalSlots} cupos ({percent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-rose-950/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
