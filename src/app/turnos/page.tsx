"use client";

import React, { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { ShiftFilterBar } from "@/components/shifts/ShiftFilterBar";
import { ShiftGroupCard, ShiftGroup } from "@/components/shifts/ShiftGroupCard";
import { ShiftFormModal } from "@/components/shifts/ShiftFormModal";
import { ShiftAttendeesModal } from "@/components/shifts/ShiftAttendeesModal";
import { ManualBookingModal } from "@/components/bookings/ManualBookingModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useData } from "@/context/DataContext";
import { Shift } from "@/types";
import { Calendar, Plus, Sparkles, History, Clock } from "lucide-react";

export default function TurnosPage() {
  const { shifts, deleteShift } = useData();

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [selectedShiftForAttendees, setSelectedShiftForAttendees] = useState<Shift | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [targetShiftForBooking, setTargetShiftForBooking] = useState<Shift | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<string | null>(null);

  // Fecha y hora actual para distinguir clases por suceder vs pasadas
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const currentTimeStr = useMemo(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, []);

  // Filtrado de turnos
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (
        search &&
        !s.title.toLowerCase().includes(search.toLowerCase()) &&
        !s.instructorName.toLowerCase().includes(search.toLowerCase()) &&
        !s.room.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      // Si el usuario eligió una fecha explícita, filtramos por esa fecha exacta (incluso si es pasada)
      if (selectedDate) {
        if (s.date !== selectedDate) {
          return false;
        }
      } else {
        // Por defecto, mostrar únicamente las clases por suceder (a partir de hoy y horarios futuros)
        const isPast = s.date < todayStr || (s.date === todayStr && s.endTime < currentTimeStr);
        if (isPast) {
          return false;
        }
      }

      if (selectedDiscipline !== "all" && s.discipline !== selectedDiscipline) {
        return false;
      }
      if (selectedStatus !== "all" && s.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [shifts, search, selectedDate, selectedDiscipline, selectedStatus, todayStr, currentTimeStr]);

  // Concentrar repeticiones en una sola tarjeta inteligente
  const groupedShifts = useMemo(() => {
    const groups: Record<string, ShiftGroup> = {};

    filteredShifts.forEach((s) => {
      const d = new Date(s.date + "T12:00:00");
      const dayOfWeek = isNaN(d.getTime()) ? 0 : d.getDay();
      const key = `${s.title}__${s.discipline}__${s.startTime}__${s.endTime}__${s.instructorId}__${s.room}__${dayOfWeek}`;

      if (!groups[key]) {
        groups[key] = {
          groupKey: key,
          title: s.title,
          discipline: s.discipline,
          startTime: s.startTime,
          endTime: s.endTime,
          instructorName: s.instructorName,
          instructorId: s.instructorId,
          room: s.room,
          level: s.level,
          price: s.price,
          instances: [],
        };
      }
      groups[key].instances.push(s);
    });

    Object.values(groups).forEach((g) => {
      g.instances.sort((a, b) => a.date.localeCompare(b.date));
    });

    return Object.values(groups);
  }, [filteredShifts]);

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setShiftModalOpen(true);
  };

  const handleBookClient = (shift: Shift) => {
    setTargetShiftForBooking(shift);
    setBookingModalOpen(true);
  };

  const handleViewAttendees = (shift: Shift) => {
    setSelectedShiftForAttendees(shift);
    setAttendeesModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteShiftId) {
      await deleteShift(deleteShiftId);
      setDeleteShiftId(null);
    }
  };

  return (
    <AppShell>
      <Header
        onOpenNewShift={() => {
          setEditingShift(null);
          setShiftModalOpen(true);
        }}
        onOpenManualBooking={() => {
          setTargetShiftForBooking(null);
          setBookingModalOpen(true);
        }}
      />

      <ShiftFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedDiscipline={selectedDiscipline}
        onDisciplineChange={setSelectedDiscipline}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {groupedShifts.length} {groupedShifts.length === 1 ? "clase configurada" : "clases configuradas"} ({filteredShifts.length} turnos)
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
          
          {selectedDate ? (
            selectedDate < todayStr ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 flex items-center gap-1 shadow-2xs">
                <History className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Historial pasado ({selectedDate})</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 flex items-center gap-1 shadow-2xs">
                <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Filtrado por día ({selectedDate})</span>
              </span>
            )
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Próximas clases por suceder</span>
            </span>
          )}
        </div>

        <button
          onClick={() => {
            setSearch("");
            setSelectedDate("");
            setSelectedDiscipline("all");
            setSelectedStatus("all");
          }}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold self-start sm:self-auto cursor-pointer"
        >
          Limpiar filtros
        </button>
      </div>

      {groupedShifts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No hay clases con los filtros actuales
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Intenta cambiar los parámetros de búsqueda o crea una nueva clase.
          </p>
          <button
            onClick={() => {
              setEditingShift(null);
              setShiftModalOpen(true);
            }}
            className="mt-4 px-4 py-2 text-xs font-bold btn-primary inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Clase</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groupedShifts.map((group) => (
            <ShiftGroupCard
              key={group.groupKey}
              group={group}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteShiftId(id)}
              onBookClient={handleBookClient}
              onViewAttendees={handleViewAttendees}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ShiftFormModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        shiftToEdit={editingShift}
      />

      <ShiftAttendeesModal
        isOpen={attendeesModalOpen}
        onClose={() => setAttendeesModalOpen(false)}
        shift={selectedShiftForAttendees}
        onOpenManualBooking={(shift) => {
          setTargetShiftForBooking(shift);
          setBookingModalOpen(true);
        }}
      />

      <ManualBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        shiftToBook={targetShiftForBooking}
      />

      <ConfirmModal
        isOpen={!!deleteShiftId}
        title="Eliminar Clase"
        message="¿Estás seguro de eliminar esta clase? Esta acción no se puede deshacer."
        isDestructive={true}
        confirmText="Eliminar Clase"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteShiftId(null)}
      />
    </AppShell>
  );
}
