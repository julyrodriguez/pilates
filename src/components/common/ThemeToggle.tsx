"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-colors duration-200 text-slate-600 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-900/30 border border-rose-200/40 dark:border-rose-800/40 ${className}`}
      title={theme === "dark" ? "Cambiar a Modo Claro (Rosa y Crema)" : "Cambiar a Modo Oscuro (Noir Velvet)"}
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-300 animate-in fade-in duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-rose-600 animate-in fade-in duration-300" />
      )}
    </button>
  );
}
