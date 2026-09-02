"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WeeklyCalendarView } from "@/components/calendar/WeeklyCalendarView";
import { ShiftFormModal } from "@/components/shifts/ShiftFormModal";
import { ManualBookingModal } from "@/components/bookings/ManualBookingModal";
import { ShiftAttendeesModal } from "@/components/shifts/ShiftAttendeesModal";
import { BookingDetailModal } from "@/components/bookings/BookingDetailModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useData } from "@/context/DataContext";
import { Shift, Booking } from "@/types";

export default function DashboardPage() {
  const { shifts, instructors, deleteShift, cancelBookingByCode } = useData();

  // Modals state
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [preselectedDateForNewShift, setPreselectedDateForNewShift] = useState<string | undefined>(undefined);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [targetShiftForBooking, setTargetShiftForBooking] = useState<Shift | null>(null);
  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [selectedShiftForAttendees, setSelectedShiftForAttendees] = useState<Shift | null>(null);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<string | null>(null);

  const handleOpenNewShift = (preselectedDate?: string) => {
    setEditingShift(null);
    setPreselectedDateForNewShift(preselectedDate);
    setShiftModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setPreselectedDateForNewShift(undefined);
    setShiftModalOpen(true);
  };

  const handleBookClient = (shift: Shift) => {
    setTargetShiftForBooking(shift);
    setBookingModalOpen(true);
  };

  const handleViewAttendees = (shift: Shift) => {
    setSelectedShiftForAttendees(shift);
    setAttendeesModalOpen(true);
  };

  const handleConfirmDeleteShift = async () => {
    if (deleteShiftId) {
      await deleteShift(deleteShiftId);
      setDeleteShiftId(null);
    }
  };

  return (
    <AppShell>
      {/* Interactive Weekly Calendar Schedule Board (Header removed for clean view) */}
      <WeeklyCalendarView
        shifts={shifts}
        instructors={instructors}
        onNewShift={handleOpenNewShift}
        onEditShift={handleEditShift}
        onDeleteShift={(id) => setDeleteShiftId(id)}
        onBookClient={handleBookClient}
        onViewAttendees={handleViewAttendees}
      />

      {/* Modals */}
      <ShiftFormModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        shiftToEdit={editingShift}
        preselectedDate={preselectedDateForNewShift}
      />

      <ManualBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        shiftToBook={targetShiftForBooking}
      />

      <ShiftAttendeesModal
        isOpen={attendeesModalOpen}
        onClose={() => setAttendeesModalOpen(false)}
        shift={selectedShiftForAttendees}
        onOpenManualBooking={(shift) => {
          setTargetShiftForBooking(shift);
          setBookingModalOpen(true);
        }}
      />

      <BookingDetailModal
        isOpen={!!selectedBookingForDetail}
        onClose={() => setSelectedBookingForDetail(null)}
        booking={selectedBookingForDetail}
        onCancelBooking={(b) => cancelBookingByCode(b.cancellationCode)}
      />

      <ConfirmModal
        isOpen={!!deleteShiftId}
        title="Eliminar Clase"
        message="¿Estás seguro de que deseas eliminar esta clase? Las reservas asociadas serán canceladas."
        isDestructive={true}
        confirmText="Eliminar Clase"
        onConfirm={handleConfirmDeleteShift}
        onCancel={() => setDeleteShiftId(null)}
      />
    </AppShell>
  );
}
