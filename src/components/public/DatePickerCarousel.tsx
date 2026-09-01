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
  const days = React.useMemo(() => {
    const list: Array<{
      dateStr: string;
      dayName: string;
      dayNumber: number;
      monthName: string;
    }> = [];
    const d = new Date();
    while (list.length < 5) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = d.toISOString().split("T")[0];
        const isCurrentDayToday = list.length === 0 && new Date().getDay() !== 0 && new Date().getDay() !== 6;
        const dayName = isCurrentDayToday
          ? "Hoy"
          : d.toLocaleDateString("es-ES", { weekday: "short" });

        const dayNumber = d.getDate();
        const monthName = d.toLocaleDateString("es-ES", { month: "short" });

        list.push({
          dateStr,
          dayName,
          dayNumber,
          monthName,
        });
      }
      d.setDate(d.getDate() + 1);
    }
    return list;
  }, []);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
        <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Selecciona el día (Lunes a Viernes)
        </h3>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 w-full">
        {days.map((item) => {
          const isSelected = selectedDate === item.dateStr;

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`p-2 sm:p-3 rounded-2xl flex flex-col items-center justify-center transition-all border w-full text-center ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-indigo-600 border-slate-900 dark:border-indigo-600 shadow-sm ring-2 ring-indigo-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span
                className={`text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider ${
                  isSelected ? "text-slate-300 dark:text-indigo-200" : "text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {item.dayName}
              </span>
              <span className="text-base sm:text-xl font-black mt-0.5">{item.dayNumber}</span>
              <span
                className={`text-[9px] sm:text-[10px] font-medium ${
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
