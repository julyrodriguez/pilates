"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Shift, Booking, Instructor, Client, EmailLog, StudioSettings, ShiftStatus } from "@/types";
import {
  initialShifts,
  initialBookings,
  initialInstructors,
  initialClients,
  initialEmailLogs,
  initialStudioSettings,
} from "@/lib/mockData";
import { getFirebaseDb } from "@/lib/firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

interface DataContextType {
  shifts: Shift[];
  bookings: Booking[];
  instructors: Instructor[];
  clients: Client[];
  emailLogs: EmailLog[];
  settings: StudioSettings;
  loading: boolean;
  isFirebaseActive: boolean;
  addShift: (shift: Omit<Shift, "id" | "bookedCount" | "status" | "createdAt">) => Promise<Shift>;
  updateShift: (id: string, updates: Partial<Shift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  createBooking: (bookingInput: {
    shiftId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    notes?: string;
  }) => Promise<{ booking: Booking; cancellationCode: string; cancellationUrl: string }>;
  cancelBookingByCode: (
    cancellationCode: string,
    reason?: string
  ) => Promise<{ success: boolean; message: string; booking?: Booking }>;
  updateBookingStatus: (id: string, status: Booking["status"]) => Promise<void>;
  addInstructor: (instructor: Omit<Instructor, "id">) => Promise<Instructor>;
  updateInstructor: (id: string, updates: Partial<Instructor>) => Promise<void>;
  deleteInstructor: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<StudioSettings>) => Promise<void>;
  resetToMockData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = "pilates_app_";

function calculateShiftStatus(capacity: number, bookedCount: number): ShiftStatus {
  if (bookedCount >= capacity) return "full";
  if (bookedCount >= capacity - 2 && capacity > 2) return "almost_full";
  return "available";
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [instructors, setInstructors] = useState<Instructor[]>(initialInstructors);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(initialEmailLogs);
  const [settings, setSettings] = useState<StudioSettings>(initialStudioSettings);
  const [loading, setLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);

  // Load initial data (LocalStorage + Firestore fallback/sync)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // 1. Try local storage cache first for instant responsiveness
        const cachedShifts = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "shifts");
        const cachedBookings = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "bookings");
        const cachedInstructors = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "instructors");
        const cachedClients = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "clients");
        const cachedEmails = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "emails");
        const cachedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "settings");

        if (cachedShifts) setShifts(JSON.parse(cachedShifts));
        if (cachedBookings) setBookings(JSON.parse(cachedBookings));
        if (cachedInstructors) setInstructors(JSON.parse(cachedInstructors));
        if (cachedClients) setClients(JSON.parse(cachedClients));
        if (cachedEmails) setEmailLogs(JSON.parse(cachedEmails));
        if (cachedSettings) setSettings(JSON.parse(cachedSettings));

        // 2. Try Firestore connection
        const db = getFirebaseDb();
        if (db) {
          try {
            const shiftsSnap = await getDocs(collection(db, "pilates_shifts"));
            if (!shiftsSnap.empty) {
              const loadedShifts = shiftsSnap.docs.map((d) => d.data() as Shift);
              if (isMounted) setShifts(loadedShifts);
              setIsFirebaseActive(true);
            } else {
              // Firebase is reachable but collection empty -> seed initial data in Firestore
              setIsFirebaseActive(true);
            }

            const bookingsSnap = await getDocs(collection(db, "pilates_bookings"));
            if (!bookingsSnap.empty && isMounted) {
              setBookings(bookingsSnap.docs.map((d) => d.data() as Booking));
            }

            const instructorsSnap = await getDocs(collection(db, "pilates_instructors"));
            if (!instructorsSnap.empty && isMounted) {
              setInstructors(instructorsSnap.docs.map((d) => d.data() as Instructor));
            }
          } catch (fireErr) {
            console.info("Firestore online sync in standalone mode:", fireErr);
          }
        }
      } catch (err) {
        console.warn("Storage loading error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "shifts", JSON.stringify(shifts));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "bookings", JSON.stringify(bookings));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "instructors", JSON.stringify(instructors));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "clients", JSON.stringify(clients));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "emails", JSON.stringify(emailLogs));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "settings", JSON.stringify(settings));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }, [shifts, bookings, instructors, clients, emailLogs, settings, loading]);

  const addShift = useCallback(
    async (shiftData: Omit<Shift, "id" | "bookedCount" | "status" | "createdAt">): Promise<Shift> => {
      const newShift: Shift = {
        ...shiftData,
        id: `shift-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bookedCount: 0,
        status: "available",
        createdAt: new Date().toISOString(),
      };

      setShifts((prev) => [newShift, ...prev]);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_shifts", newShift.id), newShift);
        } catch (e) {
          console.warn("Firestore sync warning:", e);
        }
      }

      return newShift;
    },
    []
  );

  const updateShift = useCallback(async (id: string, updates: Partial<Shift>) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        updated.status = calculateShiftStatus(updated.capacity, updated.bookedCount);
        return updated;
      })
    );

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_shifts", id), updates, { merge: true });
      } catch (e) {
        console.warn("Firestore sync warning:", e);
      }
    }
  }, []);

  const deleteShift = useCallback(async (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    setBookings((prev) => prev.filter((b) => b.shiftId !== id));

    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, "pilates_shifts", id));
      } catch (e) {
        console.warn("Firestore delete warning:", e);
      }
    }
  }, []);

  const createBooking = useCallback(
    async (input: {
      shiftId: string;
      clientName: string;
      clientEmail: string;
      clientPhone: string;
      notes?: string;
    }) => {
      const targetShift = shifts.find((s) => s.id === input.shiftId);
      if (!targetShift) {
        throw new Error("El turno seleccionado no existe.");
      }

      if (targetShift.bookedCount >= targetShift.capacity) {
        throw new Error("Lo sentimos, este turno ya está completo.");
      }

      // Generate unique alphanumeric cancellation token
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const clientInitials = input.clientName.replace(/\s+/g, "").substring(0, 4).toUpperCase();
      const cancellationCode = `PIL-${clientInitials}-${randomCode}`;
      const cancellationUrl = `/cancelar/${cancellationCode}`;

      const newBooking: Booking = {
        id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        shiftId: targetShift.id,
        shiftTitle: targetShift.title,
        shiftDate: targetShift.date,
        shiftTime: targetShift.startTime,
        discipline: targetShift.discipline,
        instructorName: targetShift.instructorName,
        room: targetShift.room,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        cancellationCode,
        status: "confirmed",
        notes: input.notes || "",
        price: targetShift.price,
        createdAt: new Date().toISOString(),
      };

      // 1. Update Shift booked count
      const updatedBookedCount = targetShift.bookedCount + 1;
      const updatedShiftStatus = calculateShiftStatus(targetShift.capacity, updatedBookedCount);

      setShifts((prev) =>
        prev.map((s) =>
          s.id === targetShift.id
            ? { ...s, bookedCount: updatedBookedCount, status: updatedShiftStatus }
            : s
        )
      );

      // 2. Add Booking
      setBookings((prev) => [newBooking, ...prev]);

      // 3. Upsert Client
      setClients((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.email.toLowerCase() === input.clientEmail.toLowerCase()
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            name: input.clientName,
            phone: input.clientPhone,
            totalBookings: updated[existingIndex].totalBookings + 1,
            lastBookingDate: targetShift.date,
          };
          return updated;
        } else {
          const newClient: Client = {
            id: `cli-${Date.now()}`,
            name: input.clientName,
            email: input.clientEmail,
            phone: input.clientPhone,
            totalBookings: 1,
            attendedBookings: 0,
            cancelledBookings: 0,
            lastBookingDate: targetShift.date,
            createdAt: new Date().toISOString().split("T")[0],
          };
          return [newClient, ...prev];
        }
      });

      // 4. Log Confirmation Email Notification
      const newEmailLog: EmailLog = {
        id: `email-${Date.now()}`,
        bookingId: newBooking.id,
        recipientEmail: input.clientEmail,
        recipientName: input.clientName,
        subject: `✨ ¡Confirmación de reserva en ${settings.studioName}! - ${targetShift.title}`,
        shiftTitle: targetShift.title,
        shiftDate: targetShift.date,
        shiftTime: targetShift.startTime,
        cancellationCode,
        cancellationUrl,
        sentAt: new Date().toISOString(),
        status: "sent",
      };

      setEmailLogs((prev) => [newEmailLog, ...prev]);

      // 5. Sync to Firebase
      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_bookings", newBooking.id), newBooking);
          await setDoc(
            doc(db, "pilates_shifts", targetShift.id),
            { bookedCount: updatedBookedCount, status: updatedShiftStatus },
            { merge: true }
          );
        } catch (e) {
          console.warn("Firestore sync warning on booking:", e);
        }
      }

      return { booking: newBooking, cancellationCode, cancellationUrl };
    },
    [shifts, settings.studioName]
  );

  const cancelBookingByCode = useCallback(
    async (
      cancellationCode: string,
      reason?: string
    ): Promise<{ success: boolean; message: string; booking?: Booking }> => {
      const cleanCode = cancellationCode.trim().toUpperCase();
      const targetBooking = bookings.find(
        (b) => b.cancellationCode.toUpperCase() === cleanCode
      );

      if (!targetBooking) {
        return {
          success: false,
          message: "Código de reserva no encontrado o enlace inválido.",
        };
      }

      if (targetBooking.status === "cancelled") {
        return {
          success: false,
          message: "Esta reserva ya había sido cancelada previamente.",
          booking: targetBooking,
        };
      }

      // Update Booking
      const updatedBooking: Booking = {
        ...targetBooking,
        status: "cancelled",
        cancellationReason: reason || "Cancelado por el alumno vía enlace único",
        cancelledAt: new Date().toISOString(),
      };

      setBookings((prev) =>
        prev.map((b) => (b.id === targetBooking.id ? updatedBooking : b))
      );

      // Decrement bookedCount in Shift
      setShifts((prev) =>
        prev.map((s) => {
          if (s.id === targetBooking.shiftId) {
            const newCount = Math.max(0, s.bookedCount - 1);
            return {
              ...s,
              bookedCount: newCount,
              status: calculateShiftStatus(s.capacity, newCount),
            };
          }
          return s;
        })
      );

      // Update Client stats
      setClients((prev) =>
        prev.map((c) =>
          c.email.toLowerCase() === targetBooking.clientEmail.toLowerCase()
            ? { ...c, cancelledBookings: c.cancelledBookings + 1 }
            : c
        )
      );

      // Sync with Firestore
      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_bookings", targetBooking.id), updatedBooking, {
            merge: true,
          });
          const currentShift = shifts.find((s) => s.id === targetBooking.shiftId);
          if (currentShift) {
            const newCount = Math.max(0, currentShift.bookedCount - 1);
            await setDoc(
              doc(db, "pilates_shifts", targetBooking.shiftId),
              {
                bookedCount: newCount,
                status: calculateShiftStatus(currentShift.capacity, newCount),
              },
              { merge: true }
            );
          }
        } catch (e) {
          console.warn("Firestore cancellation sync warning:", e);
        }
      }

      return {
        success: true,
        message: "Tu turno ha sido cancelado exitosamente y el cupo fue liberado.",
        booking: updatedBooking,
      };
    },
    [bookings, shifts]
  );

  const updateBookingStatus = useCallback(
    async (id: string, status: Booking["status"]) => {
      const target = bookings.find((b) => b.id === id);
      if (!target) return;

      const wasCancelled = target.status === "cancelled";
      const isNowCancelled = status === "cancelled";

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );

      // Adjust shift capacity if status transitioned to/from cancelled
      if (!wasCancelled && isNowCancelled) {
        setShifts((prev) =>
          prev.map((s) => {
            if (s.id === target.shiftId) {
              const newCount = Math.max(0, s.bookedCount - 1);
              return { ...s, bookedCount: newCount, status: calculateShiftStatus(s.capacity, newCount) };
            }
            return s;
          })
        );
      } else if (wasCancelled && !isNowCancelled) {
        setShifts((prev) =>
          prev.map((s) => {
            if (s.id === target.shiftId) {
              const newCount = s.bookedCount + 1;
              return { ...s, bookedCount: newCount, status: calculateShiftStatus(s.capacity, newCount) };
            }
            return s;
          })
        );
      }

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_bookings", id), { status }, { merge: true });
        } catch (e) {
          console.warn("Firestore sync booking status warning:", e);
        }
      }
    },
    [bookings]
  );

  const addInstructor = useCallback(
    async (data: Omit<Instructor, "id">): Promise<Instructor> => {
      const newInst: Instructor = {
        ...data,
        id: `inst-${Date.now()}`,
      };
      setInstructors((prev) => [...prev, newInst]);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_instructors", newInst.id), newInst);
        } catch (e) {
          console.warn("Firestore add instructor warning:", e);
        }
      }
      return newInst;
    },
    []
  );

  const updateInstructor = useCallback(async (id: string, updates: Partial<Instructor>) => {
    setInstructors((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, ...updates } : inst))
    );
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_instructors", id), updates, { merge: true });
      } catch (e) {
        console.warn("Firestore update instructor warning:", e);
      }
    }
  }, []);

  const deleteInstructor = useCallback(async (id: string) => {
    setInstructors((prev) => prev.filter((inst) => inst.id !== id));
    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, "pilates_instructors", id));
      } catch (e) {
        console.warn("Firestore delete instructor warning:", e);
      }
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<StudioSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_settings", "general"), updates, { merge: true });
      } catch (e) {
        console.warn("Firestore update settings warning:", e);
      }
    }
  }, []);

  const resetToMockData = useCallback(async () => {
    setShifts(initialShifts);
    setBookings(initialBookings);
    setInstructors(initialInstructors);
    setClients(initialClients);
    setEmailLogs(initialEmailLogs);
    setSettings(initialStudioSettings);

    const db = getFirebaseDb();
    if (db) {
      try {
        const batch = writeBatch(db);
        initialShifts.forEach((s) => batch.set(doc(db, "pilates_shifts", s.id), s));
        initialBookings.forEach((b) => batch.set(doc(db, "pilates_bookings", b.id), b));
        initialInstructors.forEach((i) => batch.set(doc(db, "pilates_instructors", i.id), i));
        await batch.commit();
      } catch (e) {
        console.warn("Firestore batch reset warning:", e);
      }
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        shifts,
        bookings,
        instructors,
        clients,
        emailLogs,
        settings,
        loading,
        isFirebaseActive,
        addShift,
        updateShift,
        deleteShift,
        createBooking,
        cancelBookingByCode,
        updateBookingStatus,
        addInstructor,
        updateInstructor,
        deleteInstructor,
        updateSettings,
        resetToMockData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
