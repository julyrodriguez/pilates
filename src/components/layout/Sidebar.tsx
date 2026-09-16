"use client";

import React, { useState, useEffect } from "react";
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
  BarChart3,
  Award,
  BookOpen,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AppLogo } from "@/components/common/AppLogo";

const navItems = [
  {
    href: "/",
    label: "Página Informativa",
    icon: BookOpen,
    badge: "Guía",
  },
  {
    href: "/calendario",
    label: "Calendario Semanal",
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
    badge: null,
  },
  {
    href: "/planes",
    label: "Planes y Membresías",
    icon: Award,
    badge: null,
  },
  {
    href: "/estadisticas",
    label: "Estadísticas",
    icon: BarChart3,
    badge: null,
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
  const { settings } = useData();
  const { user, logout } = useAuth();

  // Cerrar el menú automáticamente al cambiar de página
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Header Bar (Ultra Estilizado) */}
      <header className="lg:hidden w-full flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 transition-colors shrink-0 shadow-2xs">
        <AppLogo size="sm" href="/" showSubtitle={true} />

        <div className="flex items-center gap-1 shrink-0">
          <NotificationBell />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? <X className="w-5 h-5 text-slate-800 dark:text-slate-100" /> : <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop / Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-out w-72 lg:w-64 max-w-[85vw] shadow-2xl lg:shadow-none ${
          mobileOpen
            ? "translate-x-0 opacity-100 pointer-events-auto visible"
            : "-translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto invisible lg:visible"
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <AppLogo size="md" href="/" showSubtitle={true} />

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Public Booking Link Shortcut */}
        <div className="p-3">
          <Link
            href="/reservar"
            target="_blank"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100/80 dark:border-indigo-900/50 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-2xs group"
            title="Abrir Portal Público de Reservas"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Portal Público</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Reservas para alumnos</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                <span className="truncate flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${isActive ? "bg-white/20 text-white" : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Button */}
        {user && (
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-2xs">
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
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Area */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sistema Online
            </span>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronizado
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
