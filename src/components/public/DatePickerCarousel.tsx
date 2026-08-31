"use client";

import React from "react";
import { Calendar } from "lucide-react";

interface DatePickerCarouselProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function DatePickerCarousel({
  selectedDate,
  onSelectDate,
}: DatePickerCarouselProps) {
  // Generate 7 consecutive days starting today
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const dayName =
      i === 0
        ? "Hoy"
        : i === 1
        ? "Mañana"
        : d.toLocaleDateString("es-ES", { weekday: "short" });

    const dayNumber = d.getDate();
    const monthName = d.toLocaleDateString("es-ES", { month: "short" });

    return {
      dateStr,
      dayName,
      dayNumber,
      monthName,
    };
  });

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-rose-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-rose-200">
          Selecciona el día
        </h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {days.map((item) => {
          const isSelected = selectedDate === item.dateStr;

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                isSelected
                  ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30 scale-105"
                  : "bg-white dark:bg-[#1a0b1b] border-rose-200/60 dark:border-rose-900/40 text-slate-700 dark:text-rose-200 hover:border-rose-400/60 hover:bg-rose-50/50"
              }`}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isSelected ? "text-rose-100" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {item.dayName}
              </span>
              <span className="text-xl font-black mt-0.5">{item.dayNumber}</span>
              <span
                className={`text-[10px] font-medium ${
                  isSelected ? "text-rose-100" : "text-slate-400 dark:text-rose-300/60"
                }`}
              >
                {item.monthName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
