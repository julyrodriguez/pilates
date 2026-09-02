"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import { Loader2, RefreshCw } from "lucide-react";

export default function ReservasPage() {
  const { bookings: fallbackBookings, cancelBookingByCode, updateBookingStatus } = useData();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [displayLimit, setDisplayLimit] = useState<number>(40);

  // Firestore on-demand state
  const [fetchedBookings, setFetchedBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const cacheRef = useRef<Record<string, Booking[]>>({});

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToMarkAttended, setBookingToMarkAttended] = useState<Booking | null>(null);

  useEffect(() => {
    let isMounted = true;
    const db = getFirebaseDb();
    const cacheKey = `${selectedDate}_${selectedStatus}_${displayLimit}`;

    if (cacheRef.current[cacheKey]) {
      setFetchedBookings(cacheRef.current[cacheKey]);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    if (!db) {
      setFetchedBookings(fallbackBookings);
      setIsLoading(false);
      return;
    }

    let q;
    if (selectedDate) {
      q = query(
        collection(db, "pilates_bookings"),
        where("shiftDate", "==", selectedDate),
        limit(displayLimit)
      );
    } else if (selectedStatus !== "all") {
      q = query(
        collection(db, "pilates_bookings"),
        where("status", "==", selectedStatus),
        limit(displayLimit)
      );
    } else {
      q = query(
        collection(db, "pilates_bookings"),
        limit(displayLimit)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!isMounted) return;
        const loaded = snap.docs
          .map((d) => d.data() as Booking)
          .filter((b) => b && b.id && !b.id.startsWith("_") && b.shiftId !== "deleted");

        setFetchedBookings(loaded);
        cacheRef.current[cacheKey] = loaded;
        setIsLoading(false);
      },
      (err) => {
        console.warn("Error fetching bookings in reservas page:", err);
        if (isMounted) setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedDate, selectedStatus, displayLimit, fallbackBookings]);

  const activeBookings = fetchedBookings.length > 0 || isLoading ? fetchedBookings : fallbackBookings;

  const filteredBookings = useMemo(() => {
    return activeBookings.filter((b) => {
      if (
        search &&
        !b.clientName.toLowerCase().includes(search.toLowerCase()) &&
        !b.clientEmail.toLowerCase().includes(search.toLowerCase()) &&
        !b.cancellationCode.toLowerCase().includes(search.toLowerCase()) &&
        !b.shiftTitle.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (selectedStatus !== "all" && b.status !== selectedStatus) {
        return false;
      }
      if (selectedDate && b.shiftDate !== selectedDate) {
        return false;
      }
      return true;
    });
  }, [activeBookings, search, selectedStatus, selectedDate]);

  const handleConfirmCancel = async () => {
    if (bookingToCancel) {
      await cancelBookingByCode(bookingToCancel.cancellationCode, "Cancelado desde el panel de reservas", true);
      setBookingToCancel(null);
    }
  };

  const handleConfirmMarkAttended = async () => {
    if (bookingToMarkAttended) {
      await updateBookingStatus(bookingToMarkAttended.id, "attended");
      setBookingToMarkAttended(null);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 40);
  };

  return (
    <AppShell>
      <Header
        onOpenManualBooking={() => setBookingModalOpen(true)}
      />

      <BookingFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Mostrando {filteredBookings.length} reservas registradas
        </span>
        <button
          onClick={() => {
            setSearch("");
            setSelectedStatus("all");
            setSelectedDate("");
          }}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
        >
          Limpiar filtros
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card p-12 text-center text-slate-500 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-bold">Cargando reservas...</p>
        </div>
      ) : (
        <>
          <BookingTable
            bookings={filteredBookings}
            onViewDetails={(b) => setSelectedBookingForDetail(b)}
            onCancelBooking={(b) => setBookingToCancel(b)}
            onMarkAttended={(id) => {
              const b = activeBookings.find((x) => x.id === id);
              if (b) setBookingToMarkAttended(b);
            }}
          />

          {filteredBookings.length >= displayLimit && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Cargar más reservas
              </button>
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
