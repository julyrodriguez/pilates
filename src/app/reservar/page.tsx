"use client";

import React, { useState } from "react";
import { PublicBookingHeader } from "@/components/public/PublicBookingHeader";
import { DatePickerCarousel } from "@/components/public/DatePickerCarousel";
import { PublicShiftGrid } from "@/components/public/PublicShiftGrid";
import { PublicBookingModal } from "@/components/public/PublicBookingModal";
import { PublicBookingSuccessModal } from "@/components/public/PublicBookingSuccessModal";
import { EmailSimulatorModal } from "@/components/modals/EmailSimulatorModal";
import { useData } from "@/context/DataContext";
import { Shift, Booking } from "@/types";

function getInitialWeekday(): string {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split("T")[0];
}

export default function ReservarPublicPage() {
  const { shifts } = useData();

  const [selectedDate, setSelectedDate] = useState(getInitialWeekday());

  // Booking Flow
  const [selectedShiftForBooking, setSelectedShiftForBooking] = useState<Shift | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    cancellationCode: string;
    cancellationUrl: string;
    booking: Booking;
  } | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailCodeToPreview, setEmailCodeToPreview] = useState<string | null>(null);

  // Filter cleanly by selected date
  const filteredShifts = shifts.filter((s) => s.date === selectedDate);

  const handleBookingSuccess = (result: {
    cancellationCode: string;
    cancellationUrl: string;
    booking: Booking;
  }) => {
    setSelectedShiftForBooking(null);
    setBookingResult(result);
  };

  const handleOpenEmailPreview = (code: string) => {
    setEmailCodeToPreview(code);
    setEmailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 pb-16 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Clean Studio Header without admin link */}
        <PublicBookingHeader />

        {/* Date Selector */}
        <DatePickerCarousel
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Shift List Grid */}
        <PublicShiftGrid
          shifts={filteredShifts}
          onSelectShift={(shift) => setSelectedShiftForBooking(shift)}
        />
      </div>

      {/* Booking Form Modal (Without Login) */}
      <PublicBookingModal
        isOpen={!!selectedShiftForBooking}
        onClose={() => setSelectedShiftForBooking(null)}
        shift={selectedShiftForBooking}
        onSuccess={handleBookingSuccess}
      />

      {/* Success Celebration & Cancellation Code Ticket */}
      <PublicBookingSuccessModal
        isOpen={!!bookingResult}
        onClose={() => setBookingResult(null)}
        bookingResult={bookingResult}
        onOpenEmailPreview={handleOpenEmailPreview}
      />

      {/* Email Simulator Preview */}
      <EmailSimulatorModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        selectedEmailCode={emailCodeToPreview}
      />
    </div>
  );
}
