"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs ${className}`}
      title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </button>
  );
}
