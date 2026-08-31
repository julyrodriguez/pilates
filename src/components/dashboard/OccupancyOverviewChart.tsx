"use client";

import React from "react";
import { Shift } from "@/types";
import { Activity } from "lucide-react";

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
          <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Capacidad por Disciplina
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
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
                  <span className="text-slate-700 dark:text-slate-300">{name}</span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {stats.bookedSlots} / {stats.totalSlots} cupos ({percent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-slate-900 dark:bg-indigo-600 rounded-full transition-all duration-500"
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
