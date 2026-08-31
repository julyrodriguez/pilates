"use client";

import React, { useState } from "react";
import { Instructor, DisciplineType } from "@/types";
import { useData } from "@/context/DataContext";
import { User, Mail, Phone, BookOpen, Palette } from "lucide-react";

interface InstructorFormProps {
  initialInstructor?: Instructor | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const availableDisciplineList: { id: DisciplineType; label: string }[] = [
  { id: "reformer", label: "Reformer" },
  { id: "mat", label: "Mat Pilates" },
  { id: "cadillac", label: "Cadillac" },
  { id: "tower", label: "Tower" },
  { id: "prenatal", label: "Prenatal" },
  { id: "power", label: "Power Pilates" },
];

export function InstructorForm({
  initialInstructor,
  onSuccess,
  onCancel,
}: InstructorFormProps) {
  const { addInstructor, updateInstructor } = useData();

  const [name, setName] = useState(initialInstructor?.name || "");
  const [email, setEmail] = useState(initialInstructor?.email || "");
  const [phone, setPhone] = useState(initialInstructor?.phone || "");
  const [bio, setBio] = useState(initialInstructor?.bio || "");
  const [colorTag, setColorTag] = useState(initialInstructor?.colorTag || "#ec4899");
  const [specialties, setSpecialties] = useState<DisciplineType[]>(
    initialInstructor?.specialties || ["reformer", "mat"]
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
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
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
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="instructor@estudio.com"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
            Teléfono
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 9 11 ..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
            />
          </div>
        </div>
      </div>

      {/* Specialties Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-2">
          Especialidades que dicta
        </label>
        <div className="flex flex-wrap gap-2">
          {availableDisciplineList.map((disc) => {
            const isSelected = specialties.includes(disc.id);
            return (
              <button
                type="button"
                key={disc.id}
                onClick={() => toggleSpecialty(disc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-rose-500/10 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
                }`}
              >
                {disc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-rose-200 mb-1">
          Biografía y Experiencia
        </label>
        <textarea
          rows={2}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Especialista en alineación postural y rehabilitación..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#120713] border border-rose-200/60 dark:border-rose-900/40 text-xs text-slate-800 dark:text-rose-100"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-200/50 dark:border-rose-900/30">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-rose-900/40 text-xs font-semibold text-slate-700 dark:text-rose-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-xl text-xs font-bold btn-rose-primary"
        >
          {saving ? "Guardando..." : "Guardar Instructor"}
        </button>
      </div>
    </form>
  );
}
