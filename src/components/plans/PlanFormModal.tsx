"use client";

import React, { useState, useEffect } from "react";
import { Plan } from "@/types";
import { useData } from "@/context/DataContext";
import { Award, X, Sparkles, DollarSign, CalendarCheck } from "lucide-react";

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: Plan | null;
}

export function PlanFormModal({ isOpen, onClose, planToEdit }: PlanFormModalProps) {
  const { addPlan, updatePlan } = useData();

  const [name, setName] = useState("");
  const [classesPerWeek, setClassesPerWeek] = useState(2);
  const [price, setPrice] = useState<number | string>(52000);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (planToEdit) {
      setName(planToEdit.name);
      setClassesPerWeek(planToEdit.classesPerWeek);
      setPrice(planToEdit.price);
      setDescription(planToEdit.description || "");
    } else {
      setName("Plan 2 Clases x Semana");
      setClassesPerWeek(2);
      setPrice(52000);
      setDescription("Frecuencia recomendada de Pilates Reformer / Mat");
    }
  }, [planToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalPrice = Math.max(0, Number(price) || 0);

    setSubmitting(true);
    try {
      if (planToEdit) {
        await updatePlan(planToEdit.id, {
          name: name.trim(),
          classesPerWeek: Number(classesPerWeek),
          price: finalPrice,
          description: description.trim(),
        });
      } else {
        await addPlan({
          name: name.trim(),
          classesPerWeek: Number(classesPerWeek),
          price: finalPrice,
          description: description.trim(),
          active: true,
        });
      }
      onClose();
    } catch (err) {
      console.error("Error guardando plan:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-modal my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {planToEdit ? "Editar Plan" : "Nuevo Plan de Pilates"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura clases semanales y valor
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Plan
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Plan 2 Clases x Semana"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Classes per week & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clases x Semana
              </label>
              <div className="relative">
                <select
                  value={classesPerWeek}
                  onChange={(e) => setClassesPerWeek(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-slate-100"
                >
                  <option value={1}>1 clase semanal</option>
                  <option value={2}>2 clases semanales</option>
                  <option value={3}>3 clases semanales</option>
                  <option value={4}>4 clases semanales</option>
                  <option value={5}>5 clases semanales</option>
                  <option value={6}>6 clases semanales</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Arancel Base ($)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrice(val === "" ? "" : Number(val));
                }}
                onBlur={() => {
                  if (price === "" || Number(price) < 0) {
                    setPrice(0);
                  }
                }}
                placeholder="52000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descripción o Beneficios (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Acceso a todas las clases de Reformer y Mat..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold btn-primary"
            >
              {submitting ? "Guardando..." : planToEdit ? "Actualizar Plan" : "Guardar Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
