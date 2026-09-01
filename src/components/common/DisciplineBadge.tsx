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
    bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/20",
    icon: Sparkles,
  },
  mat: {
    label: "Mat Pilates",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20",
    icon: Layers,
  },
  cadillac: {
    label: "Cadillac",
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-500/20",
    icon: Activity,
  },
  tower: {
    label: "Tower / Combo",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/20",
    icon: Zap,
  },
  prenatal: {
    label: "Prenatal",
    bg: "bg-teal-500/10 dark:bg-teal-500/15",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-500/20",
    icon: HeartHandshake,
  },
  power: {
    label: "Power Pilates",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/20",
    icon: Flame,
  },
};

export function DisciplineBadge({ discipline, size = "md" }: DisciplineBadgeProps) {
  const item = config[discipline as keyof typeof config] || {
    label: discipline ? discipline.charAt(0).toUpperCase() + discipline.slice(1).replace(/-/g, " ") : "Pilates",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/20",
    icon: Sparkles,
  };
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
