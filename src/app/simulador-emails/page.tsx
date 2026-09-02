"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmailSimulatorModal } from "@/components/modals/EmailSimulatorModal";
import { useData } from "@/context/DataContext";
import { EmailLog } from "@/types";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { Mail, ExternalLink, Key, Eye, Search, X, Phone, User, Filter, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

export default function SimuladorEmailsPage() {
  const { emailLogs: fallbackEmailLogs, bookings, clients } = useData();
  const [selectedEmailCode, setSelectedEmailCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "cancelled" | "rescheduled">("all");
  const [displayLimit, setDisplayLimit] = useState<number>(30);

  // Firestore on-demand state
  const [fetchedLogs, setFetchedLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const cacheRef = useRef<Record<string, EmailLog[]>>({});

  useEffect(() => {
    let isMounted = true;
    const db = getFirebaseDb();
    const cacheKey = `${statusFilter}_${displayLimit}`;

    if (cacheRef.current[cacheKey]) {
      setFetchedLogs(cacheRef.current[cacheKey]);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    if (!db) {
      setFetchedLogs(fallbackEmailLogs);
      setIsLoading(false);
      return;
    }

    let q;
    if (statusFilter !== "all") {
      q = query(
        collection(db, "pilates_emails"),
        where("status", "==", statusFilter),
        limit(displayLimit)
      );
    } else {
      q = query(
        collection(db, "pilates_emails"),
        limit(displayLimit)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!isMounted) return;
        const loaded = snap.docs
          .map((d) => d.data() as EmailLog)
          .filter((l) => l && l.id && !l.id.startsWith("_"));

        setFetchedLogs(loaded);
        cacheRef.current[cacheKey] = loaded;
        setIsLoading(false);
      },
      (err) => {
        console.warn("Error fetching email logs in simulator:", err);
        if (isMounted) setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [statusFilter, displayLimit, fallbackEmailLogs]);

  const activeLogs = fetchedLogs.length > 0 || isLoading ? fetchedLogs : fallbackEmailLogs;

  const handleOpenEmail = (code: string) => {
    setSelectedEmailCode(code);
    setModalOpen(true);
  };

  // Normalizar texto sin tildes ni mayúsculas para búsquedas precisas
  const normalizeStr = (str: string) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Limpiar caracteres de teléfono para comparaciones numéricas
  const cleanPhone = (str: string) => (str || "").replace(/\D/g, "");

  // Mapear logs con información de teléfono de bookings o clients
  const enrichedLogs = useMemo(() => {
    return activeLogs.map((log) => {
      const associatedBooking = bookings.find(
        (b) => b.id === log.bookingId || (b.cancellationCode && b.cancellationCode === log.cancellationCode)
      );
      const associatedClient = clients.find(
        (c) =>
          (log.recipientEmail && c.email && c.email.toLowerCase() === log.recipientEmail.toLowerCase()) ||
          (log.recipientName && c.name.toLowerCase() === log.recipientName.toLowerCase())
      );

      const phone = associatedBooking?.clientPhone || associatedClient?.phone || "";

      return {
        ...log,
        phone,
      };
    });
  }, [activeLogs, bookings, clients]);

  const filteredLogs = useMemo(() => {
    const query = normalizeStr(searchTerm);
    const queryDigits = cleanPhone(searchTerm);

    if (!query && statusFilter === "all") {
      return enrichedLogs;
    }

    return enrichedLogs.filter((log) => {
      // 1. Filtro por Estado
      if (statusFilter !== "all") {
        if (statusFilter === "cancelled" && log.status !== "cancelled") return false;
        if (statusFilter === "rescheduled" && log.status !== "rescheduled") return false;
        if (statusFilter === "sent" && log.status !== "sent" && log.status !== "opened") return false;
      }

      // 2. Filtro por Búsqueda de Texto
      if (!query) return true;

      const nameNorm = normalizeStr(log.recipientName);
      const emailNorm = normalizeStr(log.recipientEmail);
      const codeNorm = normalizeStr(log.cancellationCode);
      const shiftNorm = normalizeStr(log.shiftTitle);
      const dateNorm = normalizeStr(log.shiftDate);
      const logPhoneDigits = cleanPhone(log.phone);

      const matchName = nameNorm.includes(query);
      const matchEmail = emailNorm.includes(query);
      const matchCode = codeNorm.includes(query);
      const matchShift = shiftNorm.includes(query) || dateNorm.includes(query);
      const matchPhone = queryDigits.length >= 2 && logPhoneDigits.includes(queryDigits);

      return matchName || matchEmail || matchPhone || matchCode || matchShift;
    });
  }, [enrichedLogs, searchTerm, statusFilter]);

  return (
    <AppShell>
      <div className="pt-1 sm:pt-2 space-y-4 sm:space-y-6">
        {/* Header Card Propio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs shrink-0">
              <Mail className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
                Correos y Notificaciones
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Auditoría en tiempo real y previsualización de emails automáticos emitidos a las alumnas
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xs space-y-2.5 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            {/* Input de Búsqueda */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, correo, teléfono o código..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selector de Estado */}
            <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Todos los Estados ({activeLogs.length})</option>
                <option value="sent">Confirmados</option>
                <option value="cancelled">Cancelados</option>
                <option value="rescheduled">Modificados</option>
              </select>
            </div>
          </div>

          {/* Resumen de Resultados (Limpio y adaptado a Mobile) */}
          <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
            <span>
              {filteredLogs.length} {filteredLogs.length === 1 ? "notificación encontrada" : "notificaciones encontradas"}
            </span>
            {searchTerm && (
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[160px] sm:max-w-xs text-right">
                Filtro: &quot;{searchTerm}&quot;
              </span>
            )}
          </div>
        </div>

      {/* Contenedor de Resultados */}
      <div className="glass-card overflow-hidden">
        {/* Mobile & Tablet Card List (< lg) */}
        <div className="block lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <Mail className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-60" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No se encontraron notificaciones</p>
              <p className="mt-1">Prueba cambiando los términos de búsqueda o limpiando los filtros.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{log.recipientName}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{log.recipientEmail}</span>
                      </div>
                      {log.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{log.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(log.sentAt).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} hs
                    </span>
                    {log.status === "cancelled" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                        Cancelado
                      </span>
                    ) : log.status === "rescheduled" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                        Modificado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        Enviado
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {log.shiftTitle}
                  </div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    {log.shiftDate} • {log.shiftTime} hs
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Cód. Cancelación:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <Key className="w-3 h-3 text-indigo-500" />
                      {log.cancellationCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleOpenEmail(log.cancellationCode)}
                    type="button"
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold btn-primary flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver email</span>
                  </button>

                  <Link
                    href={log.cancellationUrl}
                    target="_blank"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Abrir enlace de cancelación directa"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (>= lg) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Destinatario</th>
                <th className="p-3.5">Turno</th>
                <th className="p-3.5">Código Único</th>
                <th className="p-3.5">Fecha de Envío</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Previsualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:border-slate-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xs text-slate-500">
                    <Mail className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No se encontraron notificaciones</p>
                    <p className="mt-1">Prueba cambiando los términos de búsqueda o limpiando los filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {log.recipientName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {log.recipientEmail}
                      </div>
                      {log.phone && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{log.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.shiftTitle}
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        {log.shiftDate} • {log.shiftTime} hs
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                        <Key className="w-3 h-3 text-slate-400" />
                        {log.cancellationCode}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(log.sentAt).toLocaleString("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>

                    <td className="p-3.5">
                      {log.status === "cancelled" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          🚫 Cancelado
                        </span>
                      ) : log.status === "rescheduled" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                          🔄 Modificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          ✓ Enviado
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEmail(log.cancellationCode)}
                          type="button"
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ver email</span>
                        </button>

                        <Link
                          href={log.cancellationUrl}
                          target="_blank"
                          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                          title="Abrir enlace de cancelación directa"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLogs.length >= displayLimit && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => prev + 30)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cargar más notificaciones
          </button>
        </div>
      )}

      <EmailSimulatorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedEmailCode={selectedEmailCode}
      />
      </div>
    </AppShell>
  );
}
