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
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  {
    href: "/",
    label: "Panel Principal",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    href: "/turnos",
    label: "Clases",
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
    label: "Correos y Notificaciones",
    icon: Mail,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, bookings } = useData();
  const { user, logout } = useAuth();

  const activeBookingsCount = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">{settings.studioName}</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Studio Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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

      {/* Desktop / Mobile Sidebar (Siempre abierto en w-64) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out w-64 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
                {settings.studioName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                Studio Manager
              </span>
            </div>
          </Link>
        </div>

        {/* Public Booking Link Shortcut */}
        <div className="p-3">
          <Link
            href="/reservar"
            target="_blank"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
            title="Abrir Portal Público de Reservas"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Portal Público</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Sin login para alumnos</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-400" />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                <span className="truncate flex-1">{item.label}</span>
                {item.badge === "live" && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {activeBookingsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Button */}
        {user && (
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {(user.displayName || user.email || "A").charAt(0).toUpperCase()}
                </div>
                <div className="truncate text-left">
                  <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user.displayName || (user.email ? user.email.split("@")[0] : "Admin")}
                  </div>
                  <div className="text-[9px] text-slate-500 truncate">
                    @{user.email ? user.email.split("@")[0] : "admin"}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Area with Theme Toggle */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <div className="text-right">
              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Modo Claro / Oscuro</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Conectado
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
