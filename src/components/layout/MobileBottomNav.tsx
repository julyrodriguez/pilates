"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarDays,
  BookmarkCheck,
  Users,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { useData } from "@/context/DataContext";

interface MobileBottomNavProps {
  onOpenNewShift: () => void;
  onOpenManualBooking: () => void;
}

export function MobileBottomNav({
  onOpenNewShift,
  onOpenManualBooking,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const { bookings } = useData();
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  const activeBookingsCount = bookings.filter((b) => b.status === "confirmed").length;

  const navTabs = [
    {
      href: "/",
      label: "Agenda",
      icon: Calendar,
      isActive: pathname === "/",
    },
    {
      href: "/turnos",
      label: "Clases",
      icon: CalendarDays,
      isActive: pathname === "/turnos",
    },
    {
      href: "/reservas",
      label: "Reservas",
      icon: BookmarkCheck,
      isActive: pathname === "/reservas",
      badge: activeBookingsCount > 0 ? activeBookingsCount : null,
    },
    {
      href: "/clientes",
      label: "Alumnos",
      icon: Users,
      isActive: pathname === "/clientes",
    },
  ];

  return (
    <>
      {/* Quick Action Sheet Modal (Mobile) */}
      {quickActionOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setQuickActionOpen(false)}
          />

          {/* Action Sheet Card */}
          <div className="relative z-10 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 pb-8 space-y-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Acción Rápida
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickActionOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setQuickActionOpen(false);
                  onOpenNewShift();
                }}
                className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                    Nueva Clase
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Programar horarios
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuickActionOpen(false);
                  onOpenManualBooking();
                }}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center shadow-xs">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                    Inscribir Alumno
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Asignar turno manual
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar (Fixed) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        {navTabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
                tab.isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-black"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${tab.isActive ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {tab.isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
              )}
            </Link>
          );
        })}

        {/* Central Plus Floating Button */}
        <div className="flex-1 flex items-center justify-center -mt-5">
          <button
            type="button"
            onClick={() => setQuickActionOpen(true)}
            className="w-12 h-12 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all ring-4 ring-white dark:ring-slate-950 cursor-pointer"
            aria-label="Acción rápida"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {navTabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
                tab.isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-black"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${tab.isActive ? "scale-110" : ""} transition-transform`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-black min-w-[14px] text-center shadow-2xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {tab.isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
