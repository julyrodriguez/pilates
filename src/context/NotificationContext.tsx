"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { NotificationItem, NotificationType } from "@/types";
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [isToastExiting, setIsToastExiting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Track initial mount time to only show animated toast for new events
  const mountTimeRef = useRef<number>(Date.now());
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const triggerToast = (item: NotificationItem) => {
    // Clear any active timers
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);

    setIsToastExiting(false);
    setActiveToast(item);

    if (soundEnabled) {
      playNotificationSound();
    }

    // After 5 seconds, begin sliding up animation
    toastTimeoutRef.current = setTimeout(() => {
      setIsToastExiting(true);
      // Wait for exit transition (450ms) to complete before removing from DOM
      exitTimeoutRef.current = setTimeout(() => {
        setActiveToast(null);
        setIsToastExiting(false);
      }, 450);
    }, 5200);
  };

  const dismissToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setIsToastExiting(true);
    exitTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
      setIsToastExiting(false);
    }, 450);
  };

  // Listen to Firestore pilates_notifications in real-time
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) return;

    let isInitialSnapshot = true;

    const q = query(
      collection(db, "pilates_notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
          } as NotificationItem;
        });

        // Detect new additions created after mount
        if (!isInitialSnapshot) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const newItem = {
                id: change.doc.id,
                ...change.doc.data(),
              } as NotificationItem;

              const createdTime = new Date(newItem.createdAt).getTime();
              // Trigger toast only if created recently (after component mounted or last 10 seconds)
              if (createdTime >= mountTimeRef.current - 10000) {
                triggerToast(newItem);
              }
            }
          });
        }

        setNotifications(items);
        isInitialSnapshot = false;
      },
      (err) => {
        console.warn("Error listening to notifications:", err);
      }
    );

    return () => {
      unsubscribe();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, [soundEnabled]);

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

    // Update local state immediately for instant feedback
    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
    triggerToast(newNotif);

    const db = getFirebaseDb();
    if (!db) return;

    try {
      await setDoc(doc(db, "pilates_notifications", newNotif.id), newNotif);
    } catch (err) {
      console.warn("Could not save notification to Firestore:", err);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    const db = getFirebaseDb();
    if (!db) return;

    try {
      await updateDoc(doc(db, "pilates_notifications", id), { read: true });
    } catch (err) {
      console.warn("Error marking notification read:", err);
    }
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
    } catch (err) {
      console.warn("Error marking all notifications read:", err);
    }
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
