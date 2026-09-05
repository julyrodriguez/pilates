"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { BookingFilterBar } from "@/components/bookings/BookingFilterBar";
import { BookingTable } from "@/components/bookings/BookingTable";
import { ManualBookingModal } from "@/components/bookings/ManualBookingModal";
import { BookingDetailModal } from "@/components/bookings/BookingDetailModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useData } from "@/context/DataContext";
import { Booking } from "@/types";
import { getFirebaseDb } from "@/lib/firebase";
import { normalizeSearchString } from "@/lib/searchKeywords";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { Loader2, ExternalLink, AlertTriangle } from "lucide-react";

const INITIAL_LIMIT = 15;
const LOAD_MORE_STEP = 15;

export default function ReservasPage() {
  const { bookings: fallbackBookings, cancelBookingByCode, updateBookingStatus } = useData();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Booking[] | null>(null);

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_LIMIT);

  // Firestore on-demand state
  const [fetchedBookings, setFetchedBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [missingIndexUrl, setMissingIndexUrl] = useState<string | null>(null);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToMarkAttended, setBookingToMarkAttended] = useState<Booking | null>(null);

  // Debounce search input (300ms) to avoid executing queries on every single keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query regular recent bookings (limited to displayLimit, starts at 15)
  useEffect(() => {
    let isMounted = true;
    const db = getFirebaseDb();

    if (!db) {
      let filtered = [...fallbackBookings];
      if (selectedStatus !== "all") {
        filtered = filtered.filter((b) => b.status === selectedStatus);
      }
      if (selectedDate) {
        filtered = filtered.filter((b) => b.shiftDate === selectedDate);
      }
      filtered.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setFetchedBookings(filtered.slice(0, displayLimit));
      setHasMore(filtered.length > displayLimit);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    // Determine query with orderBy("createdAt", "desc")
    const buildQuery = (withOrderBy = true) => {
      const constraints: any[] = [];

      if (selectedDate) {
        constraints.push(where("shiftDate", "==", selectedDate));
      }
      if (selectedStatus !== "all") {
        constraints.push(where("status", "==", selectedStatus));
      }

      if (withOrderBy) {
        constraints.push(orderBy("createdAt", "desc"));
      }
      constraints.push(limit(displayLimit));

      return query(collection(db, "pilates_bookings"), ...constraints);
    };

    let unsubscribe: (() => void) | null = null;

    const setupListener = () => {
      // First attempt: with orderBy("createdAt", "desc")
      try {
        const q = buildQuery(true);

        unsubscribe = onSnapshot(
          q,
          (snap) => {
            if (!isMounted) return;
            const loaded = snap.docs
              .map((d) => d.data() as Booking)
              .filter((b) => b && b.id && !b.id.startsWith("_") && b.shiftId !== "deleted");

            setFetchedBookings(loaded);
            // If docs returned are less than displayLimit, no more are available
            setHasMore(snap.docs.length >= displayLimit);
            setIsLoading(false);
            setIsLoadingMore(false);
            setMissingIndexUrl(null);
          },
          (err) => {
            if (!isMounted) return;
            // Check if error is missing composite index
            if (err.message && err.message.includes("requires an index")) {
              console.warn("Firestore requires a composite index for this query:", err.message);
              const match = err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
              if (match) {
                setMissingIndexUrl(match[0]);
              }

              // Graceful fallback: query without orderBy and sort in memory
              const fallbackQ = buildQuery(false);
              unsubscribe = onSnapshot(
                fallbackQ,
                (fbSnap) => {
                  if (!isMounted) return;
                  const loaded = fbSnap.docs
                    .map((d) => d.data() as Booking)
                    .filter((b) => b && b.id && !b.id.startsWith("_") && b.shiftId !== "deleted");

                  loaded.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
                  setFetchedBookings(loaded);
                  setHasMore(fbSnap.docs.length >= displayLimit);
                  setIsLoading(false);
                  setIsLoadingMore(false);
                },
                (fbErr) => {
                  console.warn("Fallback query error:", fbErr);
                  if (isMounted) {
                    setIsLoading(false);
                    setIsLoadingMore(false);
                  }
                }
              );
            } else {
              console.warn("Error fetching bookings in reservas page:", err);
              setIsLoading(false);
              setIsLoadingMore(false);
            }
          }
        );
      } catch (err) {
        console.warn("Query setup error:", err);
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [selectedDate, selectedStatus, displayLimit, fallbackBookings]);

  // Global search across ALL bookings in database when debouncedSearch >= 3 characters
  useEffect(() => {
    let isMounted = true;

    if (debouncedSearch.length < 3) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const runGlobalSearch = async () => {
      setIsSearching(true);
      const db = getFirebaseDb();

      if (!db) {
        // Search in local/fallback data
        const term = normalizeSearchString(debouncedSearch);
        const matches = fallbackBookings.filter((b) => {
          const normName = normalizeSearchString(b.clientName);
          const normEmail = normalizeSearchString(b.clientEmail);
          const normCode = normalizeSearchString(b.cancellationCode);
          const normTitle = normalizeSearchString(b.shiftTitle);
          const normPhone = (b.clientPhone || "").replace(/\D/g, "");

          return (
            normName.includes(term) ||
            normEmail.includes(term) ||
            normCode.includes(term) ||
            normTitle.includes(term) ||
            normPhone.includes(term)
          );
        });
        if (isMounted) {
          setSearchResults(matches);
          setIsSearching(false);
        }
        return;
      }

      try {
        const norm = normalizeSearchString(debouncedSearch);
        const searchWords = norm.split(/[\s@._\-]+/).filter((w) => w.length >= 3);
        const firstToken = searchWords[0] || norm.substring(0, Math.min(norm.length, 20));

        // 1. Query Firestore using searchKeywords array-contains
        const q = query(
          collection(db, "pilates_bookings"),
          where("searchKeywords", "array-contains", firstToken),
          limit(100)
        );

        const snap = await getDocs(q);

        let results = snap.docs
          .map((d) => d.data() as Booking)
          .filter((b) => b && b.id && !b.id.startsWith("_") && b.shiftId !== "deleted");

        // 2. Refine results in memory (verify all searched words match and apply filters)
        results = results.filter((b) => {
          const combined = `${b.clientName} ${b.clientEmail} ${b.cancellationCode} ${b.shiftTitle} ${b.clientPhone || ""}`;
          const normalizedCombined = normalizeSearchString(combined);

          // All words in search term must match
          const allWordsMatch = searchWords.every((w) => normalizedCombined.includes(w));
          if (!allWordsMatch) return false;

          if (selectedStatus !== "all" && b.status !== selectedStatus) {
            return false;
          }
          if (selectedDate && b.shiftDate !== selectedDate) {
            return false;
          }
          return true;
        });

        // 3. Sort by createdAt descending
        results.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

        if (isMounted) {
          setSearchResults(results);
          setIsSearching(false);
        }
      } catch (err) {
        console.warn("Global search error in Firestore:", err);
        if (isMounted) {
          setSearchResults([]);
          setIsSearching(false);
        }
      }
    };

    runGlobalSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedStatus, selectedDate, fallbackBookings]);

  // Choose between search results and regular paginated bookings
  const isSearchActive = debouncedSearch.length >= 3;
  const activeBookings = isSearchActive
    ? searchResults || []
    : fetchedBookings.length > 0 || isLoading
    ? fetchedBookings
    : fallbackBookings;

  const handleConfirmCancel = async () => {
    if (bookingToCancel) {
      await cancelBookingByCode(bookingToCancel.cancellationCode, "Cancelado desde el panel de reservas", true);
      // Immediately reflect cancellation in local state
      setFetchedBookings((prev) =>
        prev.map((b) => (b.id === bookingToCancel.id ? { ...b, status: "cancelled" } : b))
      );
      if (searchResults) {
        setSearchResults((prev) =>
          prev ? prev.map((b) => (b.id === bookingToCancel.id ? { ...b, status: "cancelled" } : b)) : null
        );
      }
      setBookingToCancel(null);
    }
  };

  const handleConfirmMarkAttended = async () => {
    if (bookingToMarkAttended) {
      await updateBookingStatus(bookingToMarkAttended.id, "attended");
      // Immediately reflect attended in local state
      setFetchedBookings((prev) =>
        prev.map((b) => (b.id === bookingToMarkAttended.id ? { ...b, status: "attended" } : b))
      );
      if (searchResults) {
        setSearchResults((prev) =>
          prev ? prev.map((b) => (b.id === bookingToMarkAttended.id ? { ...b, status: "attended" } : b)) : null
        );
      }
      setBookingToMarkAttended(null);
    }
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setDisplayLimit((prev) => prev + LOAD_MORE_STEP);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("all");
    setSelectedDate("");
    setDisplayLimit(INITIAL_LIMIT);
  };

  return (
    <AppShell>
      <Header onOpenManualBooking={() => setBookingModalOpen(true)} />

      <BookingFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedStatus={selectedStatus}
        onStatusChange={(status) => {
          setSelectedStatus(status);
          setDisplayLimit(INITIAL_LIMIT);
        }}
        selectedDate={selectedDate}
        onDateChange={(date) => {
          setSelectedDate(date);
          setDisplayLimit(INITIAL_LIMIT);
        }}
        isSearching={isSearching}
      />

      {/* Index notification banner if Firebase requires a composite index */}
      {missingIndexUrl && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Para optimizar consultas y costos en Firebase con este filtro, puedes crear el índice compuesto con 1 clic:
            </span>
          </div>
          <a
            href={missingIndexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
          >
            <span>Crear índice en Firebase</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Top summary bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isSearching ? (
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Buscando coincidencias en toda la base de datos...
            </span>
          ) : isSearchActive ? (
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mostrando {activeBookings.length} reservas encontradas para &ldquo;{debouncedSearch}&rdquo; en todo el historial
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Mostrando las últimas {activeBookings.length} reservas realizadas
            </span>
          )}
        </div>

        {(search || selectedStatus !== "all" || selectedDate || displayLimit > INITIAL_LIMIT) && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
          >
            Restablecer (ver últimas {INITIAL_LIMIT})
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="glass-card p-12 text-center text-slate-500 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-bold">Cargando reservas...</p>
        </div>
      ) : (
        <>
          <BookingTable
            bookings={activeBookings}
            onViewDetails={(b) => setSelectedBookingForDetail(b)}
            onCancelBooking={(b) => setBookingToCancel(b)}
            onMarkAttended={(id) => {
              const b = activeBookings.find((x) => x.id === id);
              if (b) setBookingToMarkAttended(b);
            }}
          />

          {/* Load more button (only in regular non-search mode and when more bookings exist) */}
          {!isSearchActive && hasMore && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cargando más reservas...</span>
                  </>
                ) : (
                  <span>Cargar más reservas (+{LOAD_MORE_STEP})</span>
                )}
              </button>
            </div>
          )}

          {!isSearchActive && !hasMore && activeBookings.length > 0 && (
            <div className="mt-4 text-center text-[11px] text-slate-400">
              Has visto todas las reservas disponibles.
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ManualBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />

      <BookingDetailModal
        isOpen={!!selectedBookingForDetail}
        onClose={() => setSelectedBookingForDetail(null)}
        booking={selectedBookingForDetail}
        onCancelBooking={(b) => setBookingToCancel(b)}
      />

      <ConfirmModal
        isOpen={!!bookingToCancel}
        title="Cancelar Reserva de Alumno"
        message={`¿Estás seguro de cancelar la reserva de ${bookingToCancel?.clientName}? El cupo en el turno (${bookingToCancel?.shiftTitle}) quedará libre inmediatamente.`}
        isDestructive={true}
        confirmText="Sí, Cancelar Reserva"
        onConfirm={handleConfirmCancel}
        onCancel={() => setBookingToCancel(null)}
      />

      <ConfirmModal
        isOpen={!!bookingToMarkAttended}
        title="Confirmar Asistencia"
        message={`¿Deseas marcar como PRESENTE a ${bookingToMarkAttended?.clientName} en la clase ${bookingToMarkAttended?.shiftTitle} (${bookingToMarkAttended?.shiftTime} hs)?`}
        confirmText="Sí, Marcar Presente"
        onConfirm={handleConfirmMarkAttended}
        onCancel={() => setBookingToMarkAttended(null)}
      />
    </AppShell>
  );
}
