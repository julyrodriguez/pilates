"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerCarouselProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekMonday(offsetWeeks: number = 0): Date {
  const now = new Date();
  const day = now.getDay(); // 0: Dom, 1: Lun, ..., 6: Sab
  const diffToMonday = day === 0 ? 1 : 1 - day;
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + diffToMonday + offsetWeeks * 7,
    12,
    0,
    0
  );
}

function getWeekOffsetFromDate(dateStr: string): number {
  if (!dateStr) return 0;
  try {
    const currentMonday = getWeekMonday(0);
    const [y, m, d] = dateStr.split("-").map(Number);
    const targetDate = new Date(y, m - 1, d, 12, 0, 0);
    const day = targetDate.getDay();
    const diffToMonday = day === 0 ? 1 : 1 - day;
    const targetMonday = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate() + diffToMonday,
      12,
      0,
      0
    );
    const diffDays = Math.round(
      (targetMonday.getTime() - currentMonday.getTime()) / (1000 * 60 * 60 * 24)
    );
    const offset = Math.round(diffDays / 7);
    return Math.max(0, offset);
  } catch {
    return 0;
  }
}

export function DatePickerCarousel({
  selectedDate,
  onSelectDate,
}: DatePickerCarouselProps) {
  const [weekOffset, setWeekOffset] = useState(() =>
    getWeekOffsetFromDate(selectedDate)
  );

  // Sync weekOffset if selectedDate changes externally
  useEffect(() => {
    const calculated = getWeekOffsetFromDate(selectedDate);
    if (calculated >= 0 && calculated !== weekOffset) {
      setWeekOffset(calculated);
    }
  }, [selectedDate]);

  const days = useMemo(() => {
    const monday = getWeekMonday(weekOffset);
    const list: Array<{
      dateStr: string;
      dayName: string;
      dayNumber: number;
      monthName: string;
      isPast: boolean;
      isToday: boolean;
    }> = [];

    const now = new Date();
    const todayStr = formatDateYMD(now);

    const dayNamesShort = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const monthsShort = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    for (let i = 0; i < 6; i++) {
      const d = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + i,
        12,
        0,
        0
      );
      const dateStr = formatDateYMD(d);
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;

      list.push({
        dateStr,
        dayName: dayNamesShort[i],
        dayNumber: d.getDate(),
        monthName: monthsShort[d.getMonth()],
        isPast,
        isToday,
      });
    }

    return list;
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const monday = getWeekMonday(weekOffset);
    const saturday = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + 5,
      12,
      0,
      0
    );
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const monthsShort = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    if (monday.getMonth() === saturday.getMonth()) {
      return `${monday.getDate()} al ${saturday.getDate()} de ${months[monday.getMonth()]}`;
    }
    return `${monday.getDate()} ${monthsShort[monday.getMonth()]} - ${saturday.getDate()} ${monthsShort[saturday.getMonth()]}`;
  }, [weekOffset]);

  const handleNextWeek = () => {
    const nextOffset = weekOffset + 1;
    setWeekOffset(nextOffset);
    const nextMonday = getWeekMonday(nextOffset);
    onSelectDate(formatDateYMD(nextMonday));
  };

  const handlePrevWeek = () => {
    if (weekOffset <= 0) return;
    const prevOffset = weekOffset - 1;
    setWeekOffset(prevOffset);
    const monday = getWeekMonday(prevOffset);
    const now = new Date();
    const todayStr = formatDateYMD(now);

    let targetDateStr = formatDateYMD(monday);
    for (let i = 0; i < 6; i++) {
      const d = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + i,
        12,
        0,
        0
      );
      const dStr = formatDateYMD(d);
      if (dStr >= todayStr) {
        targetDateStr = dStr;
        break;
      }
    }
    onSelectDate(targetDateStr);
  };

  const handleCurrentWeek = () => {
    setWeekOffset(0);
    const now = new Date();
    while (now.getDay() === 0) {
      now.setDate(now.getDate() + 1);
    }
    onSelectDate(formatDateYMD(now));
  };

  return (
    <div className="mb-6 sm:mb-8 space-y-2.5">
      {/* Week Navigator Bar */}
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={handlePrevWeek}
            disabled={weekOffset === 0}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              weekOffset === 0
                ? "bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-700 border-slate-200/50 dark:border-slate-800/50 cursor-not-allowed"
                : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs active:scale-95"
            }`}
            title={weekOffset === 0 ? "No puedes volver a semanas pasadas" : "Semana anterior"}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                {weekLabel}
              </span>
              {weekOffset === 0 ? (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 uppercase tracking-wider shrink-0">
                  Esta semana
                </span>
              ) : weekOffset === 1 ? (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 border border-violet-200/80 dark:border-violet-800/80 shrink-0">
                  Próxima semana
                </span>
              ) : null}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Lunes a Sábado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {weekOffset > 0 && (
            <button
              type="button"
              onClick={handleCurrentWeek}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
            >
              Hoy
            </button>
          )}

          <button
            type="button"
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center"
            title="Semana siguiente"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Fixed Day Buttons (Lunes a Sábado) */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 w-full">
        {days.map((item) => {
          const isSelected = selectedDate === item.dateStr;

          if (item.isPast) {
            return (
              <button
                key={item.dateStr}
                type="button"
                disabled
                title="Este día ya pasó"
                className="p-2 sm:p-3 rounded-2xl flex flex-col items-center justify-center border w-full text-center bg-slate-100/70 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50 select-none"
              >
                <span className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                  {item.dayName}
                </span>
                <span className="text-base sm:text-xl font-black mt-0.5 text-slate-400 dark:text-slate-600">
                  {item.dayNumber}
                </span>
                <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 dark:text-slate-600">
                  {item.monthName}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`p-2 sm:p-3 rounded-2xl flex flex-col items-center justify-center transition-all border w-full text-center relative cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-indigo-600 border-slate-900 dark:border-indigo-600 shadow-sm ring-2 ring-indigo-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              {item.isToday && (
                <span
                  className={`absolute -top-1.5 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-2xs"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  Hoy
                </span>
              )}

              <span
                className={`text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider ${
                  isSelected
                    ? "text-slate-300 dark:text-indigo-200"
                    : "text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {item.dayName}
              </span>
              <span className="text-base sm:text-xl font-black mt-0.5">
                {item.dayNumber}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-medium ${
                  isSelected
                    ? "text-slate-400 dark:text-indigo-200"
                    : "text-slate-400 dark:text-slate-500"
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
