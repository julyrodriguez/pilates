"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { BookingFilterBar } from "@/components/bookings/BookingFilterBar";
import { BookingTable } from "@/components/bookings/BookingTable";
import { ManualBookingModal } from "@/components/bookings/ManualBookingModal";
import { BookingDetailModal } from "@/components/bookings/BookingDetailModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useData } from "@/context/DataContext";
import { Booking } from "@/types";

export default function ReservasPage() {
  const { bookings, cancelBookingByCode, updateBookingStatus } = useData();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToMarkAttended, setBookingToMarkAttended] = useState<Booking | null>(null);

  const filteredBookings = bookings.filter((b) => {
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
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
        >
          Limpiar filtros
        </button>
      </div>

      <BookingTable
        bookings={filteredBookings}
        onViewDetails={(b) => setSelectedBookingForDetail(b)}
        onCancelBooking={(b) => setBookingToCancel(b)}
        onMarkAttended={(id) => {
          const b = bookings.find((x) => x.id === id);
          if (b) setBookingToMarkAttended(b);
        }}
      />

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
