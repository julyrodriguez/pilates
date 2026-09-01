"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: "light";
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<"light">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("pilates_theme", "light");
      document.documentElement.classList.remove("dark");
    } catch {
      // fallback
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    // No-op: siempre queda en modo claro
  };

  const setTheme = () => {
    // No-op: siempre queda en modo claro
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
