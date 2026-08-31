"use client";

import React from "react";
import { DisciplineType } from "@/types";
import { Sparkles, Layers, Activity, Zap, HeartHandshake, Flame } from "lucide-react";

interface DisciplineSelectorProps {
  selected: string;
  onSelect: (disc: string) => void;
}

const disciplines = [
  { id: "all", label: "Todas las Disciplinas", icon: Sparkles },
  { id: "reformer", label: "Reformer", icon: Sparkles },
  { id: "mat", label: "Mat Pilates", icon: Layers },
  { id: "cadillac", label: "Cadillac", icon: Activity },
  { id: "tower", label: "Tower Combo", icon: Zap },
  { id: "prenatal", label: "Prenatal", icon: HeartHandshake },
  { id: "power", label: "Power HIIT", icon: Flame },
];

export function DisciplineSelector({ selected, onSelect }: DisciplineSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
      {disciplines.map((item) => {
        const Icon = item.icon;
        const isSelected = selected === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              isSelected
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-[1.02]"
                : "bg-white dark:bg-[#1c0c1e] text-slate-700 dark:text-rose-200 border border-rose-200/60 dark:border-rose-900/40 hover:border-rose-400"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-rose-500"}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
