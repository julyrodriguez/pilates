"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";
import { TodayShiftsSection } from "@/components/dashboard/TodayShiftsSection";
import { OccupancyOverviewChart } from "@/components/dashboard/OccupancyOverviewChart";
import { RecentBookingsFeed } from "@/components/dashboard/RecentBookingsFeed";
import { QuickActionsBar } from "@/components/dashboard/QuickActionsBar";
import { ShiftFormModal } from "@/components/shifts/ShiftFormModal";
import { ManualBookingModal } from "@/components/bookings/ManualBookingModal";
import { ShiftAttendeesModal } from "@/components/shifts/ShiftAttendeesModal";
import { BookingDetailModal } from "@/components/bookings/BookingDetailModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useData } from "@/context/DataContext";
import { Shift, Booking } from "@/types";

export default function DashboardPage() {
  const { shifts, bookings, deleteShift, cancelBookingByCode } = useData();

  // Modals state
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [targetShiftForBooking, setTargetShiftForBooking] = useState<Shift | null>(null);
  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [selectedShiftForAttendees, setSelectedShiftForAttendees] = useState<Shift | null>(null);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<string | null>(null);

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
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
      <Header
        onOpenNewShift={() => {
          setEditingShift(null);
          setShiftModalOpen(true);
        }}
        onOpenManualBooking={() => {
          setTargetShiftForBooking(null);
          setBookingModalOpen(true);
        }}
      />

      {/* Quick Actions Bar */}
      <QuickActionsBar
        onNewShift={() => {
          setEditingShift(null);
          setShiftModalOpen(true);
        }}
        onManualBooking={() => {
          setTargetShiftForBooking(null);
          setBookingModalOpen(true);
        }}
      />

      {/* KPI Cards */}
      <DashboardKpiCards />

      {/* Today's Shifts with Visual Availability */}
      <TodayShiftsSection
        shifts={shifts}
        onEditShift={handleEditShift}
        onDeleteShift={(id) => setDeleteShiftId(id)}
        onBookClient={handleBookClient}
        onViewAttendees={handleViewAttendees}
        onNewShift={() => {
          setEditingShift(null);
          setShiftModalOpen(true);
        }}
      />

      {/* Grid with Occupancy Breakdown and Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupancyOverviewChart shifts={shifts} />
        <RecentBookingsFeed
          bookings={bookings}
          onViewDetails={(b) => setSelectedBookingForDetail(b)}
        />
      </div>

      {/* Modals */}
      <ShiftFormModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        shiftToEdit={editingShift}
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
        title="Eliminar Turno"
        message="¿Estás seguro de que deseas eliminar este turno? Las reservas asociadas serán dadas de baja."
        isDestructive={true}
        confirmText="Eliminar Turno"
        onConfirm={handleConfirmDeleteShift}
        onCancel={() => setDeleteShiftId(null)}
      />
    </AppShell>
  );
}
