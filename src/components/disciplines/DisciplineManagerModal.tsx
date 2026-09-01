"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { X, Plus, Trash2, SlidersHorizontal, Sparkles, Layers } from "lucide-react";

interface DisciplineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisciplineManagerModal({ isOpen, onClose }: DisciplineManagerModalProps) {
  const { disciplines, addDiscipline, deleteDiscipline } = useData();
  const [newDisciplineName, setNewDisciplineName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisciplineName.trim()) return;

    setIsSubmitting(true);
    try {
      await addDiscipline({
        name: newDisciplineName.trim(),
      });
      setNewDisciplineName("");
    } catch (err) {
      console.error("Error creating discipline:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (disciplines.length <= 1) {
      alert("Debes mantener al menos una disciplina activa en el estudio.");
      return;
    }

    if (confirm(`¿Estás seguro de eliminar la disciplina "${name}"?`)) {
      setDeletingId(id);
      try {
        await deleteDiscipline(id);
      } catch (err) {
        console.error("Error deleting discipline:", err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60   p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-modal my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Gestionar Disciplinas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura los tipos de clase del estudio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Discipline Form */}
        <form onSubmit={handleAdd} className="mb-5 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Agregar Nueva Disciplina
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={newDisciplineName}
              onChange={(e) => setNewDisciplineName(e.target.value)}
              placeholder="Ej. Pilates Chair, Barre, Yoga..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newDisciplineName.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold btn-primary disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Guardando..." : "Agregar Disciplina"}</span>
            </button>
          </div>
        </form>

        {/* List of Disciplines */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Disciplinas Activas ({disciplines.length})
          </label>

          {disciplines.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-500">
              No hay disciplinas configuradas
            </div>
          ) : (
            disciplines.map((disc) => (
              <div
                key={disc.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      {disc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Código: {disc.slug || disc.id}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(disc.id, disc.name)}
                  disabled={deletingId === disc.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Eliminar disciplina"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer info & Close */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sincronizado con base de datos</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
