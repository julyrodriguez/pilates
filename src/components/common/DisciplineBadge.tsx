import React from "react";
import { DisciplineType } from "@/types";
import { Sparkles, Activity, HeartHandshake, Zap, Layers, Flame } from "lucide-react";

interface DisciplineBadgeProps {
  discipline: DisciplineType;
  size?: "sm" | "md" | "lg";
}

const config: Record<
  DisciplineType,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  reformer: {
    label: "Reformer",
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-400/30",
    icon: Sparkles,
  },
  mat: {
    label: "Mat Pilates",
    bg: "bg-orange-500/15 dark:bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-400/30",
    icon: Layers,
  },
  cadillac: {
    label: "Cadillac",
    bg: "bg-purple-500/15 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-400/30",
    icon: Activity,
  },
  tower: {
    label: "Tower / Combo",
    bg: "bg-pink-500/15 dark:bg-pink-500/20",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-400/30",
    icon: Zap,
  },
  prenatal: {
    label: "Prenatal",
    bg: "bg-teal-500/15 dark:bg-teal-500/20",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-400/30",
    icon: HeartHandshake,
  },
  power: {
    label: "Power Pilates",
    bg: "bg-red-500/15 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-400/30",
    icon: Flame,
  },
};

export function DisciplineBadge({ discipline, size = "md" }: DisciplineBadgeProps) {
  const item = config[discipline] || config.reformer;
  const Icon = item.icon;

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg font-medium border ${item.bg} ${item.text} ${item.border} ${sizeClasses}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{item.label}</span>
    </span>
  );
}
