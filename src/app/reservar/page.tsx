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
import { Info, CalendarX } from "lucide-react";

function getInitialWeekday(): string {
  const d = new Date();
  while (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ReservarPublicPage() {
  const { settings } = useData();

  const [selectedDate, setSelectedDate] = useState(getInitialWeekday());
  const [dayShifts, setDayShifts] = useState<Shift[]>([]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [isLoadingDay, setIsLoadingDay] = useState(true);

  // In-memory cache for loaded dates to ensure instant responsiveness
  const dateCache = useRef<Record<string, { shifts: Shift[]; bookings: Booking[] }>>({});

  // Check if selected day is marked as blocked / closed by admin
  const blockedDayInfo = useMemo(() => {
    if (!settings?.blockedDates || settings.blockedDates.length === 0) return null;
    return settings.blockedDates.find((b) =>
      typeof b === "string" ? b === selectedDate : b.date === selectedDate
    );
  }, [settings?.blockedDates, selectedDate]);

  // If the initial date happens to be blocked, automatically advance to next available day
  useEffect(() => {
    if (!settings?.blockedDates || settings.blockedDates.length === 0) return;
    const isCurrentBlocked = settings.blockedDates.some((b) =>
      typeof b === "string" ? b === selectedDate : b.date === selectedDate
    );

    if (isCurrentBlocked) {
      try {
        const [y, m, d] = selectedDate.split("-").map(Number);
        const checkDate = new Date(y, m - 1, d, 12, 0, 0);
        for (let i = 1; i <= 14; i++) {
          checkDate.setDate(checkDate.getDate() + 1);
          if (checkDate.getDay() === 0) continue; // Skip Sunday
          const nextStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
          const isNextBlocked = settings.blockedDates.some((b) =>
            typeof b === "string" ? b === nextStr : b.date === nextStr
          );
          if (!isNextBlocked) {
            setSelectedDate(nextStr);
            break;
          }
        }
      } catch {}
    }
  }, [settings?.blockedDates]);

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

    // If day is blocked by admin, no need to query Firestore
    if (blockedDayInfo) {
      setDayShifts([]);
      setDayBookings([]);
      setIsLoadingDay(false);
      return;
    }

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
  }, [selectedDate, blockedDayInfo]);

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
    <main className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 pb-16 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Clean Studio Header with My Bookings button */}
        <PublicBookingHeader onOpenMyBookings={() => setMyBookingsModalOpen(true)} />

        {/* Optional Public Announcement Banner from Admin */}
        {settings?.publicNoticeBanner && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-2xs">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="flex-1">{settings.publicNoticeBanner}</span>
          </div>
        )}

        {/* Date Selector Section */}
        <section aria-label="Selección de fecha para reservar">
          <DatePickerCarousel
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            bookingWeeksAhead={settings?.bookingWeeksAhead}
            blockedDates={settings?.blockedDates}
          />
        </section>

        {/* Shift List Grid Section OR Blocked Day Notice */}
        {blockedDayInfo ? (
          <section aria-label="Aviso de día cerrado" className="mt-6">
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 sm:p-12 text-center my-4 shadow-xs">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <CalendarX className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Estudio Cerrado este Día
              </h3>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">
                {blockedDayInfo.reason || "Este día no está habilitado para reservas."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Por favor selecciona otro día en el calendario superior para consultar los horarios disponibles y reservar tu clase.
              </p>
            </div>
          </section>
        ) : (
          <section aria-label="Turnos disponibles para el día seleccionado" className="mt-6">
            <PublicShiftGrid
              shifts={filteredShifts}
              isLoading={isLoadingDay}
              onSelectShift={(shift) => setSelectedShiftForBooking(shift)}
            />
          </section>
        )}
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
    </main>
  );
}
