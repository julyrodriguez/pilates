"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/context/NotificationContext";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  CheckCheck,
  Calendar,
  Clock,
  Monitor,
  MonitorCheck,
  MonitorX,
} from "lucide-react";

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  } catch {
    return "";
  }
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    soundEnabled,
    toggleSound,
    desktopPermission,
    requestDesktopPermission,
    sendTestNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Last 3 notifications as requested
  const latestThree = notifications.slice(0, 3);

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
            : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        aria-label="Ver notificaciones"
        title="Notificaciones"
      >
        <Bell
          className={`w-4 h-4 transition-transform ${
            unreadCount > 0 ? "animate-pulse text-indigo-600 dark:text-indigo-400" : ""
          }`}
        />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover: Exactly the last 3 notifications */}
      {isOpen && (
        <div className="absolute left-0 lg:left-0 top-full mt-2 w-80 sm:w-88 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-modal">
          {/* Header */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Windows Desktop Status Indicator */}
              {desktopPermission === "granted" && (
                <span
                  className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 flex items-center"
                  title="Notificaciones de Windows activadas (llegan con la ventana minimizada)"
                >
                  <MonitorCheck className="w-3.5 h-3.5" />
                </span>
              )}
              {desktopPermission === "denied" && (
                <span
                  className="p-1 rounded-lg text-amber-500 flex items-center"
                  title="Notificaciones bloqueadas en el navegador (hacé clic en el candado de la URL para desbloquear)"
                >
                  <MonitorX className="w-3.5 h-3.5" />
                </span>
              )}

              {/* Sound toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={soundEnabled ? "Silenciar notificaciones" : "Activar sonido"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Leer todas</span>
                </button>
              )}
            </div>
          </div>

          {/* Windows Desktop Notifications Enable Prompt */}
          {desktopPermission === "default" && (
            <div className="px-3 py-2 bg-gradient-to-r from-indigo-50/90 to-purple-50/80 dark:from-indigo-950/60 dark:to-purple-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center shrink-0">
                  <Monitor className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    Avisos en Windows
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5 truncate">
                    Llegan con la ventana minimizada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await requestDesktopPermission();
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black tracking-wide shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Activar
              </button>
            </div>
          )}

          {/* Body: Last 3 Notifications */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
            {latestThree.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                <Bell className="w-7 h-7 opacity-30 mb-1" />
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  No hay notificaciones
                </span>
                <span className="text-[11px] text-slate-400">
                  Aparecerán aquí cuando un alumno reserve o cancele.
                </span>
              </div>
            ) : (
              latestThree.map((item) => {
                const isCancelled = item.type === "booking_cancelled";
                const isCreated = item.type === "booking_created";

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.read) markAsRead(item.id);
                    }}
                    className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                      item.read
                        ? "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60 opacity-80"
                        : "bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/50"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isCancelled
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : isCreated
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {isCancelled ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : isCreated ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`text-[11px] font-black uppercase tracking-wider truncate ${
                            isCancelled
                              ? "text-rose-600 dark:text-rose-400"
                              : isCreated
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug line-clamp-2">
                        {item.message}
                      </p>

                      {(item.shiftDate || item.shiftTime) && (
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                          {item.shiftDate && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{item.shiftDate}</span>
                            </span>
                          )}
                          {item.shiftTime && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{item.shiftTime} hs</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Unread indicator dot */}
                    {!item.read && (
                      <span
                        className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-1.5"
                        title="No leída"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Note */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
            <span>Últimas 3 notificaciones</span>
          </div>
        </div>
      )}
    </div>
  );
}
