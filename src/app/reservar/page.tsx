"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { PublicBookingHeader } from "@/components/public/PublicBookingHeader";
import { DatePickerCarousel } from "@/components/public/DatePickerCarousel";
import { PublicShiftGrid } from "@/components/public/PublicShiftGrid";
import { PublicBookingModal } from "@/components/public/PublicBookingModal";
import { PublicBookingSuccessModal } from "@/components/public/PublicBookingSuccessModal";
import { MyBookingsLookupModal } from "@/components/public/MyBookingsLookupModal";
import { EmailSimulatorModal } from "@/components/modals/EmailSimulatorModal";
import { useData } from "@/context/DataContext";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Shift, Booking } from "@/types";

function getInitialWeekday(): string {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split("T")[0];
}

export default function ReservarPublicPage() {
  const [selectedDate, setSelectedDate] = useState(getInitialWeekday());
  const [dayShifts, setDayShifts] = useState<Shift[]>([]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [isLoadingDay, setIsLoadingDay] = useState(true);

  // In-memory cache for loaded dates to ensure instant responsiveness
  const dateCache = useRef<Record<string, { shifts: Shift[]; bookings: Booking[] }>>({});

  // Booking Flow
  const [selectedShiftForBooking, setSelectedShiftForBooking] = useState<Shift | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    cancellationCode: string;
    cancellationUrl: string;
    booking: Booking;
  } | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailCodeToPreview, setEmailCodeToPreview] = useState<string | null>(null);
  const [myBookingsModalOpen, setMyBookingsModalOpen] = useState(false);

  // Realtime subscription ONLY for the selected date
  useEffect(() => {
    let isMounted = true;

    // Check if we have cached data for this day
    if (dateCache.current[selectedDate]) {
      setDayShifts(dateCache.current[selectedDate].shifts);
      setDayBookings(dateCache.current[selectedDate].bookings);
      setIsLoadingDay(false);
    } else {
      setIsLoadingDay(true);
    }

    const db = getFirebaseDb();
    if (!db) {
      setIsLoadingDay(false);
      return;
    }

    const unsubscribes: Array<() => void> = [];

    try {
      // 1. Listen ONLY to shifts of the selectedDate
      const shiftsQuery = query(
        collection(db, "pilates_shifts"),
        where("date", "==", selectedDate)
      );

      const unsubShifts = onSnapshot(
        shiftsQuery,
        (snap) => {
          if (!isMounted) return;
          const loadedShifts = snap.docs
            .map((d) => d.data() as Shift)
            .filter((s) => s && s.id && !s.id.startsWith("_"));

          setDayShifts(loadedShifts);
          if (!dateCache.current[selectedDate]) {
            dateCache.current[selectedDate] = { shifts: loadedShifts, bookings: [] };
          } else {
            dateCache.current[selectedDate].shifts = loadedShifts;
          }
          setIsLoadingDay(false);
        },
        (err) => {
          console.warn("Error fetching shifts for selected date:", err);
          if (isMounted) setIsLoadingDay(false);
        }
      );
      unsubscribes.push(unsubShifts);

      // 2. Listen ONLY to bookings of the selectedDate
      const bookingsQuery = query(
        collection(db, "pilates_bookings"),
        where("shiftDate", "==", selectedDate)
      );

      const unsubBookings = onSnapshot(
        bookingsQuery,
        (snap) => {
          if (!isMounted) return;
          const loadedBookings = snap.docs
            .map((d) => d.data() as Booking)
            .filter((b) => b && b.id && !b.id.startsWith("_") && b.shiftId !== "deleted");

          setDayBookings(loadedBookings);
          if (!dateCache.current[selectedDate]) {
            dateCache.current[selectedDate] = { shifts: [], bookings: loadedBookings };
          } else {
            dateCache.current[selectedDate].bookings = loadedBookings;
          }
        },
        (err) => {
          console.warn("Error fetching bookings for selected date:", err);
        }
      );
      unsubscribes.push(unsubBookings);
    } catch (err) {
      console.warn("Firestore subscription error for date:", err);
      if (isMounted) setIsLoadingDay(false);
    }

    return () => {
      isMounted = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [selectedDate]);

  // Live shifts computed with realtime synchronization for the selected day
  const liveShifts = useMemo(() => {
    return dayShifts.map((shift) => {
      const activeConfirmedCount = dayBookings.filter(
        (b) => b.shiftId === shift.id && b.status === "confirmed"
      ).length;
      const bookedCount = Math.max(shift.bookedCount || 0, activeConfirmedCount);
      const isFull = bookedCount >= shift.capacity;
      const status = isFull
        ? ("full" as const)
        : bookedCount >= shift.capacity - 2 && shift.capacity > 2
        ? ("almost_full" as const)
        : ("available" as const);

      return {
        ...shift,
        bookedCount,
        status,
      };
    });
  }, [dayShifts, dayBookings]);

  // Filter cleanly by selected date and completely hide past/started shifts
  const filteredShifts = useMemo(() => {
    return liveShifts.filter((s) => {
      if (s.date !== selectedDate) return false;
      try {
        const now = new Date();
        const [year, month, day] = s.date.split("-").map(Number);
        const [hours, minutes] = s.startTime.split(":").map(Number);
        const shiftDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        return now.getTime() < shiftDate.getTime();
      } catch {
        return true;
      }
    });
  }, [liveShifts, selectedDate]);

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
        {/* Clean Studio Header with My Bookings button */}
        <PublicBookingHeader onOpenMyBookings={() => setMyBookingsModalOpen(true)} />

        {/* Date Selector */}
        <DatePickerCarousel
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Shift List Grid with Loading state */}
        <PublicShiftGrid
          shifts={filteredShifts}
          isLoading={isLoadingDay}
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

      {/* My Bookings Lookup Modal (Search by email/phone/reference code & modify/cancel) */}
      <MyBookingsLookupModal
        isOpen={myBookingsModalOpen}
        onClose={() => setMyBookingsModalOpen(false)}
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
