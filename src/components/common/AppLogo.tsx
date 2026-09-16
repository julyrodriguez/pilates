"use client";

import React from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  href?: string;
  className?: string;
}

export function AppLogo({
  size = "md",
  showSubtitle = true,
  href = "/",
  className = "",
}: AppLogoProps) {
  const { settings } = useData();

  const iconSizes = {
    sm: "w-8 h-8 rounded-xl text-xs",
    md: "w-9 h-9 rounded-xl text-sm",
    lg: "w-11 h-11 rounded-2xl text-base",
  };

  const textSizes = {
    sm: "text-xs font-black",
    md: "text-sm font-black tracking-tight",
    lg: "text-base font-black tracking-tight",
  };

  const subTextSizes = {
    sm: "text-[9px] font-bold tracking-wider",
    md: "text-[10px] font-bold tracking-wider",
    lg: "text-[11px] font-bold tracking-wider",
  };

  const content = (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      {/* Luxury Geometric Moon & Movement Icon */}
      <div
        className={`${iconSizes[size]} shrink-0 relative bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-900 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-500 flex items-center justify-center text-white shadow-md border border-white/20 overflow-hidden group`}
      >
        {/* Subtle interior glow */}
        <div className="absolute inset-0 bg-radial from-white/20 to-transparent pointer-events-none" />

        <svg
          className="w-5 h-5 text-pink-300 dark:text-white drop-shadow-xs transition-transform duration-300 group-hover:scale-110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Crescent Moon & Pilates Arc */}
          <path
            d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          {/* Central Star Sparkle */}
          <path
            d="M17 7l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="min-w-0 flex flex-col justify-center">
        <span
          className={`${textSizes[size]} text-slate-900 dark:text-slate-100 truncate block leading-tight`}
        >
          {settings.studioName || "SELENE"}
        </span>
        {showSubtitle && (
          <span
            className={`${subTextSizes[size]} text-indigo-600 dark:text-indigo-400 uppercase block truncate opacity-90 leading-none mt-0.5`}
          >
            PILATES STUDIO
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
