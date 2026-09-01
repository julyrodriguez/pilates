"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Shift, Booking, Instructor, Client, EmailLog, StudioSettings, ShiftStatus, Discipline, Plan } from "@/types";
import {
  initialShifts,
  initialBookings,
  initialInstructors,
  initialClients,
  initialEmailLogs,
  initialStudioSettings,
  initialDisciplines,
  initialPlans,
} from "@/lib/mockData";
import { getFirebaseDb } from "@/lib/firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";

interface DataContextType {
  shifts: Shift[];
  bookings: Booking[];
  instructors: Instructor[];
  clients: Client[];
  plans: Plan[];
  emailLogs: EmailLog[];
  settings: StudioSettings;
  disciplines: Discipline[];
  loading: boolean;
  isFirebaseActive: boolean;
  addDiscipline: (data: { name: string; slug?: string; description?: string; color?: string }) => Promise<Discipline>;
  deleteDiscipline: (id: string) => Promise<void>;
  updateDiscipline: (id: string, updates: Partial<Discipline>) => Promise<void>;
  addPlan: (data: Omit<Plan, "id">) => Promise<Plan>;
  updatePlan: (id: string, updates: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  getClientWeeklyUsage: (clientIdOrEmail: string, targetDate?: string) => {
    used: number;
    total: number;
    remaining: number;
    planName: string;
    hasPlan: boolean;
  };
  toggleClientWeeklyPayment: (clientId: string, mondayDateStr: string) => Promise<void>;
  toggleClientMonthlyPayment: (clientId: string, monthKey: string) => Promise<void>;
  addShift: (shift: Omit<Shift, "id" | "bookedCount" | "status" | "createdAt">) => Promise<Shift>;
  addShiftsBatch: (shiftsData: Omit<Shift, "id" | "bookedCount" | "status" | "createdAt">[]) => Promise<Shift[]>;
  updateShift: (id: string, updates: Partial<Shift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  createBooking: (bookingInput: {
    shiftId: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    notes?: string;
  }) => Promise<{ booking: Booking; cancellationCode: string; cancellationUrl: string }>;
  cancelBookingByCode: (
    cancellationCode: string,
    reason?: string
  ) => Promise<{ success: boolean; message: string; booking?: Booking }>;
  rescheduleBooking: (
    cancellationCode: string,
    newShiftId: string
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
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [loading, setLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);

  // Load data from Firestore & LocalStorage cache with Realtime Synchronization
  useEffect(() => {
    let isMounted = true;
    const unsubscribes: Array<() => void> = [];

    async function initRealtimeData() {
      try {
        // Limpiar caches anteriores con datos de muestra
        ["shifts", "bookings", "instructors", "clients", "emails"].forEach((k) => {
          localStorage.removeItem("pilates_app_" + k);
        });

        // 1. Cargar caché de LocalStorage para renderizado inicial instantáneo
        const cachedShifts = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "shifts");
        const cachedBookings = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "bookings");
        const cachedInstructors = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "instructors");
        const cachedClients = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "clients");
        const cachedEmails = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "emails");
        const cachedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "settings");
        const cachedDisciplines = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "disciplines");
        const cachedPlans = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "plans");

        if (cachedShifts) setShifts(JSON.parse(cachedShifts));
        if (cachedBookings) setBookings(JSON.parse(cachedBookings));
        if (cachedInstructors) setInstructors(JSON.parse(cachedInstructors));
        if (cachedClients) setClients(JSON.parse(cachedClients));
        if (cachedEmails) setEmailLogs(JSON.parse(cachedEmails));
        if (cachedSettings) setSettings(JSON.parse(cachedSettings));
        if (cachedDisciplines) setDisciplines(JSON.parse(cachedDisciplines));
        if (cachedPlans) setPlans(JSON.parse(cachedPlans));

        // 2. Suscribirse a Firestore en tiempo real con onSnapshot
        const db = getFirebaseDb();
        if (db) {
          try {
            // Turnos / Clases en tiempo real
            const unsubShifts = onSnapshot(
              collection(db, "pilates_shifts"),
              (snap) => {
                if (isMounted) {
                  const dbShifts = snap.docs.map((d) => d.data() as Shift);
                  setShifts(dbShifts);
                  setIsFirebaseActive(true);
                  setLoading(false);
                }
              },
              (err) => console.warn("Realtime shifts listener error:", err)
            );
            unsubscribes.push(unsubShifts);

            // Reservas en tiempo real (inscribe alumnos en vivo en el calendario)
            const unsubBookings = onSnapshot(
              collection(db, "pilates_bookings"),
              (snap) => {
                if (isMounted) {
                  const dbBookings = snap.docs.map((d) => d.data() as Booking);
                  setBookings(dbBookings);
                }
              },
              (err) => console.warn("Realtime bookings listener error:", err)
            );
            unsubscribes.push(unsubBookings);

            // Alumnos / Clientes en tiempo real
            const unsubClients = onSnapshot(
              collection(db, "pilates_clients"),
              (snap) => {
                if (isMounted) {
                  const dbClients = snap.docs.map((d) => d.data() as Client);
                  setClients(dbClients);
                }
              },
              (err) => console.warn("Realtime clients listener error:", err)
            );
            unsubscribes.push(unsubClients);

            // Instructores en tiempo real
            const unsubInstructors = onSnapshot(
              collection(db, "pilates_instructors"),
              (snap) => {
                if (isMounted) {
                  const dbInstructors = snap.docs.map((d) => d.data() as Instructor);
                  setInstructors(dbInstructors);
                }
              },
              (err) => console.warn("Realtime instructors listener error:", err)
            );
            unsubscribes.push(unsubInstructors);

            // Emails / Notificaciones en tiempo real
            const unsubEmails = onSnapshot(
              collection(db, "pilates_emails"),
              (snap) => {
                if (isMounted) {
                  const dbEmails = snap.docs.map((d) => d.data() as EmailLog);
                  setEmailLogs(dbEmails);
                }
              },
              (err) => console.warn("Realtime emails listener error:", err)
            );
            unsubscribes.push(unsubEmails);

            // Planes en tiempo real
            const unsubPlans = onSnapshot(
              collection(db, "pilates_plans"),
              async (snap) => {
                if (isMounted) {
                  if (!snap.empty) {
                    setPlans(snap.docs.map((d) => d.data() as Plan));
                  } else {
                    const batch = writeBatch(db);
                    initialPlans.forEach((plan) => {
                      batch.set(doc(db, "pilates_plans", plan.id), plan);
                    });
                    await batch.commit();
                    if (isMounted) setPlans(initialPlans);
                  }
                }
              },
              (err) => console.warn("Realtime plans listener error:", err)
            );
            unsubscribes.push(unsubPlans);

            // Disciplinas en tiempo real
            const unsubDisciplines = onSnapshot(
              collection(db, "pilates_disciplines"),
              async (snap) => {
                if (isMounted) {
                  if (!snap.empty) {
                    setDisciplines(snap.docs.map((d) => d.data() as Discipline));
                  } else {
                    const batch = writeBatch(db);
                    initialDisciplines.forEach((disc) => {
                      batch.set(doc(db, "pilates_disciplines", disc.id), disc);
                    });
                    await batch.commit();
                    if (isMounted) setDisciplines(initialDisciplines);
                  }
                }
              },
              (err) => console.warn("Realtime disciplines listener error:", err)
            );
            unsubscribes.push(unsubDisciplines);

            // Settings en tiempo real
            const unsubSettings = onSnapshot(
              collection(db, "pilates_settings"),
              async (snap) => {
                if (isMounted && !snap.empty) {
                  const generalDoc = snap.docs.find((d) => d.id === "general");
                  if (generalDoc) {
                    const loaded = generalDoc.data() as Partial<StudioSettings>;
                    const officialAddress = "Cesar Diaz 3031, CABA";
                    const officialStudioName = "Selene Pilates";
                    const officialInstagram = "@selene.pilates";

                    setSettings({
                      ...initialStudioSettings,
                      ...loaded,
                      address: officialAddress,
                      studioName: officialStudioName,
                      instagram: officialInstagram,
                    });

                    if (loaded.address !== officialAddress || loaded.studioName !== officialStudioName) {
                      try {
                        await setDoc(
                          doc(db, "pilates_settings", "general"),
                          {
                            ...loaded,
                            address: officialAddress,
                            studioName: officialStudioName,
                            instagram: officialInstagram,
                          },
                          { merge: true }
                        );
                      } catch (syncErr) {
                        console.warn("Could not sync updated address to firestore:", syncErr);
                      }
                    }
                  }
                }
              },
              (err) => console.warn("Realtime settings listener error:", err)
            );
            unsubscribes.push(unsubSettings);
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

    initRealtimeData();

    return () => {
      isMounted = false;
      unsubscribes.forEach((unsub) => unsub());
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
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "plans", JSON.stringify(plans));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }, [shifts, bookings, instructors, clients, emailLogs, settings, disciplines, plans, loading]);

  const addShift = useCallback(
    async (
      shiftData: Omit<Shift, "id" | "bookedCount" | "status" | "createdAt">
    ): Promise<Shift> => {
      const dayOfWeek = new Date(shiftData.date + "T12:00:00").getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new Error("No está permitido crear clases los fines de semana (Sábados y Domingos).");
      }

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
      const validShiftsData = shiftsData.filter((s) => {
        const day = new Date(s.date + "T12:00:00").getDay();
        return day !== 0 && day !== 6;
      });

      const newShifts: Shift[] = validShiftsData.map((shiftData, idx) => ({
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
    if (updates.date) {
      const day = new Date(updates.date + "T12:00:00").getDay();
      if (day === 0 || day === 6) {
        throw new Error("No está permitido programar clases los fines de semana (Sábados y Domingos).");
      }
    }

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
      clientEmail?: string;
      clientPhone?: string;
      notes?: string;
    }) => {
      const targetShift = shifts.find((s) => s.id === input.shiftId);
      if (!targetShift) {
        throw new Error("El turno seleccionado no existe.");
      }

      if (targetShift.bookedCount >= targetShift.capacity) {
        throw new Error("Lo sentimos, este turno ya está completo.");
      }

      const trimmedName = input.clientName.trim();
      const trimmedEmail = (input.clientEmail || "").trim().toLowerCase();
      const trimmedPhone = (input.clientPhone || "").trim();

      if (!trimmedName) {
        throw new Error("Por favor ingresa tu nombre y apellido.");
      }

      if (!trimmedEmail && !trimmedPhone) {
        throw new Error("Debes proporcionar al menos un medio de contacto: Correo electrónico o Teléfono / WhatsApp.");
      }

      // Generate unique alphanumeric cancellation token
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const clientInitials = trimmedName.replace(/\s+/g, "").substring(0, 4).toUpperCase();
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
        clientName: trimmedName,
        clientEmail: trimmedEmail,
        clientPhone: trimmedPhone,
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
        (c) =>
          (trimmedEmail && c.email && c.email.toLowerCase() === trimmedEmail) ||
          (trimmedPhone && c.phone && c.phone === trimmedPhone)
      );

      if (existingClient) {
        targetClient = {
          ...existingClient,
          name: trimmedName || existingClient.name,
          email: trimmedEmail || existingClient.email,
          phone: trimmedPhone || existingClient.phone,
          totalBookings: (existingClient.totalBookings || 0) + 1,
          lastBookingDate: targetShift.date,
        };
        setClients((prev) =>
          prev.map((c) => (c.id === existingClient.id ? targetClient : c))
        );
      } else {
        targetClient = {
          id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          totalBookings: 1,
          attendedBookings: 0,
          cancelledBookings: 0,
          lastBookingDate: targetShift.date,
          healthNotes: input.notes || "",
          createdAt: new Date().toISOString().split("T")[0],
        };
        setClients((prev) => [targetClient, ...prev]);
      }

      // 4. Log Confirmation Email Notification (solo si hay email)
      let newEmailLog: EmailLog | null = null;
      if (trimmedEmail) {
        newEmailLog = {
          id: `email-${Date.now()}`,
          bookingId: newBooking.id,
          recipientEmail: trimmedEmail,
          recipientName: trimmedName,
          subject: `✨ ¡Confirmación de reserva en ${settings.studioName}! - ${targetShift.title}`,
          shiftTitle: targetShift.title,
          shiftDate: targetShift.date,
          shiftTime: targetShift.startTime,
          cancellationCode,
          cancellationUrl,
          sentAt: new Date().toISOString(),
          status: "sent",
        };

        setEmailLogs((prev) => [newEmailLog!, ...prev]);

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
          if (newEmailLog) {
            await setDoc(doc(db, "pilates_emails", newEmailLog.id), newEmailLog);
          }
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

      // Validar ventana de 3 horas de anticipación
      const shiftDateTime = new Date(`${targetBooking.shiftDate}T${targetBooking.shiftTime}:00`);
      const now = new Date();
      const diffMs = shiftDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 3) {
        return {
          success: false,
          message: "Las cancelaciones solo pueden realizarse con un mínimo de 3 horas de anticipación. Para esta clase faltan menos de 3 horas (o ya ha comenzado). Si tienes un imprevisto de fuerza mayor, por favor comunícate directamente con el estudio.",
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

      // Update Client stats: no sumar reservas canceladas
      setClients((prev) =>
        prev.map((c) =>
          c.email.toLowerCase() === targetBooking.clientEmail.toLowerCase()
            ? {
                ...c,
                totalBookings: Math.max(0, (c.totalBookings || 1) - 1),
                cancelledBookings: (c.cancelledBookings || 0) + 1,
              }
            : c
        )
      );

      // Update Email Logs to reflect cancellation
      setEmailLogs((prev) =>
        prev.map((e) =>
          e.cancellationCode.toUpperCase() === cleanCode
            ? { ...e, status: "cancelled", type: "cancellation" }
            : e
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
              {
                totalBookings: Math.max(0, (clientObj.totalBookings || 1) - 1),
                cancelledBookings: (clientObj.cancelledBookings || 0) + 1,
              },
              { merge: true }
            );
          }
          // Update email log in Firestore
          const targetEmail = emailLogs.find(
            (e) => e.cancellationCode.toUpperCase() === cleanCode
          );
          if (targetEmail) {
            await setDoc(
              doc(db, "pilates_emails", targetEmail.id),
              { status: "cancelled", type: "cancellation" },
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
    [bookings, shifts, clients, settings.studioName, emailLogs]
  );

  const rescheduleBooking = useCallback(
    async (
      cancellationCode: string,
      newShiftId: string
    ): Promise<{ success: boolean; message: string; booking?: Booking }> => {
      const cleanCode = cancellationCode.trim().toUpperCase();
      const targetBooking = bookings.find(
        (b) => b.cancellationCode.toUpperCase() === cleanCode
      );

      if (!targetBooking) {
        return {
          success: false,
          message: "Código de reserva no encontrado.",
        };
      }

      if (targetBooking.status === "cancelled") {
        return {
          success: false,
          message: "No se puede modificar una reserva cancelada.",
        };
      }

      // Validar ventana de 3 horas de anticipación en el turno actual
      const currentShiftDateTime = new Date(`${targetBooking.shiftDate}T${targetBooking.shiftTime}:00`);
      const now = new Date();
      const diffMs = currentShiftDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 3) {
        return {
          success: false,
          message: "Las modificaciones de turno solo pueden realizarse con un mínimo de 3 horas de anticipación.",
          booking: targetBooking,
        };
      }

      const newShift = shifts.find((s) => s.id === newShiftId);
      if (!newShift) {
        return {
          success: false,
          message: "El nuevo turno seleccionado no existe.",
        };
      }

      if (newShift.bookedCount >= newShift.capacity) {
        return {
          success: false,
          message: "El turno de destino seleccionado ya no tiene cupos disponibles.",
        };
      }

      // Validar que el nuevo turno sea futuro
      const newShiftDateTime = new Date(`${newShift.date}T${newShift.startTime}:00`);
      if (newShiftDateTime.getTime() <= now.getTime()) {
        return {
          success: false,
          message: "No se puede seleccionar un turno que ya ha comenzado o pasado.",
        };
      }

      const oldShiftId = targetBooking.shiftId;

      // Update Booking
      const updatedBooking: Booking = {
        ...targetBooking,
        shiftId: newShift.id,
        shiftDate: newShift.date,
        shiftTime: newShift.startTime,
        shiftTitle: newShift.title,
        instructorName: newShift.instructorName,
        room: newShift.room,
        notes: targetBooking.notes ? `${targetBooking.notes} (Reprogramado)` : "Reprogramado",
      };

      setBookings((prev) =>
        prev.map((b) => (b.id === targetBooking.id ? updatedBooking : b))
      );

      // Decrement bookedCount in old shift & increment in new shift
      setShifts((prev) =>
        prev.map((s) => {
          if (s.id === oldShiftId) {
            const newCount = Math.max(0, s.bookedCount - 1);
            return {
              ...s,
              bookedCount: newCount,
              status: calculateShiftStatus(s.capacity, newCount),
            };
          }
          if (s.id === newShift.id) {
            const newCount = s.bookedCount + 1;
            return {
              ...s,
              bookedCount: newCount,
              status: calculateShiftStatus(s.capacity, newCount),
            };
          }
          return s;
        })
      );

      // Update Email Logs to reflect new shifted shift
      setEmailLogs((prev) =>
        prev.map((e) =>
          e.cancellationCode.toUpperCase() === cleanCode
            ? {
                ...e,
                shiftTitle: newShift.title,
                shiftDate: newShift.date,
                shiftTime: newShift.startTime,
                status: "rescheduled",
                type: "rescheduled",
                subject: `✨ ¡Turno Modificado! - ${newShift.title} (${newShift.date} ${newShift.startTime}hs)`,
              }
            : e
        )
      );

      // Send real email with updated shift info
      try {
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "rescheduled",
            recipientEmail: targetBooking.clientEmail,
            recipientName: targetBooking.clientName,
            shiftTitle: newShift.title,
            shiftDate: newShift.date,
            shiftTime: newShift.startTime,
            instructorName: newShift.instructorName,
            room: newShift.room,
            cancellationCode: targetBooking.cancellationCode,
            cancellationUrl: `/cancelar/${targetBooking.cancellationCode}`,
            studioName: settings.studioName,
          }),
        }).catch((err) => {
          console.warn("Error enviando email real de reprogramación:", err);
        });
      } catch (e) {
        console.warn("Mail dispatch error on reschedule:", e);
      }

      // Sync with Firestore
      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_bookings", targetBooking.id), updatedBooking, {
            merge: true,
          });

          const oldShift = shifts.find((s) => s.id === oldShiftId);
          if (oldShift) {
            const decrementedCount = Math.max(0, oldShift.bookedCount - 1);
            await setDoc(
              doc(db, "pilates_shifts", oldShiftId),
              {
                bookedCount: decrementedCount,
                status: calculateShiftStatus(oldShift.capacity, decrementedCount),
              },
              { merge: true }
            );
          }

          const incrementedCount = newShift.bookedCount + 1;
          await setDoc(
            doc(db, "pilates_shifts", newShift.id),
            {
              bookedCount: incrementedCount,
              status: calculateShiftStatus(newShift.capacity, incrementedCount),
            },
            { merge: true }
          );

          // Update email log in Firestore
          const targetEmail = emailLogs.find(
            (e) => e.cancellationCode.toUpperCase() === cleanCode
          );
          if (targetEmail) {
            await setDoc(
              doc(db, "pilates_emails", targetEmail.id),
              {
                shiftTitle: newShift.title,
                shiftDate: newShift.date,
                shiftTime: newShift.startTime,
                status: "rescheduled",
                type: "rescheduled",
              },
              { merge: true }
            );
          }
        } catch (e) {
          console.warn("Firestore error during reschedule:", e);
        }
      }

      return {
        success: true,
        message: `¡Turno reprogramado exitosamente! Tu nueva clase es el ${newShift.date} a las ${newShift.startTime} hs con Prof. ${newShift.instructorName}.`,
        booking: updatedBooking,
      };
    },
    [bookings, shifts, emailLogs, settings.studioName]
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

  const addPlan = useCallback(
    async (data: Omit<Plan, "id">): Promise<Plan> => {
      const newPlan: Plan = {
        id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: data.name.trim(),
        classesPerWeek: Number(data.classesPerWeek) || 1,
        price: Number(data.price) || 0,
        description: data.description || "",
        active: data.active !== undefined ? data.active : true,
        createdAt: new Date().toISOString(),
      };

      setPlans((prev) => [...prev, newPlan]);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_plans", newPlan.id), newPlan);
        } catch (e) {
          console.warn("Firestore add plan error:", e);
        }
      }
      return newPlan;
    },
    []
  );

  const updatePlan = useCallback(async (id: string, updates: Partial<Plan>) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_plans", id), updates, { merge: true });
      } catch (e) {
        console.warn("Firestore update plan error:", e);
      }
    }
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, "pilates_plans", id));
      } catch (e) {
        console.warn("Firestore delete plan error:", e);
      }
    }
  }, []);

  const getClientWeeklyUsage = useCallback(
    (clientIdOrEmail: string, targetDate?: string) => {
      const normalizedQuery = (clientIdOrEmail || "").trim().toLowerCase();
      if (!normalizedQuery) {
        return { used: 0, total: 0, remaining: 0, planName: "", hasPlan: false };
      }

      const client = clients.find(
        (c) =>
          c.id === clientIdOrEmail ||
          (c.email && c.email.toLowerCase() === normalizedQuery) ||
          (c.phone && c.phone === clientIdOrEmail.trim())
      );

      if (!client || !client.planId) {
        return { used: 0, total: 0, remaining: 0, planName: "", hasPlan: false };
      }

      const plan = plans.find((p) => p.id === client.planId);
      const totalAllowed = plan ? plan.classesPerWeek : (client.planClassesPerWeek || 0);

      // Determinar la semana de targetDate (Lunes a Domingo)
      const baseDate = targetDate ? new Date(targetDate + "T12:00:00") : new Date();
      const monday = new Date(baseDate);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const mondayStr = monday.toISOString().split("T")[0];
      const sundayStr = sunday.toISOString().split("T")[0];

      // Contar reservas activas del cliente en esa semana específica
      const weeklyBookings = bookings.filter((b) => {
        if (b.status === "cancelled") return false;
        const matchesClient =
          (client.email && b.clientEmail && b.clientEmail.toLowerCase() === client.email.toLowerCase()) ||
          (client.phone && b.clientPhone && b.clientPhone === client.phone) ||
          (b.clientName && b.clientName.toLowerCase() === client.name.toLowerCase());

        if (!matchesClient) return false;
        return b.shiftDate >= mondayStr && b.shiftDate <= sundayStr;
      });

      const used = weeklyBookings.length;
      const remaining = Math.max(0, totalAllowed - used);

      return {
        used,
        total: totalAllowed,
        remaining,
        planName: plan ? plan.name : (client.planName || "Plan Semanal"),
        hasPlan: true,
      };
    },
    [clients, plans, bookings]
  );

  const toggleClientWeeklyPayment = useCallback(async (clientId: string, mondayDateStr: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const currentWeekly = c.weeklyPayments || {};
        const isPaid = !!currentWeekly[mondayDateStr];
        const nextWeekly = { ...currentWeekly, [mondayDateStr]: !isPaid };
        return {
          ...c,
          weeklyPayments: nextWeekly,
          paymentStatus: !isPaid ? "paid" : "pending",
          lastPaymentDate: !isPaid ? new Date().toISOString().split("T")[0] : c.lastPaymentDate,
        };
      })
    );

    const client = clients.find((c) => c.id === clientId);
    if (client) {
      const currentWeekly = client.weeklyPayments || {};
      const isPaid = !currentWeekly[mondayDateStr];
      const nextWeekly = { ...currentWeekly, [mondayDateStr]: isPaid };
      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(
            doc(db, "pilates_clients", clientId),
            {
              weeklyPayments: nextWeekly,
              paymentStatus: isPaid ? "paid" : "pending",
              lastPaymentDate: isPaid ? new Date().toISOString().split("T")[0] : client.lastPaymentDate,
            },
            { merge: true }
          );
        } catch (e) {
          console.warn("Firestore toggle weekly payment error:", e);
        }
      }
    }
  }, [clients]);

  const toggleClientMonthlyPayment = useCallback(async (clientId: string, monthKey: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const currentMonthly = c.monthlyPayments || {};
        const isPaid = !!currentMonthly[monthKey];
        const nextMonthly = { ...currentMonthly, [monthKey]: !isPaid };
        return {
          ...c,
          monthlyPayments: nextMonthly,
          paymentStatus: !isPaid ? "paid" : "pending",
          lastPaymentDate: !isPaid ? new Date().toISOString().split("T")[0] : c.lastPaymentDate,
        };
      })
    );

    const client = clients.find((c) => c.id === clientId);
    if (client) {
      const currentMonthly = client.monthlyPayments || {};
      const isPaid = !currentMonthly[monthKey];
      const nextMonthly = { ...currentMonthly, [monthKey]: isPaid };
      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(
            doc(db, "pilates_clients", clientId),
            {
              monthlyPayments: nextMonthly,
              paymentStatus: isPaid ? "paid" : "pending",
              lastPaymentDate: isPaid ? new Date().toISOString().split("T")[0] : client.lastPaymentDate,
            },
            { merge: true }
          );
        } catch (e) {
          console.warn("Firestore toggle monthly payment error:", e);
        }
      }
    }
  }, [clients]);

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
        plans,
        emailLogs,
        settings,
        disciplines,
        loading,
        isFirebaseActive,
        addDiscipline,
        deleteDiscipline,
        updateDiscipline,
        addPlan,
        updatePlan,
        deletePlan,
        getClientWeeklyUsage,
        toggleClientWeeklyPayment,
        toggleClientMonthlyPayment,
        addShift,
        addShiftsBatch,
        updateShift,
        deleteShift,
        createBooking,
        cancelBookingByCode,
        rescheduleBooking,
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
