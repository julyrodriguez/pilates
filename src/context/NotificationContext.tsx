"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { NotificationItem, NotificationType, Booking } from "@/types";
import { getFirebaseDb } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { playNotificationSound } from "@/lib/sound";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  activeToast: NotificationItem | null;
  isToastExiting: boolean;
  soundEnabled: boolean;
  toggleSound: () => void;
  addNotification: (
    item: Omit<NotificationItem, "id" | "createdAt" | "read">
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissToast: () => void;
  sendTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "pilates_studio_notifications_v1";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [isToastExiting, setIsToastExiting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Set of recently triggered notification IDs to prevent duplicates
  const processedIdsRef = useRef<Set<string>>(new Set());
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Persist notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifications.slice(0, 30)));
    } catch {}
  }, [notifications]);

  // Load sound setting from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pilates_sound_notifications");
      if (saved !== null) {
        setSoundEnabled(saved === "true");
      }
    } catch {}
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("pilates_sound_notifications", String(next));
      } catch {}
      return next;
    });
  };

  // Helper to trigger the animated floating banner
  const triggerToast = useCallback((item: NotificationItem) => {
    // If this notification was already shown recently, avoid double toast
    if (processedIdsRef.current.has(item.id)) return;
    processedIdsRef.current.add(item.id);

    // Keep set bounded
    if (processedIdsRef.current.size > 100) {
      const arr = Array.from(processedIdsRef.current);
      processedIdsRef.current = new Set(arr.slice(arr.length - 50));
    }

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);

    setIsToastExiting(false);
    setActiveToast(item);

    if (soundEnabledRef.current) {
      playNotificationSound();
    }

    // After 5.2 seconds, begin sliding up animation
    toastTimeoutRef.current = setTimeout(() => {
      setIsToastExiting(true);
      exitTimeoutRef.current = setTimeout(() => {
        setActiveToast(null);
        setIsToastExiting(false);
      }, 450);
    }, 5200);
  }, []);

  const dismissToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setIsToastExiting(true);
    exitTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
      setIsToastExiting(false);
    }, 450);
  };

  // 1. Listen for cross-tab & in-window events (instant local/same-browser delivery)
  useEffect(() => {
    const handleCustomEvent = (event: Event) => {
      const customEvt = event as CustomEvent<Omit<NotificationItem, "id" | "createdAt" | "read"> & { id?: string; createdAt?: string }>;
      if (!customEvt.detail) return;

      const detail = customEvt.detail;
      const notifId = detail.id || `notif-local-${Date.now()}`;
      const newNotif: NotificationItem = {
        ...detail,
        id: notifId,
        createdAt: detail.createdAt || new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== notifId).slice(0, 29)]);
      triggerToast(newNotif);
    };

    window.addEventListener("pilates_booking_event", handleCustomEvent);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("pilates_notifications_channel");
      channel.onmessage = (e) => {
        if (e.data) {
          const detail = e.data;
          const notifId = detail.id || `notif-bc-${Date.now()}`;
          const newNotif: NotificationItem = {
            ...detail,
            id: notifId,
            createdAt: detail.createdAt || new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== notifId).slice(0, 29)]);
          triggerToast(newNotif);
        }
      };
    } catch {}

    return () => {
      window.removeEventListener("pilates_booking_event", handleCustomEvent);
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
    };
  }, [triggerToast]);

  // 2. Realtime listener directly on pilates_bookings (authorized by default in Firestore)
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) return;

    let isInitial = true;

    try {
      const bookingsQ = query(
        collection(db, "pilates_bookings"),
        orderBy("createdAt", "desc"),
        limit(15)
      );

      const unsub = onSnapshot(
        bookingsQ,
        (snap) => {
          if (isInitial) {
            // Seed notifications from recent bookings if notifications state is empty
            const seeded: NotificationItem[] = snap.docs.map((docSnap) => {
              const b = docSnap.data() as Booking;
              const isCancelled = b.status === "cancelled";
              return {
                id: `booking-${b.id}`,
                type: isCancelled ? "booking_cancelled" : "booking_created",
                title: isCancelled ? "Reserva Cancelada" : "Nueva Reserva",
                message: isCancelled
                  ? `${b.clientName} canceló su turno en ${b.shiftTitle}`
                  : `${b.clientName} reservó en ${b.shiftTitle}`,
                clientName: b.clientName,
                shiftTitle: b.shiftTitle,
                shiftDate: b.shiftDate,
                shiftTime: b.shiftTime,
                bookingId: b.id,
                shiftId: b.shiftId,
                read: true,
                createdAt: b.createdAt || new Date().toISOString(),
              };
            });

            setNotifications((prev) => {
              if (prev.length > 0) return prev;
              return seeded;
            });

            // Mark all current initial bookings as processed so they don't fire toasts on load
            snap.docs.forEach((d) => {
              processedIdsRef.current.add(`booking-${d.id}`);
              processedIdsRef.current.add(`booking-cancel-${d.id}`);
            });

            isInitial = false;
            return;
          }

          // Listen for new booking additions or status changes
          snap.docChanges().forEach((change) => {
            const b = change.doc.data() as Booking;
            if (!b || !b.id || b.id.startsWith("_")) return;

            if (change.type === "added") {
              const notifId = `booking-${b.id}`;
              if (!processedIdsRef.current.has(notifId)) {
                const newNotif: NotificationItem = {
                  id: notifId,
                  type: "booking_created",
                  title: "Nueva Reserva",
                  message: `${b.clientName} reservó en ${b.shiftTitle}`,
                  clientName: b.clientName,
                  shiftTitle: b.shiftTitle,
                  shiftDate: b.shiftDate,
                  shiftTime: b.shiftTime,
                  bookingId: b.id,
                  shiftId: b.shiftId,
                  read: false,
                  createdAt: b.createdAt || new Date().toISOString(),
                };

                setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== notifId).slice(0, 29)]);
                triggerToast(newNotif);
              }
            } else if (change.type === "modified" && b.status === "cancelled") {
              const cancelId = `booking-cancel-${b.id}-${Date.now()}`;
              if (!processedIdsRef.current.has(cancelId)) {
                const cancelNotif: NotificationItem = {
                  id: cancelId,
                  type: "booking_cancelled",
                  title: "Reserva Cancelada",
                  message: `${b.clientName} canceló su turno en ${b.shiftTitle}`,
                  clientName: b.clientName,
                  shiftTitle: b.shiftTitle,
                  shiftDate: b.shiftDate,
                  shiftTime: b.shiftTime,
                  bookingId: b.id,
                  shiftId: b.shiftId,
                  read: false,
                  createdAt: new Date().toISOString(),
                };

                setNotifications((prev) => [cancelNotif, ...prev.filter((n) => n.id !== cancelId).slice(0, 29)]);
                triggerToast(cancelNotif);
              }
            }
          });
        },
        (err) => {
          console.warn("Realtime bookings listener warning:", err);
        }
      );

      return () => unsub();
    } catch (e) {
      console.warn("Error setting up bookings realtime listener:", e);
    }
  }, [triggerToast]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = async (
    item: Omit<NotificationItem, "id" | "createdAt" | "read">
  ) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
    triggerToast(newNotif);

    const db = getFirebaseDb();
    if (!db) return;

    try {
      await setDoc(doc(db, "pilates_notifications", newNotif.id), newNotif);
    } catch {}
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    const db = getFirebaseDb();
    if (!db) return;

    try {
      await updateDoc(doc(db, "pilates_notifications", id), { read: true });
    } catch {}
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const db = getFirebaseDb();
    if (!db) return;

    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((n) => {
          batch.update(doc(db, "pilates_notifications", n.id), { read: true });
        });
      await batch.commit();
    } catch {}
  };

  const sendTestNotification = () => {
    const testNotif: NotificationItem = {
      id: `test-${Date.now()}`,
      type: "booking_created",
      title: "Nueva Reserva (Prueba)",
      message: "María López reservó en Pilates Reformer",
      clientName: "María López",
      shiftTitle: "Pilates Reformer",
      shiftDate: new Date().toISOString().split("T")[0],
      shiftTime: "18:00",
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [testNotif, ...prev.slice(0, 29)]);
    triggerToast(testNotif);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        isToastExiting,
        soundEnabled,
        toggleSound,
        addNotification,
        markAsRead,
        markAllAsRead,
        dismissToast,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
