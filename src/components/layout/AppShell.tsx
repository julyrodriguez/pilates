"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ShiftFormModal } from "@/components/shifts/ShiftFormModal";
import { ManualBookingModal } from "@/components/bookings/ManualBookingModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-[#110712] text-slate-800 dark:text-rose-100 bg-pattern flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-w-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Global Modals for Fast Access */}
      <ShiftFormModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
      />

      <ManualBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
    </div>
  );
}
