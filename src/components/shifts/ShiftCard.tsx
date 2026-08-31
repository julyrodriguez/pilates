"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface ShiftCardProps {
  shift: Shift;
  onEdit: (shift: Shift) => void;
  onDelete: (id: string) => void;
  onBookClient: (shift: Shift) => void;
  onViewAttendees: (shift: Shift) => void;
}

export function ShiftCard({
  shift,
  onEdit,
  onDelete,
  onBookClient,
  onViewAttendees,
}: ShiftCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isFull = shift.bookedCount >= shift.capacity;

  return (
    <div className="glass-card p-5 relative flex flex-col justify-between hover:shadow-lg transition-all group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <DisciplineBadge discipline={shift.discipline} size="sm" />
          <AvailabilityBadge
            status={shift.status}
            bookedCount={shift.bookedCount}
            capacity={shift.capacity}
          />
        </div>

        {/* Title and Time */}
        <h3 className="text-base font-bold text-slate-800 dark:text-rose-50 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
          {shift.title}
        </h3>

        <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {shift.startTime} - {shift.endTime} hs
            </span>
          </div>
          <span className="text-slate-300 dark:text-rose-800">•</span>
          <div className="flex items-center gap-1 text-slate-500 dark:text-rose-200/70">
            <Calendar className="w-3.5 h-3.5" />
            <span>{shift.date}</span>
          </div>
        </div>

        {/* Instructor and Location */}
        <div className="mt-3.5 pt-3 border-t border-rose-200/40 dark:border-rose-900/30 space-y-1.5 text-xs text-slate-600 dark:text-rose-200/80">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-medium">Prof: {shift.instructorName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 ml-auto">
              {shift.level}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 dark:text-rose-300/60">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="truncate">{shift.room}</span>
          </div>
        </div>

        {/* Capacity visual progress */}
        <div className="mt-4">
          <CapacityProgressBar
            capacity={shift.capacity}
            bookedCount={shift.bookedCount}
            showLabels={true}
          />
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="mt-5 pt-3 border-t border-rose-200/40 dark:border-rose-900/30 flex items-center justify-between gap-2">
        <div className="text-xs">
          <span className="text-slate-400 dark:text-rose-300/60 block text-[10px]">Arancel</span>
          <span className="font-extrabold text-slate-800 dark:text-rose-100 text-sm">
            ${shift.price.toLocaleString("es-AR")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onViewAttendees(shift)}
            type="button"
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-100/80 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200 hover:bg-rose-200 dark:hover:bg-rose-800/40 transition-colors"
            title="Ver lista de alumnos inscriptos"
          >
            <Users className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onBookClient(shift)}
            disabled={isFull}
            type="button"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isFull
                ? "bg-slate-200 dark:bg-rose-950/40 text-slate-400 cursor-not-allowed"
                : "btn-rose-primary"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isFull ? "Lleno" : "Anotar"}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-rose-100 hover:bg-rose-50 dark:hover:bg-rose-900/30"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 z-40 bg-white dark:bg-[#1c0c1e] border border-rose-200 dark:border-rose-800/60 rounded-xl shadow-xl py-1 min-w-[130px] animate-fadeIn">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(shift);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Editar turno</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(shift.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
