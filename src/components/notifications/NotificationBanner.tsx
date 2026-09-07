"use client";

import React, { useEffect, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import {
  CheckCircle2,
  AlertCircle,
  Bell,
  X,
  Calendar,
  Clock,
  User,
} from "lucide-react";

export function NotificationBanner() {
  const { activeToast, isToastExiting, dismissToast } = useNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (activeToast) {
      // Trigger smooth entry frame
      const frame = requestAnimationFrame(() => {
        setMounted(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setMounted(false);
    }
  }, [activeToast]);

  if (!activeToast) return null;

  const isCancelled = activeToast.type === "booking_cancelled";
  const isCreated = activeToast.type === "booking_created";

  return (
    <div
      className="fixed top-4 left-0 right-0 z-[9999] pointer-events-none flex justify-center px-3 sm:px-4"
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`pointer-events-auto w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border transition-all duration-500 ease-out transform overflow-hidden ${
          isCancelled
            ? "border-rose-300 dark:border-rose-900/70"
            : isCreated
            ? "border-emerald-300 dark:border-emerald-900/70"
            : "border-indigo-300 dark:border-indigo-900/70"
        } ${
          mounted && !isToastExiting
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-24 opacity-0 scale-95"
        }`}
      >
        <div className="p-3.5 sm:p-4 flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isCancelled
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                : isCreated
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            {isCancelled ? (
              <AlertCircle className="w-5 h-5" />
            ) : isCreated ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-black uppercase tracking-wider ${
                  isCancelled
                    ? "text-rose-600 dark:text-rose-400"
                    : isCreated
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {activeToast.title}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                Ahora
              </span>
            </div>

            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
              {activeToast.message}
            </p>

            {/* Extra details if available */}
            {(activeToast.shiftDate || activeToast.shiftTime) && (
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {activeToast.shiftDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{activeToast.shiftDate}</span>
                  </span>
                )}
                {activeToast.shiftTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{activeToast.shiftTime} hs</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={dismissToast}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Shrinking Bar (5 seconds) */}
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-[5000ms] ease-linear ${
              isCancelled
                ? "bg-rose-500"
                : isCreated
                ? "bg-emerald-500"
                : "bg-indigo-600"
            }`}
            style={{ width: mounted && !isToastExiting ? "0%" : "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
