"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { InstructorCard } from "@/components/instructors/InstructorCard";
import { InstructorFormModal } from "@/components/instructors/InstructorFormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useData } from "@/context/DataContext";
import { Instructor } from "@/types";
import { GraduationCap, Plus } from "lucide-react";

export default function InstructoresPage() {
  const { instructors, shifts, deleteInstructor } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [deleteInstructorId, setDeleteInstructorId] = useState<string | null>(null);

  const handleEdit = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteInstructorId) {
      await deleteInstructor(deleteInstructorId);
      setDeleteInstructorId(null);
    }
  };

  return (
    <AppShell>
      <Header />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-rose-50">
            Equipo Docente ({instructors.length} instructores)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Instructores certificados de Selene Pilates
          </p>
        </div>

        <button
          onClick={() => {
            setEditingInstructor(null);
            setModalOpen(true);
          }}
          type="button"
          className="px-4 py-2 rounded-xl text-xs font-bold btn-rose-primary flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Instructor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {instructors.map((inst) => (
          <InstructorCard
            key={inst.id}
            instructor={inst}
            shifts={shifts}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteInstructorId(id)}
          />
        ))}
      </div>

      {/* Modals */}
      <InstructorFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        instructorToEdit={editingInstructor}
      />

      <ConfirmModal
        isOpen={!!deleteInstructorId}
        title="Eliminar Instructor"
        message="¿Estás seguro de eliminar este perfil del equipo? Sus turnos asignados deberán ser reasignados."
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteInstructorId(null)}
      />
    </AppShell>
  );
}
