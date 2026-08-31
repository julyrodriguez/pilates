import React from "react";
import { ShiftStatus } from "@/types";
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";

interface AvailabilityBadgeProps {
  status: ShiftStatus;
  bookedCount?: number;
  capacity?: number;
  showCount?: boolean;
}

export function AvailabilityBadge({
  status,
  bookedCount,
  capacity,
  showCount = false,
}: AvailabilityBadgeProps) {
  const freeSpots = capacity !== undefined && bookedCount !== undefined ? Math.max(0, capacity - bookedCount) : 0;

  if (status === "full" || freeSpots === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5" />
        <span>Completo</span>
        {showCount && capacity !== undefined && (
          <span className="opacity-80">({capacity}/{capacity})</span>
        )}
      </span>
    );
  }

  if (status === "almost_full" || freeSpots <= 2) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{freeSpots === 1 ? "¡Último cupo!" : `Últimos ${freeSpots} cupos`}</span>
        {showCount && (
          <span className="opacity-80">({bookedCount}/{capacity})</span>
        )}
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30">
        <Clock className="w-3.5 h-3.5" />
        <span>Cancelado</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>{freeSpots} cupos libres</span>
      {showCount && (
        <span className="opacity-80">({bookedCount}/{capacity})</span>
      )}
    </span>
  );
}
