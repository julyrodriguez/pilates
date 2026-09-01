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
        <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Selecciona el día
        </h3>
      </div>

      <div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
        {days.map((item) => {
          const isSelected = selectedDate === item.dateStr;

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`flex-1 min-w-[76px] sm:min-w-0 p-3 rounded-2xl flex flex-col items-center justify-center transition-all border shrink-0 snap-start ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-indigo-600 border-slate-900 dark:border-indigo-600 shadow-sm ring-2 ring-indigo-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span
                className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${
                  isSelected ? "text-slate-300 dark:text-indigo-200" : "text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {item.dayName}
              </span>
              <span className="text-lg sm:text-xl font-black mt-0.5">{item.dayNumber}</span>
              <span
                className={`text-[10px] font-medium ${
                  isSelected ? "text-slate-400 dark:text-indigo-200" : "text-slate-400 dark:text-slate-500"
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
