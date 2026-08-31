import React from "react";

interface CapacityProgressBarProps {
  capacity: number;
  bookedCount: number;
  showLabels?: boolean;
}

export function CapacityProgressBar({
  capacity,
  bookedCount,
  showLabels = true,
}: CapacityProgressBarProps) {
  const percentage = capacity > 0 ? Math.min(100, Math.round((bookedCount / capacity) * 100)) : 0;
  const freeSpots = Math.max(0, capacity - bookedCount);

  let barColor = "bg-emerald-500";
  if (percentage >= 100) {
    barColor = "bg-rose-500";
  } else if (percentage >= 75) {
    barColor = "bg-amber-500";
  } else if (percentage >= 50) {
    barColor = "bg-rose-400";
  }

  return (
    <div className="w-full space-y-1.5">
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-rose-200/80">
          <span>Ocupación: {bookedCount} de {capacity} alumnos</span>
          <span className="font-semibold">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-rose-950/60 overflow-hidden border border-rose-500/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabels && (
        <div className="text-[11px] text-slate-500 dark:text-rose-300/60 text-right">
          {freeSpots === 0 ? "Sin disponibilidad" : `${freeSpots} ${freeSpots === 1 ? "lugar disponible" : "lugares disponibles"}`}
        </div>
      )}
    </div>
  );
}
