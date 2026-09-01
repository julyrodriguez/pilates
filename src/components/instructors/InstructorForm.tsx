"use client";

import React, { useState } from "react";
import { Instructor, DisciplineType } from "@/types";
import { useData } from "@/context/DataContext";
import { User, Mail, Phone } from "lucide-react";

interface InstructorFormProps {
  initialInstructor?: Instructor | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InstructorForm({
  initialInstructor,
  onSuccess,
  onCancel,
}: InstructorFormProps) {
  const { addInstructor, updateInstructor, disciplines } = useData();

  const [name, setName] = useState(initialInstructor?.name || "");
  const [email, setEmail] = useState(initialInstructor?.email || "");
  const [phone, setPhone] = useState(initialInstructor?.phone || "");
  const [bio, setBio] = useState(initialInstructor?.bio || "");
  const [colorTag, setColorTag] = useState(initialInstructor?.colorTag || "#4f46e5");
  const [specialties, setSpecialties] = useState<DisciplineType[]>(
    initialInstructor?.specialties || (disciplines.length > 0 ? [disciplines[0].slug || disciplines[0].id] : ["reformer"])
  );
  const [saving, setSaving] = useState(false);

  const toggleSpecialty = (disc: DisciplineType) => {
    setSpecialties((prev) =>
      prev.includes(disc) ? prev.filter((d) => d !== disc) : [...prev, disc]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (initialInstructor) {
        await updateInstructor(initialInstructor.id, {
          name,
          email,
          phone,
          bio,
          colorTag,
          specialties,
        });
      } else {
        await addInstructor({
          name,
          email,
          phone,
          bio,
          colorTag,
          specialties,
          active: true,
        });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Nombre del Instructor/a
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Valentina Rossi"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email <span className="text-slate-400 font-normal">(Opcional)</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="instructor@estudio.com"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Teléfono <span className="text-slate-400 font-normal">(Opcional)</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11 1234 5678"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Specialties Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Especialidades que dicta
        </label>
        <div className="flex flex-wrap gap-2">
          {disciplines.map((disc) => {
            const discSlug = disc.slug || disc.id;
            const isSelected = specialties.includes(discSlug);
            return (
              <button
                type="button"
                key={disc.id}
                onClick={() => toggleSpecialty(discSlug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {disc.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Biografía y Experiencia
        </label>
        <textarea
          rows={2}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Especialista en alineación postural y rehabilitación..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center justify-center shadow-xs"
        >
          {saving ? "Guardando..." : "Guardar Instructor"}
        </button>
      </div>
    </form>
  );
}
