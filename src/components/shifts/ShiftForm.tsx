"use client";

import React, { useState } from "react";
import { Shift, DisciplineType } from "@/types";
import { useData } from "@/context/DataContext";
import { Sparkles, Calendar, Clock, DollarSign, Users, MapPin, AlignLeft } from "lucide-react";

interface ShiftFormProps {
  initialShift?: Shift | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ShiftForm({ initialShift, onSuccess, onCancel }: ShiftFormProps) {
  const { instructors, addShift, updateShift } = useData();

  const [title, setTitle] = useState(initialShift?.title || "Pilates Reformer Flow");
  const [discipline, setDiscipline] = useState<DisciplineType>(initialShift?.discipline || "reformer");
  const [instructorId, setInstructorId] = useState(
    initialShift?.instructorId || instructors[0]?.id || ""
  );
  const [date, setDate] = useState(
    initialShift?.date || new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState(initialShift?.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialShift?.endTime || "10:00");
  const [capacity, setCapacity] = useState(initialShift?.capacity || 6);
  const [price, setPrice] = useState(initialShift?.price || 14000);
  const [room, setRoom] = useState(initialShift?.room || "Studio Reformer - Sala Rosa");
  const [level, setLevel] = useState<Shift["level"]>(initialShift?.level || "Todos los niveles");
  const [description, setDescription] = useState(initialShift?.description || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const selectedInstructor = instructors.find((i) => i.id === instructorId);
    const instructorName = selectedInstructor ? selectedInstructor.name : "Instructor Designado";

    try {
      if (initialShift) {
        await updateShift(initialShift.id, {
          title,
          discipline,
          instructorId,
          instructorName,
          date,
          startTime,
          endTime,
          capacity: Number(capacity),
          price: Number(price),
          room,
          level,
          description,
        });
      } else {
        await addShift({
          title,
          discipline,
          instructorId,
          instructorName,
          date,
          startTime,
          endTime,
          capacity: Number(capacity),
          price: Number(price),
          room,
          level,
          description,
        });
      }
      onSuccess();
    } catch (err) {
      console.error("Error saving shift:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
          Nombre de la Clase / Turno
        </label>
        <div className="relative">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Pilates Reformer Flow & Stretch"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-sm font-medium text-slate-800 dark:text-rose-100 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Discipline & Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Disciplina
          </label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value as DisciplineType)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-sm text-slate-800 dark:text-rose-100"
          >
            <option value="reformer">Reformer (Camas)</option>
            <option value="mat">Mat Pilates (Suelo)</option>
            <option value="cadillac">Cadillac</option>
            <option value="tower">Tower / Wall Unit</option>
            <option value="prenatal">Pilates Prenatal</option>
            <option value="power">Power Pilates HIIT</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Nivel de Exigencia
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as Shift["level"])}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-sm text-slate-800 dark:text-rose-100"
          >
            <option value="Principiante">Principiante (Básico)</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado (Intenso)</option>
            <option value="Todos los niveles">Todos los niveles</option>
          </select>
        </div>
      </div>

      {/* Instructor & Room */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Instructor/a
          </label>
          <select
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-sm text-slate-800 dark:text-rose-100"
          >
            {instructors.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Sala / Estudio
          </label>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Ej. Sala Rosa - Reformers"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-sm text-slate-800 dark:text-rose-100"
          />
        </div>
      </div>

      {/* Date, Start Time, End Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Fecha
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs font-medium text-slate-800 dark:text-rose-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Hora Inicio
          </label>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs font-medium text-slate-800 dark:text-rose-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Hora Fin
          </label>
          <input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs font-medium text-slate-800 dark:text-rose-100"
          />
        </div>
      </div>

      {/* Capacity & Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Cupo Máximo (Aforo de Camas / Colchonetas)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            required
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-sm text-slate-800 dark:text-rose-100 font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Precio por Alumno (ARS $)
          </label>
          <input
            type="number"
            min="0"
            step="500"
            required
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-sm text-slate-800 dark:text-rose-100 font-semibold"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
          Descripción o Recomendaciones (Opcional)
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej. Traer medias antideslizantes. Ideal para tonificar glúteos y abdomen..."
          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100 placeholder:text-slate-400"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-200/50 dark:border-rose-900/30">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-rose-900/50 text-xs font-semibold text-slate-700 dark:text-rose-200 hover:bg-slate-100 dark:hover:bg-rose-950/40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold btn-rose-primary disabled:opacity-50"
        >
          {saving ? "Guardando..." : initialShift ? "Actualizar Turno" : "Crear y Publicar Turno"}
        </button>
      </div>
    </form>
  );
}
