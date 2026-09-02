"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Booking } from "@/types";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import {
  X,
  Search,
  Calendar,
  Clock,
  MapPin,
  CalendarClock,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Mail,
  Phone,
  Lock,
} from "lucide-react";

interface MyBookingsLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDateDDMMAAAA(dateStr?: string): string {
  if (!dateStr) return "-";
  const trimmed = dateStr.trim();
  const parts = trimmed.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return trimmed;
}

function getDayNameFull(dateStr: string): string {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const d = new Date(dateStr + "T12:00:00");
  return days[d.getDay()] || "";
}

export function MyBookingsLookupModal({ isOpen, onClose }: MyBookingsLookupModalProps) {
  const { bookings } = useData();
  const [searchMode, setSearchMode] = useState<"email" | "phone">("email");
  const [searchInput, setSearchInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Booking[]>([]);

  // Reset state whenever the modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSearchInput("");
      setHasSearched(false);
      setIsSearching(false);
      setSearchResults([]);
      setCopiedCode(null);
    }
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = searchInput.trim();
    if (!queryText) return;

    setIsSearching(true);
    setHasSearched(true);

    let matches: Booking[] = [];
    const db = getFirebaseDb();

    try {
      if (searchMode === "email") {
        const targetEmail = queryText.toLowerCase();
        if (db) {
          const qSnap = await getDocs(
            query(collection(db, "pilates_bookings"), where("clientEmail", "==", targetEmail))
          );
          matches = qSnap.docs.map((d) => d.data() as Booking);
        }
        if (matches.length === 0) {
          matches = bookings.filter((b) => (b.clientEmail || "").trim().toLowerCase() === targetEmail);
        }
      } else {
        const queryDigits = queryText.replace(/\D/g, "");
        if (queryDigits.length >= 7) {
          if (db) {
            const qSnap = await getDocs(
              query(collection(db, "pilates_bookings"), where("clientPhone", "==", queryDigits))
            );
            matches = qSnap.docs.map((d) => d.data() as Booking);
          }
          if (matches.length === 0) {
            matches = bookings.filter((b) => (b.clientPhone || "").replace(/\D/g, "") === queryDigits);
          }
        }
      }

      // Also support exact match if user entered their full reference cancellation code
      if (matches.length === 0 && queryText.toUpperCase().startsWith("PIL-")) {
        const codeTarget = queryText.toUpperCase();
        if (db) {
          const qSnap = await getDocs(
            query(collection(db, "pilates_bookings"), where("cancellationCode", "==", codeTarget))
          );
          matches = qSnap.docs.map((d) => d.data() as Booking);
        }
        if (matches.length === 0) {
          matches = bookings.filter(
            (b) => (b.cancellationCode || "").trim().toUpperCase() === codeTarget
          );
        }
      }
    } catch (err) {
      console.warn("Error searching bookings in Firestore:", err);
    }

    setSearchResults(matches);
    setIsSearching(false);
  };

  // Separate upcoming active vs past/cancelled
  const { upcomingBookings, pastOrCancelledBookings } = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const upcoming: Booking[] = [];
    const pastOrCancelled: Booking[] = [];

    searchResults.forEach((b) => {
      if (b.status === "cancelled") {
        pastOrCancelled.push(b);
        return;
      }

      if (b.shiftDate >= todayStr) {
        upcoming.push(b);
      } else {
        pastOrCancelled.push(b);
      }
    });

    // Sort upcoming chronologically (nearest first)
    upcoming.sort((a, b) => (a.shiftDate + a.shiftTime).localeCompare(b.shiftDate + b.shiftTime));
    // Sort past descending (newest first)
    pastOrCancelled.sort((a, b) => (b.shiftDate + b.shiftTime).localeCompare(a.shiftDate + a.shiftTime));

    return { upcomingBookings: upcoming, pastOrCancelledBookings: pastOrCancelled };
  }, [searchResults]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl animate-modal my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Mis Próximos Turnos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta y gestiona tus reservas agendadas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Mode Tabs: Email vs Phone */}
        <div className="mt-5 space-y-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70">
            <button
              type="button"
              onClick={() => {
                setSearchMode("email");
                setHasSearched(false);
                setSearchResults([]);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                searchMode === "email"
                  ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Por Correo Electrónico</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchMode("phone");
                setHasSearched(false);
                setSearchResults([]);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                searchMode === "phone"
                  ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Por Teléfono / WhatsApp</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                {searchMode === "email" ? (
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type={searchMode === "email" ? "email" : "tel"}
                  required
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={
                    searchMode === "email"
                      ? "Ingresa tu correo exacto (ej: maria@gmail.com)"
                      : "Ingresa tu número exacto (ej: 1155667788)"
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSearching || !searchInput.trim()}
                className="px-6 py-2.5 rounded-2xl text-xs font-bold btn-primary shrink-0 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{isSearching ? "Buscando..." : "Buscar mis turnos"}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <Lock className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>
                Por privacidad, la coincidencia debe ser exacta. Tus datos solo se mostrarán al ingresar el dato exacto con el que reservaste.
              </span>
            </div>
          </form>
        </div>

        {/* Content Body */}
        <div className="mt-5 overflow-y-auto scrollbar-thin pr-1 flex-1 space-y-4">
          {!hasSearched ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Consulta tus turnos agendados
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ingresa tu {searchMode === "email" ? "correo electrónico" : "número de teléfono"} y haz clic en &quot;Buscar mis turnos&quot;.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto opacity-80" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No encontramos ningún turno para ese {searchMode === "email" ? "correo electrónico" : "número"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Asegúrate de escribir exactamente el mismo {searchMode === "email" ? "email" : "teléfono"} ingresado al realizar tu reserva.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upcoming Bookings Section */}
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Tus Próximos Turnos ({upcomingBookings.length})</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                      >
                        {/* Top line with Discipline & Day */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <DisciplineBadge discipline={booking.discipline} size="sm" />
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                              {getDayNameFull(booking.shiftDate)} {formatDateDDMMAAAA(booking.shiftDate)}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Confirmado
                          </span>
                        </div>

                        {/* Title & Time */}
                        <div>
                          <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                            {booking.shiftTitle}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>{booking.shiftTime} hs</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span>Prof. {booking.instructorName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>Cesar Diaz 3031, CABA • {booking.room}</span>
                          </div>
                        </div>

                        {/* Client info & Reference Code Box */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                              Número de referencia:
                            </span>
                            <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                              {booking.cancellationCode}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopy(booking.cancellationCode)}
                            className="self-start sm:self-center text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          >
                            {copiedCode === booking.cancellationCode ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copiar código</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Action Button: ¿Querés modificar o cancelar? */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <Link
                            href={`/cancelar/${encodeURIComponent(booking.cancellationCode)}`}
                            onClick={onClose}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
                          >
                            <CalendarClock className="w-4 h-4" />
                            <span>¿Querés modificar o cancelar?</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 text-center">
                  No tienes turnos próximos pendientes.
                </div>
              )}

              {/* Past or Cancelled Bookings */}
              {pastOrCancelledBookings.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Reservas Anteriores o Canceladas ({pastOrCancelledBookings.length})
                  </span>
                  <div className="space-y-2 opacity-75">
                    {pastOrCancelledBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-700 dark:text-slate-300">
                            {b.shiftTitle}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatDateDDMMAAAA(b.shiftDate)} • {b.shiftTime} hs • Ref: {b.cancellationCode}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === "cancelled"
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                          {b.status === "cancelled" ? "Cancelada" : "Finalizada"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
