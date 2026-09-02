"use client";

import React, { useState, useMemo } from "react";
import { Shift } from "@/types";
import { AvailabilityBadge } from "@/components/common/AvailabilityBadge";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import { CapacityProgressBar } from "@/components/common/CapacityProgressBar";
import {
  Clock,
  MapPin,
  User,
  Users,
  Edit2,
  Trash2,
  UserPlus,
  MoreVertical,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export interface ShiftGroup {
  groupKey: string;
  title: string;
  discipline: Shift["discipline"];
  startTime: string;
  endTime: string;
  instructorName: string;
  instructorId: string;
  room: string;
  level: Shift["level"];
  price: number;
  instances: Shift[];
}

interface ShiftGroupCardProps {
  group: ShiftGroup;
  onEdit: (shift: Shift) => void;
  onDelete: (id: string) => void;
  onBookClient: (shift: Shift) => void;
  onViewAttendees: (shift: Shift) => void;
}

const DAY_NAMES_MAP = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function ShiftGroupCard({
  group,
  onEdit,
  onDelete,
  onBookClient,
  onViewAttendees,
}: ShiftGroupCardProps) {
  const [selectedShiftId, setSelectedShiftId] = useState<string>(
    group.instances[0]?.id || ""
  );
  const [showMenu, setShowMenu] = useState(false);

  // Instancia seleccionada actualmente en la tarjeta
  const currentShift = useMemo(() => {
    return group.instances.find((s) => s.id === selectedShiftId) || group.instances[0];
  }, [group.instances, selectedShiftId]);

  if (!currentShift) return null;

  const isFull = currentShift.bookedCount >= currentShift.capacity;
  const isMultiWeek = group.instances.length > 1;

  // Formateo amigable de la fecha
  const formatFriendlyDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    const dayName = DAY_NAMES_MAP[d.getDay()];
    const dayNum = d.getDate();
    const month = d.toLocaleString("es-AR", { month: "short" });
    return `${dayName} ${dayNum} ${month}`;
  };

  return (
    <div className="glass-card p-5 relative flex flex-col justify-between hover:shadow-lg transition-all rounded-3xl group border-slate-200 dark:border-slate-800">
      <div>
        {/* Top Badges & Recurrence Chip */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <DisciplineBadge discipline={group.discipline} size="sm" />

          <div className="flex items-center gap-1.5">
            {isMultiWeek && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center gap-1 shadow-2xs">
                <Layers className="w-3 h-3" />
                <span>{group.instances.length} semanas</span>
              </span>
            )}
            <AvailabilityBadge
              status={currentShift.status}
              bookedCount={currentShift.bookedCount}
              capacity={currentShift.capacity}
            />
          </div>
        </div>

        {/* Title and Time */}
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {group.title}
        </h3>

        <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1 text-slate-900 dark:text-slate-100 font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              {group.startTime} - {group.endTime} hs
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            {group.level}
          </span>
        </div>

        {/* Week / Date Selector Dropdown for recurring classes */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Fecha / Semana a gestionar:</span>
            {isMultiWeek && (
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                Selecciona fecha
              </span>
            )}
          </label>

          <div className="relative">
            <select
              value={currentShift.id}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              {group.instances.map((inst, idx) => {
                const isFullInstance = inst.bookedCount >= inst.capacity;
                const badgeText = isFullInstance
                  ? "COMPLETO"
                  : `${inst.bookedCount}/${inst.capacity} inscriptos`;
                return (
                  <option key={inst.id} value={inst.id}>
                    📅 {formatFriendlyDate(inst.date)} — ({badgeText})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Instructor & Location Info */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center">
              {group.instructorName.charAt(0)}
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {group.instructorName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{group.room}</span>
          </div>
        </div>

        {/* Capacity Visual Progress for Selected Date */}
        <div className="mt-3.5">
          <CapacityProgressBar
            capacity={currentShift.capacity}
            bookedCount={currentShift.bookedCount}
            showLabels={true}
          />
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 justify-end">
        <button
          onClick={() => onViewAttendees(currentShift)}
          type="button"
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          title="Ver alumnos inscriptos en la fecha seleccionada"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{currentShift.bookedCount} / {currentShift.capacity} inscriptos</span>
        </button>

        <button
          onClick={() => onBookClient(currentShift)}
          disabled={isFull}
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isFull
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              : "btn-primary shadow-2xs"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{isFull ? "Lleno" : "+ Inscribir"}</span>
        </button>

          {/* Context Options */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 min-w-[150px] animate-fadeIn">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(currentShift);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Editar clase</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(currentShift.id);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar clase</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
  );
}
