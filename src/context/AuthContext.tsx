"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase Auth no está inicializado. Verifica las variables de entorno de Firebase.");
    }
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    setUser(res.user);
  };

  const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase Auth no está inicializado. Verifica las variables de entorno de Firebase.");
    }
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && res.user) {
      try {
        await updateProfile(res.user, { displayName });
      } catch {}
    }
    setUser(res.user);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
