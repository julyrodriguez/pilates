"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ShiftFormModal } from "@/components/shifts/ShiftFormModal";
import { ManualBookingModal } from "@/components/bookings/ManualBookingModal";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200 w-full overflow-x-hidden">
      {/* Sidebar Navigation (Desktop & Drawer) */}
      <Sidebar />

      {/* Main Content Area with bottom padding on mobile for the fixed Bottom Nav */}
      <main className="flex-1 w-full lg:pl-64 min-w-0 pb-20 lg:pb-6 transition-all duration-300">
        <div className="w-full max-w-[1920px] mx-auto p-3 sm:p-5 lg:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenNewShift={() => setShiftModalOpen(true)}
        onOpenManualBooking={() => setBookingModalOpen(true)}
      />

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
