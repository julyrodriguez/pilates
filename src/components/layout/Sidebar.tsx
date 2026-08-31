"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookmarkCheck,
  Users,
  GraduationCap,
  Sparkles,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useData } from "@/context/DataContext";

const navItems = [
  {
    href: "/",
    label: "Panel Principal",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    href: "/turnos",
    label: "Turnos & Clases",
    icon: CalendarDays,
    badge: null,
  },
  {
    href: "/reservas",
    label: "Reservas",
    icon: BookmarkCheck,
    badge: "live",
  },
  {
    href: "/clientes",
    label: "Alumnos",
    icon: Users,
    badge: null,
  },
  {
    href: "/instructores",
    label: "Instructores",
    icon: GraduationCap,
    badge: null,
  },
  {
    href: "/simulador-emails",
    label: "Simulador de Emails",
    icon: Mail,
    badge: "demo",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, bookings } = useData();

  const activeBookingsCount = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/90 dark:bg-[#160817]/90 backdrop-blur-md border-b border-rose-200/50 dark:border-rose-900/40 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-md shadow-rose-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-rose-100">{settings.studioName}</h1>
            <p className="text-[10px] text-rose-500 dark:text-rose-300 font-medium">Pilates & Wellness</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl border border-rose-200/50 dark:border-rose-900/40 text-slate-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop / Collapsible Sidebar & Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#fffbf7] dark:bg-[#160817] border-r border-rose-200/60 dark:border-rose-900/40 transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-rose-50 truncate block">
                  {settings.studioName}
                </span>
                <span className="text-[11px] text-rose-600 dark:text-rose-300 font-semibold tracking-wider uppercase block">
                  Studio Manager
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-rose-300/60 dark:hover:text-rose-100 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Public Booking Link Card Shortcut */}
        <div className="p-3">
          <Link
            href="/reservar"
            target="_blank"
            className={`flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-rose-500/10 to-pink-500/15 dark:from-rose-500/20 dark:to-pink-500/20 border border-rose-300/40 dark:border-rose-500/30 text-rose-700 dark:text-rose-200 hover:scale-[1.02] transition-transform ${
              collapsed ? "justify-center" : "justify-between"
            }`}
            title="Abrir Portal Público de Reservas"
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              {!collapsed && (
                <div className="text-left">
                  <div className="text-xs font-bold">Portal Público</div>
                  <div className="text-[10px] text-slate-500 dark:text-rose-300/70">Reservar sin login</div>
                </div>
              )}
            </div>
            {!collapsed && <ExternalLink className="w-3.5 h-3.5 opacity-70" />}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 dark:bg-gradient-to-r dark:from-rose-600 dark:to-pink-600 font-semibold"
                    : "text-slate-600 dark:text-rose-200/80 hover:bg-rose-100/60 dark:hover:bg-rose-900/30 hover:text-slate-900 dark:hover:text-rose-50"
                } ${collapsed ? "justify-center px-2" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-rose-500/80 dark:text-rose-400"}`} />
                {!collapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge === "live" && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300"
                    }`}
                  >
                    {activeBookingsCount}
                  </span>
                )}
                {!collapsed && item.badge === "demo" && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    Demo
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area with Theme Toggle and Studio Quick Info */}
        <div className="p-3 border-t border-rose-200/50 dark:border-rose-900/30 space-y-2">
          <div className={`flex items-center justify-between ${collapsed ? "flex-col gap-2" : ""}`}>
            <ThemeToggle />
            {!collapsed && (
              <div className="text-right">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-rose-200">Paleta Rosa & Crema</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  En Vivo / Firebase
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
