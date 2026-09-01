"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Shift, Booking, Instructor, Client, EmailLog, StudioSettings, ShiftStatus, Discipline } from "@/types";
import {
  initialShifts,
  initialBookings,
  initialInstructors,
  initialClients,
  initialEmailLogs,
  initialStudioSettings,
  initialDisciplines,
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
  disciplines: Discipline[];
  loading: boolean;
  isFirebaseActive: boolean;
  addDiscipline: (data: { name: string; slug?: string; description?: string; color?: string }) => Promise<Discipline>;
  deleteDiscipline: (id: string) => Promise<void>;
  updateDiscipline: (id: string, updates: Partial<Discipline>) => Promise<void>;
  addShift: (shift: Omit<Shift, "id" | "bookedCount" | "status" | "createdAt">) => Promise<Shift>;
  addShiftsBatch: (shiftsData: Omit<Shift, "id" | "bookedCount" | "status" | "createdAt">[]) => Promise<Shift[]>;
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
  addClient: (client: Omit<Client, "id" | "totalBookings" | "attendedBookings" | "cancelledBookings" | "lastBookingDate" | "createdAt"> & Partial<Client>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<StudioSettings>) => Promise<void>;
  resetToMockData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = "pilates_app_v2_";

function calculateShiftStatus(capacity: number, bookedCount: number): ShiftStatus {
  if (bookedCount >= capacity) return "full";
  if (bookedCount >= capacity - 2 && capacity > 2) return "almost_full";
  return "available";
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [settings, setSettings] = useState<StudioSettings>(initialStudioSettings);
  const [disciplines, setDisciplines] = useState<Discipline[]>(initialDisciplines);
  const [loading, setLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);

  // Load data from Firestore & LocalStorage cache
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Limpiar caches anteriores con datos de muestra
        ["shifts", "bookings", "instructors", "clients", "emails"].forEach((k) => {
          localStorage.removeItem("pilates_app_" + k);
        });

        // 1. Try local storage cache for instant rendering
        const cachedShifts = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "shifts");
        const cachedBookings = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "bookings");
        const cachedInstructors = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "instructors");
        const cachedClients = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "clients");
        const cachedEmails = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "emails");
        const cachedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "settings");
        const cachedDisciplines = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "disciplines");

        if (cachedShifts) setShifts(JSON.parse(cachedShifts));
        if (cachedBookings) setBookings(JSON.parse(cachedBookings));
        if (cachedInstructors) setInstructors(JSON.parse(cachedInstructors));
        if (cachedClients) setClients(JSON.parse(cachedClients));
        if (cachedEmails) setEmailLogs(JSON.parse(cachedEmails));
        if (cachedSettings) setSettings(JSON.parse(cachedSettings));
        if (cachedDisciplines) setDisciplines(JSON.parse(cachedDisciplines));

        // 2. Fetch directly from Firestore (pure DB data, no fake seeds)
        const db = getFirebaseDb();
        if (db) {
          try {
            const shiftsSnap = await getDocs(collection(db, "pilates_shifts"));
            if (isMounted) {
              setShifts(shiftsSnap.docs.map((d) => d.data() as Shift));
              setIsFirebaseActive(true);
            }

            const bookingsSnap = await getDocs(collection(db, "pilates_bookings"));
            if (isMounted) {
              setBookings(bookingsSnap.docs.map((d) => d.data() as Booking));
            }

            const instructorsSnap = await getDocs(collection(db, "pilates_instructors"));
            if (isMounted) {
              setInstructors(instructorsSnap.docs.map((d) => d.data() as Instructor));
            }

            const clientsSnap = await getDocs(collection(db, "pilates_clients"));
            if (isMounted) {
              setClients(clientsSnap.docs.map((d) => d.data() as Client));
            }

            const emailsSnap = await getDocs(collection(db, "pilates_emails"));
            if (isMounted) {
              setEmailLogs(emailsSnap.docs.map((d) => d.data() as EmailLog));
            }

            const disciplinesSnap = await getDocs(collection(db, "pilates_disciplines"));
            if (!disciplinesSnap.empty && isMounted) {
              setDisciplines(disciplinesSnap.docs.map((d) => d.data() as Discipline));
            } else if (disciplinesSnap.empty) {
              // Inicializar en Firestore si no existe ninguna
              const batch = writeBatch(db);
              initialDisciplines.forEach((disc) => {
                batch.set(doc(db, "pilates_disciplines", disc.id), disc);
              });
              await batch.commit();
              if (isMounted) setDisciplines(initialDisciplines);
            }

            const settingsSnap = await getDocs(collection(db, "pilates_settings"));
            if (!settingsSnap.empty && isMounted) {
              const generalDoc = settingsSnap.docs.find((d) => d.id === "general");
              if (generalDoc) {
                setSettings(generalDoc.data() as StudioSettings);
              }
            }
          } catch (fireErr) {
            console.warn("Firestore sync status (check rules):", fireErr);
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

  // Save changes to localStorage cache
  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "shifts", JSON.stringify(shifts));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "bookings", JSON.stringify(bookings));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "instructors", JSON.stringify(instructors));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "clients", JSON.stringify(clients));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "emails", JSON.stringify(emailLogs));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "settings", JSON.stringify(settings));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "disciplines", JSON.stringify(disciplines));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }, [shifts, bookings, instructors, clients, emailLogs, settings, disciplines, loading]);

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
          setIsFirebaseActive(true);
        } catch (e) {
          console.warn("Firestore error adding shift:", e);
        }
      }

      return newShift;
    },
    []
  );

  const addShiftsBatch = useCallback(
    async (
      shiftsData: Omit<Shift, "id" | "bookedCount" | "status" | "createdAt">[]
    ): Promise<Shift[]> => {
      const nowStr = new Date().toISOString();
      const newShifts: Shift[] = shiftsData.map((shiftData, idx) => ({
        ...shiftData,
        id: `shift-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        bookedCount: 0,
        status: "available",
        createdAt: nowStr,
      }));

      setShifts((prev) => [...newShifts, ...prev]);

      const db = getFirebaseDb();
      if (db && newShifts.length > 0) {
        try {
          const batch = writeBatch(db);
          newShifts.forEach((s) => {
            batch.set(doc(db, "pilates_shifts", s.id), s);
          });
          await batch.commit();
          setIsFirebaseActive(true);
        } catch (e) {
          console.warn("Firestore error batch adding shifts:", e);
        }
      }

      return newShifts;
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
        console.warn("Firestore error updating shift:", e);
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
        console.warn("Firestore error deleting shift:", e);
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
        clientName: input.clientName.trim(),
        clientEmail: input.clientEmail.trim().toLowerCase(),
        clientPhone: input.clientPhone.trim(),
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

      // 3. Upsert Client (Buscar o crear alumno)
      let targetClient: Client;
      const existingClient = clients.find(
        (c) => c.email.toLowerCase() === input.clientEmail.trim().toLowerCase()
      );

      if (existingClient) {
        targetClient = {
          ...existingClient,
          name: input.clientName.trim() || existingClient.name,
          phone: input.clientPhone.trim() || existingClient.phone,
          totalBookings: (existingClient.totalBookings || 0) + 1,
          lastBookingDate: targetShift.date,
        };
        setClients((prev) =>
          prev.map((c) => (c.id === existingClient.id ? targetClient : c))
        );
      } else {
        targetClient = {
          id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: input.clientName.trim(),
          email: input.clientEmail.trim().toLowerCase(),
          phone: input.clientPhone.trim(),
          totalBookings: 1,
          attendedBookings: 0,
          cancelledBookings: 0,
          lastBookingDate: targetShift.date,
          healthNotes: input.notes || "",
          createdAt: new Date().toISOString().split("T")[0],
        };
        setClients((prev) => [targetClient, ...prev]);
      }

      // 4. Log Confirmation Email Notification
      const newEmailLog: EmailLog = {
        id: `email-${Date.now()}`,
        bookingId: newBooking.id,
        recipientEmail: input.clientEmail.trim().toLowerCase(),
        recipientName: input.clientName.trim(),
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

      // 5. Enviar Email Real vía Nodemailer en background
      try {
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "confirmation",
            recipientEmail: newBooking.clientEmail,
            recipientName: newBooking.clientName,
            shiftTitle: targetShift.title,
            shiftDate: targetShift.date,
            shiftTime: targetShift.startTime,
            instructorName: targetShift.instructorName,
            room: targetShift.room,
            cancellationCode,
            cancellationUrl,
            studioName: settings.studioName,
          }),
        }).catch((mailErr) => {
          console.warn("Error enviando email real de confirmación:", mailErr);
        });
      } catch (e) {
        console.warn("Mail dispatch error:", e);
      }

      // 6. Sync to Firebase Firestore (Persistir Shift, Booking, Alumno y Log)
      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_bookings", newBooking.id), newBooking);
          await setDoc(
            doc(db, "pilates_shifts", targetShift.id),
            { bookedCount: updatedBookedCount, status: updatedShiftStatus },
            { merge: true }
          );
          await setDoc(doc(db, "pilates_clients", targetClient.id), targetClient, { merge: true });
          await setDoc(doc(db, "pilates_emails", newEmailLog.id), newEmailLog);
          setIsFirebaseActive(true);
        } catch (e) {
          console.warn("Firestore save error on booking:", e);
        }
      }

      return { booking: newBooking, cancellationCode, cancellationUrl };
    },
    [shifts, clients, settings.studioName]
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
            ? { ...c, cancelledBookings: (c.cancelledBookings || 0) + 1 }
            : c
        )
      );

      // Send real cancellation email
      try {
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "cancellation",
            recipientEmail: targetBooking.clientEmail,
            recipientName: targetBooking.clientName,
            shiftTitle: targetBooking.shiftTitle,
            shiftDate: targetBooking.shiftDate,
            shiftTime: targetBooking.shiftTime,
            studioName: settings.studioName,
          }),
        }).catch((err) => {
          console.warn("Error enviando email real de cancelación:", err);
        });
      } catch (e) {
        console.warn("Mail cancellation dispatch error:", e);
      }

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
          const clientObj = clients.find(
            (c) => c.email.toLowerCase() === targetBooking.clientEmail.toLowerCase()
          );
          if (clientObj) {
            await setDoc(
              doc(db, "pilates_clients", clientObj.id),
              { cancelledBookings: (clientObj.cancelledBookings || 0) + 1 },
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
    [bookings, shifts, clients, settings.studioName]
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

  const addClient = useCallback(
    async (
      data: Omit<
        Client,
        | "id"
        | "totalBookings"
        | "attendedBookings"
        | "cancelledBookings"
        | "lastBookingDate"
        | "createdAt"
      > &
        Partial<Client>
    ): Promise<Client> => {
      const newClient: Client = {
        id: data.id || `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        totalBookings: data.totalBookings || 0,
        attendedBookings: data.attendedBookings || 0,
        cancelledBookings: data.cancelledBookings || 0,
        lastBookingDate: data.lastBookingDate || "",
        healthNotes: data.healthNotes || "",
        createdAt: data.createdAt || new Date().toISOString().split("T")[0],
      };

      setClients((prev) => [newClient, ...prev]);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_clients", newClient.id), newClient);
          setIsFirebaseActive(true);
        } catch (e) {
          console.warn("Firestore add client warning:", e);
        }
      }
      return newClient;
    },
    []
  );

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_clients", id), updates, { merge: true });
      } catch (e) {
        console.warn("Firestore update client warning:", e);
      }
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, "pilates_clients", id));
      } catch (e) {
        console.warn("Firestore delete client warning:", e);
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

  const addDiscipline = useCallback(
    async (data: { name: string; slug?: string; description?: string; color?: string }): Promise<Discipline> => {
      const slug =
        data.slug ||
        data.name
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

      const newDisc: Discipline = {
        id: `disc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: data.name.trim(),
        slug,
        description: data.description || "",
        color: data.color || "indigo",
      };

      setDisciplines((prev) => [...prev, newDisc]);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_disciplines", newDisc.id), newDisc);
        } catch (e) {
          console.warn("Firestore add discipline error:", e);
        }
      }
      return newDisc;
    },
    []
  );

  const deleteDiscipline = useCallback(async (id: string) => {
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, "pilates_disciplines", id));
      } catch (e) {
        console.warn("Firestore delete discipline error:", e);
      }
    }
  }, []);

  const updateDiscipline = useCallback(async (id: string, updates: Partial<Discipline>) => {
    setDisciplines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_disciplines", id), updates, { merge: true });
      } catch (e) {
        console.warn("Firestore update discipline error:", e);
      }
    }
  }, []);

  const resetToMockData = useCallback(async () => {
    // Vaciar todo en lugar de inyectar mock inventado
    setShifts([]);
    setBookings([]);
    setInstructors([]);
    setClients([]);
    setEmailLogs([]);
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
        disciplines,
        loading,
        isFirebaseActive,
        addDiscipline,
        deleteDiscipline,
        updateDiscipline,
        addShift,
        addShiftsBatch,
        updateShift,
        deleteShift,
        createBooking,
        cancelBookingByCode,
        updateBookingStatus,
        addInstructor,
        updateInstructor,
        deleteInstructor,
        addClient,
        updateClient,
        deleteClient,
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
