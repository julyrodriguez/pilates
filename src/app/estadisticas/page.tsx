"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { StatisticsDashboard } from "@/components/statistics/StatisticsDashboard";
import { ShiftFormModal } from "@/components/shifts/ShiftFormModal";
import { ManualBookingModal } from "@/components/bookings/ManualBookingModal";
import { useData } from "@/context/DataContext";
import { Shift } from "@/types";

export default function EstadisticasPage() {
  const { shifts } = useData();

  // Modals state for Header quick actions
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <AppShell>
      <Header
        onOpenNewShift={() => {
          setShiftModalOpen(true);
        }}
        onOpenManualBooking={() => {
          setBookingModalOpen(true);
        }}
      />

      {/* Main Statistics & Financial Dashboard */}
      <StatisticsDashboard />

      {/* Quick Action Modals */}
      <ShiftFormModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
      />

      <ManualBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
    </AppShell>
  );
}
