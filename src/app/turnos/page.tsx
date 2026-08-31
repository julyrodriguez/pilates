"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { ShiftFilterBar } from "@/components/shifts/ShiftFilterBar";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { ShiftFormModal } from "@/components/shifts/ShiftFormModal";
import { ShiftAttendeesModal } from "@/components/shifts/ShiftAttendeesModal";
import { ManualBookingModal } from "@/components/bookings/ManualBookingModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useData } from "@/context/DataContext";
import { Shift } from "@/types";
import { Calendar, Plus } from "lucide-react";

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

  const filteredShifts = shifts.filter((s) => {
    if (
      search &&
      !s.title.toLowerCase().includes(search.toLowerCase()) &&
      !s.instructorName.toLowerCase().includes(search.toLowerCase()) &&
      !s.room.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (selectedDate && s.date !== selectedDate) {
      return false;
    }
    if (selectedDiscipline !== "all" && s.discipline !== selectedDiscipline) {
      return false;
    }
    if (selectedStatus !== "all" && s.status !== selectedStatus) {
      return false;
    }
    return true;
  });

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

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Mostrando {filteredShifts.length} clases configuradas
        </span>
        <button
          onClick={() => {
            setSearch("");
            setSelectedDate("");
            setSelectedDiscipline("all");
            setSelectedStatus("all");
          }}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
        >
          Limpiar filtros
        </button>
      </div>

      {filteredShifts.length === 0 ? (
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
          {filteredShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
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
        title="Eliminar Turno"
        message="¿Estás seguro de eliminar este turno? Esta acción no se puede deshacer."
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteShiftId(null)}
      />
    </AppShell>
  );
}
