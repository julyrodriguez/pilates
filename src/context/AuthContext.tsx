"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";

export interface DemoUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | DemoUser | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoAdmin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => {},
  loginAsDemoAdmin: () => {},
  logout: async () => {},
});

const DEMO_STORAGE_KEY = "pilates_demo_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local demo session
    try {
      const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
      if (storedDemo) {
        setUser(JSON.parse(storedDemo));
        setLoading(false);
        return;
      }
    } catch {}

    // 2. Listen to Firebase Auth
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        setUser(res.user);
        localStorage.removeItem(DEMO_STORAGE_KEY);
        return;
      } catch (err: any) {
        // If user not found in firebase auth but testing, allow demo login or propagate error
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
          throw err;
        }
        throw err;
      }
    } else {
      // Offline / standalone fallback
      const demo: DemoUser = {
        uid: "demo-admin-1",
        email,
        displayName: email.split("@")[0],
      };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demo));
      setUser(demo);
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase Auth no está inicializado.");
    }
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    setUser(res.user);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  };

  const loginWithGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase Auth no está inicializado.");
    }
    const res = await signInWithPopup(auth, googleProvider);
    setUser(res.user);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  };

  const loginAsDemoAdmin = () => {
    const demo: DemoUser = {
      uid: "demo-admin-id",
      email: "admin@lharmoniepilates.com",
      displayName: "Administrador del Estudio",
    };
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demo));
    setUser(demo);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await signOut(auth);
      } catch {}
    }
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsDemoAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
