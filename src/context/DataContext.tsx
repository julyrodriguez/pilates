"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Shift, Booking, Instructor, Client, EmailLog, StudioSettings, ShiftStatus, Discipline, Plan, FeedbackComment } from "@/types";
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
  query,
  where,
} from "firebase/firestore";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastNotification {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface DataContextType {
  shifts: Shift[];
  bookings: Booking[];
  instructors: Instructor[];
  clients: Client[];
  plans: Plan[];
  feedbackComments: FeedbackComment[];
  feedbackLoaded: boolean;
  emailLogs: EmailLog[];
  settings: StudioSettings;
  disciplines: Discipline[];
  loading: boolean;
  isFirebaseActive: boolean;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  addFeedbackComment: (comment: Omit<FeedbackComment, "id" | "createdAt">) => Promise<FeedbackComment>;
  deleteFeedbackComment: (id: string) => Promise<void>;
  updateFeedbackCommentStatus: (id: string, status: FeedbackComment["status"]) => Promise<void>;
  replyFeedbackComment: (id: string, reply: string, replyAuthor: string) => Promise<void>;
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
    allowPast?: boolean;
  }) => Promise<{ booking: Booking; cancellationCode: string; cancellationUrl: string }>;
  cancelBookingByCode: (
    cancellationCode: string,
    reason?: string,
    force?: boolean
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
  const [rawClients, setRawClients] = useState<Client[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [settings, setSettings] = useState<StudioSettings>(initialStudioSettings);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [feedbackComments, setFeedbackComments] = useState<FeedbackComment[]>([]);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Clientes calculados en tiempo real sincronizados con la lista activa de bookings
  const clients = useMemo(() => {
    return rawClients.map((client) => {
      const clientEmailNorm = (client.email || "").trim().toLowerCase();
      const clientPhoneDigits = (client.phone || "").replace(/\D/g, "");

      const clientBookings = bookings.filter((b) => {
        const bEmailNorm = (b.clientEmail || "").trim().toLowerCase();
        const bPhoneDigits = (b.clientPhone || "").replace(/\D/g, "");

        const matchEmail = Boolean(clientEmailNorm && bEmailNorm && bEmailNorm === clientEmailNorm);
        const matchPhone = Boolean(
          clientPhoneDigits.length >= 6 &&
          bPhoneDigits.length >= 6 &&
          (bPhoneDigits.endsWith(clientPhoneDigits) || clientPhoneDigits.endsWith(bPhoneDigits) || bPhoneDigits === clientPhoneDigits)
        );

        return matchEmail || matchPhone;
      });

      const confirmedCount = clientBookings.filter((b) => b.status === "confirmed").length;
      const cancelledCount = clientBookings.filter((b) => b.status === "cancelled").length;
      const attendedCount = clientBookings.filter((b) => b.status === "attended").length;

      // Última fecha de clase activa o asistida
      const sortedDates = clientBookings
        .filter((b) => b.status !== "cancelled")
        .map((b) => `${b.shiftDate} ${b.shiftTime}`)
        .sort()
        .reverse();

      const lastBookingDate = sortedDates[0] ? sortedDates[0].split(" ")[0] : client.lastBookingDate || "";

      return {
        ...client,
        totalBookings: confirmedCount,
        cancelledBookings: cancelledCount,
        attendedBookings: attendedCount,
        lastBookingDate,
      };
    });
  }, [rawClients, bookings]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

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

        let localShifts: Shift[] = [];
        let localBookings: Booking[] = [];
        let localInstructors: Instructor[] = [];
        let localClients: Client[] = [];
        let localDisciplines: Discipline[] = [];
        let localPlans: Plan[] = [];

        if (cachedShifts) {
          try {
            localShifts = JSON.parse(cachedShifts);
            setShifts(localShifts);
          } catch {}
        }
        if (cachedBookings) {
          try {
            localBookings = JSON.parse(cachedBookings);
            setBookings(localBookings);
          } catch {}
        }
        if (cachedInstructors) {
          try {
            localInstructors = JSON.parse(cachedInstructors);
            setInstructors(localInstructors);
          } catch {}
        }
        if (cachedClients) {
          try {
            localClients = JSON.parse(cachedClients);
            setRawClients(localClients);
          } catch {}
        }
        if (cachedEmails) {
          try {
            setEmailLogs(JSON.parse(cachedEmails));
          } catch {}
        }
        if (cachedSettings) {
          try {
            setSettings(JSON.parse(cachedSettings));
          } catch {}
        }
        if (cachedDisciplines) {
          try {
            localDisciplines = JSON.parse(cachedDisciplines);
            setDisciplines(localDisciplines);
          } catch {}
        }
        if (cachedPlans) {
          try {
            localPlans = JSON.parse(cachedPlans);
            setPlans(localPlans);
          } catch {}
        }

        // 2. Suscribirse a Firestore en tiempo real con onSnapshot (Fuente única de la verdad)
        const db = getFirebaseDb();
        if (db) {
          try {
            // Turnos / Clases en tiempo real
            const unsubShifts = onSnapshot(
              collection(db, "pilates_shifts"),
              (snap) => {
                if (isMounted) {
                  const dbShifts = snap.docs
                    .map((d) => d.data() as Shift)
                    .filter((s) => s && s.id && !s.id.startsWith("_"));
                  setShifts(dbShifts);
                  setIsFirebaseActive(true);
                  setLoading(false);
                }
              },
              (err) => {
                console.warn("Realtime shifts listener error:", err);
                if (isMounted) setLoading(false);
              }
            );
            unsubscribes.push(unsubShifts);

            // Reservas en tiempo real
            const unsubBookings = onSnapshot(
              collection(db, "pilates_bookings"),
              (snap) => {
                if (isMounted) {
                  const dbBookings = snap.docs
                    .map((d) => d.data() as Booking)
                    .filter((b) => b && b.id && !b.id.startsWith("_") && b.shiftId !== "deleted" && b.clientName !== "deleted");
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
                  setRawClients(dbClients);
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

            // Planes en tiempo real (Persistidos en pilates_settings/plans)
            const unsubPlans = onSnapshot(
              doc(db, "pilates_settings", "plans"),
              (snap) => {
                if (isMounted && snap.exists()) {
                  const data = snap.data();
                  if (data?.list && Array.isArray(data.list)) {
                    setPlans(data.list as Plan[]);
                  }
                }
              },
              (err) => console.warn("Realtime plans listener error:", err)
            );
            unsubscribes.push(unsubPlans);

            // Disciplinas en tiempo real (Persistidos en pilates_settings/disciplines)
            const unsubDisciplines = onSnapshot(
              doc(db, "pilates_settings", "disciplines"),
              (snap) => {
                if (isMounted && snap.exists()) {
                  const data = snap.data();
                  if (data?.list && Array.isArray(data.list)) {
                    setDisciplines(data.list as Discipline[]);
                  }
                }
              },
              (err) => console.warn("Realtime disciplines listener error:", err)
            );
            unsubscribes.push(unsubDisciplines);

            // Comentarios y Feedback en tiempo real (Persistidos en pilates_settings/feedback_comments)
            const unsubFeedback = onSnapshot(
              doc(db, "pilates_settings", "feedback_comments"),
              (snap) => {
                if (isMounted) {
                  if (snap.exists()) {
                    const data = snap.data();
                    if (data?.list && Array.isArray(data.list)) {
                      setFeedbackComments(data.list as FeedbackComment[]);
                    }
                  }
                  setFeedbackLoaded(true);
                }
              },
              (err) => {
                console.warn("Realtime feedback listener error:", err);
                if (isMounted) setFeedbackLoaded(true);
              }
            );
            unsubscribes.push(unsubFeedback);

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

      showToast(`Clase "${newShift.title}" programada exitosamente`, "success");
      return newShift;
    },
    [showToast]
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

      showToast(`Se programaron ${newShifts.length} turnos con éxito`, "success");
      return newShifts;
    },
    [showToast]
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

    showToast("Clase actualizada correctamente", "success");
  }, [showToast]);

  const deleteShift = useCallback(async (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    setBookings((prev) => prev.filter((b) => b.shiftId !== id));

    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, "pilates_shifts", id));
        
        // Eliminación en cascada de reservas asociadas en Firestore
        const bookingsQuery = query(collection(db, "pilates_bookings"), where("shiftId", "==", id));
        const bookingsSnap = await getDocs(bookingsQuery);
        if (!bookingsSnap.empty) {
          const batch = writeBatch(db);
          bookingsSnap.docs.forEach((bDoc) => {
            batch.delete(bDoc.ref);
          });
          await batch.commit();
        }
      } catch (e) {
        console.warn("Firestore error deleting shift & cascade bookings:", e);
      }
    }

    showToast("Clase eliminada y reservas asociadas liberadas", "info");
  }, [showToast]);

  const createBooking = useCallback(
    async (input: {
      shiftId: string;
      clientName: string;
      clientEmail?: string;
      clientPhone?: string;
      notes?: string;
      allowPast?: boolean;
    }) => {
      const targetShift = shifts.find((s) => s.id === input.shiftId);
      if (!targetShift) {
        throw new Error("El turno seleccionado no existe.");
      }

      // Validar que la clase no haya comenzado ya
      if (!input.allowPast) {
        try {
          const now = new Date();
          const [year, month, day] = targetShift.date.split("-").map(Number);
          const [hours, minutes] = targetShift.startTime.split(":").map(Number);
          const shiftStartDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
          if (now.getTime() >= shiftStartDateTime.getTime()) {
            throw new Error("No es posible reservar un turno que ya ha comenzado o pertenece a un horario pasado.");
          }
        } catch (e: any) {
          if (e.message.includes("No es posible reservar")) {
            throw e;
          }
        }
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

      // Check if client is already booked in this shift
      const phoneDigits = trimmedPhone.replace(/\D/g, "");
      const isDuplicate = bookings.some((b) => {
        if (b.shiftId !== input.shiftId || b.status === "cancelled") return false;
        const matchEmail = Boolean(trimmedEmail && b.clientEmail && b.clientEmail.toLowerCase() === trimmedEmail);
        const bPhoneDigits = (b.clientPhone || "").replace(/\D/g, "");
        const matchPhone = Boolean(
          phoneDigits.length >= 6 &&
          bPhoneDigits.length >= 6 &&
          (bPhoneDigits.endsWith(phoneDigits) || phoneDigits.endsWith(bPhoneDigits) || bPhoneDigits === phoneDigits)
        );
        return matchEmail || matchPhone;
      });

      if (isDuplicate) {
        throw new Error("Ya te encuentras inscripta/o en este turno.");
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
        setRawClients((prev) =>
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
        setRawClients((prev) => [targetClient, ...prev]);
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
      reason?: string,
      force?: boolean
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

      // Validar ventana de 3 horas de anticipación (a menos que sea forzado por el admin)
      if (!force) {
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
      setRawClients((prev) =>
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

      setRawClients((prev) => [newClient, ...prev]);

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
    setRawClients((prev) =>
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
    setRawClients((prev) => prev.filter((c) => c.id !== id));
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

      const updated = [...disciplines, newDisc];
      setDisciplines(updated);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_settings", "disciplines"), { list: updated });
        } catch (e) {
          console.warn("Firestore add discipline error:", e);
        }
      }
      return newDisc;
    },
    [disciplines]
  );

  const deleteDiscipline = useCallback(async (id: string) => {
    const updated = disciplines.filter((d) => d.id !== id);
    setDisciplines(updated);
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_settings", "disciplines"), { list: updated });
      } catch (e) {
        console.warn("Firestore delete discipline error:", e);
      }
    }
  }, [disciplines]);

  const updateDiscipline = useCallback(async (id: string, updates: Partial<Discipline>) => {
    const updated = disciplines.map((d) => (d.id === id ? { ...d, ...updates } : d));
    setDisciplines(updated);
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_settings", "disciplines"), { list: updated });
      } catch (e) {
        console.warn("Firestore update discipline error:", e);
      }
    }
  }, [disciplines]);

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

      const updated = [...plans, newPlan];
      setPlans(updated);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_settings", "plans"), { list: updated });
        } catch (e) {
          console.warn("Firestore add plan error:", e);
        }
      }
      return newPlan;
    },
    [plans]
  );

  const updatePlan = useCallback(async (id: string, updates: Partial<Plan>) => {
    const updated = plans.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setPlans(updated);
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_settings", "plans"), { list: updated });
      } catch (e) {
        console.warn("Firestore update plan error:", e);
      }
    }
  }, [plans]);

  const deletePlan = useCallback(async (id: string) => {
    const updated = plans.filter((p) => p.id !== id);
    setPlans(updated);
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, "pilates_settings", "plans"), { list: updated });
      } catch (e) {
        console.warn("Firestore delete plan error:", e);
      }
    }
  }, [plans]);

  const addFeedbackComment = useCallback(
    async (data: Omit<FeedbackComment, "id" | "createdAt">): Promise<FeedbackComment> => {
      const newComment: FeedbackComment = {
        id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        authorName: data.authorName.trim(),
        authorRole: data.authorRole || "Dueña / Estudio",
        category: data.category || "general",
        content: data.content.trim(),
        status: data.status || "pending",
        createdAt: new Date().toISOString(),
      };

      const updated = [newComment, ...feedbackComments];
      setFeedbackComments(updated);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_settings", "feedback_comments"), { list: updated });
        } catch (e) {
          console.warn("Firestore add feedback error:", e);
        }
      }
      return newComment;
    },
    [feedbackComments]
  );

  const deleteFeedbackComment = useCallback(
    async (id: string) => {
      const updated = feedbackComments.filter((c) => c.id !== id);
      setFeedbackComments(updated);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_settings", "feedback_comments"), { list: updated });
        } catch (e) {
          console.warn("Firestore delete feedback error:", e);
        }
      }
    },
    [feedbackComments]
  );

  const updateFeedbackCommentStatus = useCallback(
    async (id: string, status: FeedbackComment["status"]) => {
      const updated = feedbackComments.map((c) => (c.id === id ? { ...c, status } : c));
      setFeedbackComments(updated);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_settings", "feedback_comments"), { list: updated });
        } catch (e) {
          console.warn("Firestore update feedback status error:", e);
        }
      }
    },
    [feedbackComments]
  );

  const replyFeedbackComment = useCallback(
    async (id: string, reply: string, replyAuthor: string) => {
      const updated = feedbackComments.map((c) =>
        c.id === id
          ? {
              ...c,
              reply: reply.trim(),
              replyAuthor: replyAuthor.trim(),
              replyAt: new Date().toISOString(),
            }
          : c
      );
      setFeedbackComments(updated);

      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, "pilates_settings", "feedback_comments"), { list: updated });
        } catch (e) {
          console.warn("Firestore reply feedback error:", e);
        }
      }
    },
    [feedbackComments]
  );

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
    setRawClients((prev) =>
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

    const client = rawClients.find((c) => c.id === clientId);
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
  }, [rawClients]);

  const toggleClientMonthlyPayment = useCallback(async (clientId: string, monthKey: string) => {
    setRawClients((prev) =>
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

    const client = rawClients.find((c) => c.id === clientId);
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
  }, [rawClients]);

  const resetToMockData = useCallback(async () => {
    // Vaciar todo en lugar de inyectar mock inventado
    setShifts([]);
    setBookings([]);
    setInstructors([]);
    setRawClients([]);
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
        feedbackComments,
        feedbackLoaded,
        emailLogs,
        settings,
        disciplines,
        loading,
        isFirebaseActive,
        showToast,
        addFeedbackComment,
        deleteFeedbackComment,
        updateFeedbackCommentStatus,
        replyFeedbackComment,
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

      {/* Floating Toast Notification Center */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
                t.type === "success"
                  ? "bg-emerald-950/90 text-emerald-100 border-emerald-700/50 shadow-emerald-950/20"
                  : t.type === "error"
                  ? "bg-rose-950/90 text-rose-100 border-rose-700/50 shadow-rose-950/20"
                  : "bg-slate-900/90 text-slate-100 border-slate-700/50 shadow-slate-950/20"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {t.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : t.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
                <span>{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
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
