"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Shift, DisciplineType } from "@/types";
import { useData } from "@/context/DataContext";
import { Clock, Calendar, Plus, Sparkles, Sun, Moon, X, AlertCircle } from "lucide-react";

interface ShiftFormProps {
  initialShift?: Shift | null;
  preselectedDate?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MORNING_HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
];

const AFTERNOON_HOURS = [
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const DURATION_PRESETS = [
  { value: 45, label: "45 min" },
  { value: 50, label: "50 min" },
  { value: 60, label: "60 min (1h)" },
  { value: 75, label: "75 min" },
  { value: 90, label: "90 min" },
];

const WEEKDAYS = [
  { dayIndex: 1, label: "Lun", fullLabel: "Lunes" },
  { dayIndex: 2, label: "Mar", fullLabel: "Martes" },
  { dayIndex: 3, label: "Mié", fullLabel: "Miércoles" },
  { dayIndex: 4, label: "Jue", fullLabel: "Jueves" },
  { dayIndex: 5, label: "Vie", fullLabel: "Viernes" },
];

function getNextWeekday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split("T")[0];
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMin = h * 60 + m + minutes;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function ShiftForm({ initialShift, preselectedDate, onSuccess, onCancel }: ShiftFormProps) {
  const { instructors, disciplines, addShift, addShiftsBatch, updateShift } = useData();

  const isEditing = !!initialShift;

  const [title, setTitle] = useState(initialShift?.title || "Pilates Reformer Flow");
  const [discipline, setDiscipline] = useState<DisciplineType>(
    initialShift?.discipline || (disciplines.length > 0 ? (disciplines[0].slug || disciplines[0].id) : "reformer")
  );
  const [instructorId, setInstructorId] = useState(
    initialShift?.instructorId || instructors[0]?.id || ""
  );
  const [room, setRoom] = useState(initialShift?.room || "Studio Reformer - Sala Principal");
  const [level, setLevel] = useState<Shift["level"]>(initialShift?.level || "Todos los niveles");
  const [capacity, setCapacity] = useState<number | string>(initialShift?.capacity ?? 6);
  const [price, setPrice] = useState<number | string>(initialShift?.price ?? 14000);
  const [description, setDescription] = useState(initialShift?.description || "");

  // Fechas y horarios (garantizar de Lunes a Viernes y tomar el día preseleccionado)
  const defaultDate = initialShift?.date || preselectedDate || getNextWeekday();
  const [startDate, setStartDate] = useState(defaultDate);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedHours, setSelectedHours] = useState<string[]>(
    initialShift ? [initialShift.startTime] : ["09:00"]
  );
  const [customHourInput, setCustomHourInput] = useState("");
  const [singleEndTime, setSingleEndTime] = useState(initialShift?.endTime || "10:00");

  // Replicación en semanas (solo lunes a viernes)
  const initialDayIndex = new Date(defaultDate + "T12:00:00").getDay();
  const validInitialDay = initialDayIndex === 0 || initialDayIndex === 6 ? 1 : initialDayIndex;

  const [selectedDays, setSelectedDays] = useState<number[]>([validInitialDay]);
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [saving, setSaving] = useState(false);

  // Sincronizar si cambia el preselectedDate o initialShift al reabrir el modal
  React.useEffect(() => {
    const targetDate = initialShift?.date || preselectedDate || getNextWeekday();
    setStartDate(targetDate);
    const dayIndex = new Date(targetDate + "T12:00:00").getDay();
    const validDay = dayIndex === 0 || dayIndex === 6 ? 1 : dayIndex;
    setSelectedDays([validDay]);
    if (initialShift) {
      setSelectedHours([initialShift.startTime]);
      setSingleEndTime(initialShift.endTime);
    }
  }, [initialShift, preselectedDate]);

  const isStartDateWeekend = useMemo(() => {
    const day = new Date(startDate + "T12:00:00").getDay();
    return day === 0 || day === 6;
  }, [startDate]);

  const toggleHour = useCallback((hour: string) => {
    setSelectedHours((prev) =>
      prev.includes(hour)
        ? prev.filter((h) => h !== hour)
        : [...prev, hour].sort()
    );
  }, []);

  const clearAllHours = useCallback(() => {
    setSelectedHours([]);
  }, []);

  const handleAddCustomHour = useCallback(() => {
    if (!customHourInput) return;
    setSelectedHours((prev) =>
      prev.includes(customHourInput) ? prev : [...prev, customHourInput].sort()
    );
    setCustomHourInput("");
  }, [customHourInput]);

  const toggleDay = useCallback((dayIndex: number) => {
    if (dayIndex === 0 || dayIndex === 6) return; // no permitir sabado ni domingo
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.length > 1
          ? prev.filter((d) => d !== dayIndex)
          : prev
        : [...prev, dayIndex].sort()
    );
  }, []);

  // Cálculo ultra optimizado y memorizado excluyendo fines de semana
  const generatedList = useMemo(() => {
    if (isEditing) return [];

    const generated: Array<{ date: string; startTime: string; endTime: string }> = [];
    const baseDate = new Date(startDate + "T12:00:00");

    for (let w = 0; w < repeatWeeks; w++) {
      for (const dayIndex of selectedDays) {
        if (dayIndex === 0 || dayIndex === 6) continue; // Saltear fines de semana

        const d = new Date(baseDate);
        const currentDay = d.getDay();
        const diff = (dayIndex - currentDay + 7) % 7;
        d.setDate(d.getDate() + diff + w * 7);

        // Si por alguna razón cae en fin de semana, ignorar
        if (d.getDay() === 0 || d.getDay() === 6) continue;

        const dateStr = d.toISOString().split("T")[0];

        for (const startTime of selectedHours) {
          const endTime = addMinutesToTime(startTime, durationMinutes);
          generated.push({
            date: dateStr,
            startTime,
            endTime,
          });
        }
      }
    }
    return generated;
  }, [isEditing, startDate, repeatWeeks, selectedDays, selectedHours, durationMinutes]);

  const totalToCreate = isEditing ? 1 : generatedList.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const selectedInstructor = instructors.find((i) => i.id === instructorId);
    const instructorName = selectedInstructor ? selectedInstructor.name : "Instructor Designado";

    try {
      const finalCapacity = Math.max(1, Number(capacity) || 1);
      const finalPrice = Math.max(0, Number(price) || 0);

      if (isEditing && initialShift) {
        await updateShift(initialShift.id, {
          title,
          discipline,
          instructorId,
          instructorName,
          date: startDate,
          startTime: selectedHours[0] || initialShift.startTime,
          endTime: singleEndTime || addMinutesToTime(selectedHours[0] || "09:00", durationMinutes),
          capacity: finalCapacity,
          price: finalPrice,
          room,
          level,
          description,
        });
      } else {
        const shiftsToInsert = generatedList.map((item) => ({
          title,
          discipline,
          instructorId,
          instructorName,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          capacity: finalCapacity,
          price: finalPrice,
          room,
          level,
          description,
        }));

        if (shiftsToInsert.length === 1) {
          await addShift(shiftsToInsert[0]);
        } else if (shiftsToInsert.length > 1) {
          await addShiftsBatch(shiftsToInsert);
        }
      }
      onSuccess();
    } catch (err) {
      console.error("Error al guardar clase(s):", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Nombre de la Clase
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Pilates Reformer Flow"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Discipline & Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Disciplina
          </label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value as DisciplineType)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          >
            {disciplines.map((d) => (
              <option key={d.id} value={d.slug || d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nivel de Exigencia
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as Shift["level"])}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Instructor/a
          </label>
          <select
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          >
            {instructors.length === 0 ? (
              <option value="">(Sin instructor registrado)</option>
            ) : (
              instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Sala / Estudio
          </label>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Ej. Studio Reformer - Sala Principal"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Horarios y Duración */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
        {/* Header con título y Selector de Duración (Presets + Minutos Personalizados) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Horarios y Duración de Clase</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Elige un tiempo predefinido o escribe la duración exacta en minutos
            </p>
          </div>

          {/* Duración: Presets Rápidos + Input de Minutos Personalizados */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              {[45, 50, 60, 75, 90].map((mins) => {
                const isSelected = durationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>

            {/* Input para duración personalizada */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <input
                type="number"
                min="10"
                max="360"
                step="5"
                value={durationMinutes || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setDurationMinutes(val === "" ? 0 : Math.max(1, Number(val)));
                }}
                onBlur={() => {
                  if (!durationMinutes || durationMinutes < 10) {
                    setDurationMinutes(60);
                  }
                }}
                className="w-10 bg-transparent text-xs font-bold text-center text-indigo-600 dark:text-indigo-400 focus:outline-none"
                placeholder="60"
              />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">min</span>
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Hora Inicio
              </label>
              <input
                type="time"
                value={selectedHours[0] || ""}
                onChange={(e) => setSelectedHours([e.target.value])}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Hora Fin
              </label>
              <input
                type="time"
                value={singleEndTime}
                onChange={(e) => setSingleEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Active Selected Hours Display (Chips bien visibles o Alerta si no hay) */}
            {selectedHours.length > 0 ? (
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-indigo-950 dark:text-indigo-200">
                      Horarios seleccionados:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white shadow-2xs">
                      {selectedHours.length} {selectedHours.length === 1 ? "horario" : "horarios"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearAllHours}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors self-start sm:self-auto"
                  >
                    Deseleccionar todos
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedHours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => toggleHour(hour)}
                      className="px-2 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-2xs group cursor-pointer"
                      title="Toca para remover este horario"
                    >
                      <span>{hour} hs</span>
                      <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white text-[9px] flex items-center justify-center group-hover:bg-rose-500 transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-dashed border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold">
                  No hay horarios seleccionados. Toca uno de los horarios rápidos abajo para agregarlo.
                </span>
              </div>
            )}

            {/* Quick Common Hours Sections */}
            <div className="space-y-3 pt-1">
              {/* Turno Mañana */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Turno Mañana (07:00 a 12:00 hs)</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {MORNING_HOURS.map((hour) => {
                    const isSelected = selectedHours.includes(hour);
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => toggleHour(hour)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/50 scale-[1.02]"
                            : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:bg-indigo-50/40"
                        }`}
                      >
                        <span>{hour} hs</span>
                        <span className={`text-[9px] mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                          a {addMinutesToTime(hour, durationMinutes)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Turno Tarde / Noche */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Turno Tarde / Noche (13:00 a 21:00 hs)</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                  {AFTERNOON_HOURS.map((hour) => {
                    const isSelected = selectedHours.includes(hour);
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => toggleHour(hour)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/50 scale-[1.02]"
                            : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:bg-indigo-50/40"
                        }`}
                      >
                        <span>{hour} hs</span>
                        <span className={`text-[9px] mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                          a {addMinutesToTime(hour, durationMinutes)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Hour Input with Enter support */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ¿Otro horario específico?
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={customHourInput}
                    onChange={(e) => setCustomHourInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomHour();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomHour}
                    disabled={!customHourInput}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fechas y Replicación por Semanas */}
      <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Fecha y Replicación Semanal</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Fecha de Inicio
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                const dIndex = new Date(e.target.value + "T12:00:00").getDay();
                if (dIndex !== 0 && dIndex !== 6 && !selectedDays.includes(dIndex)) {
                  setSelectedDays([dIndex]);
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
            />
            {isStartDateWeekend && (
              <p className="text-[11px] font-bold text-rose-500 mt-1">
                ⚠️ No se pueden crear clases los sábados ni domingos.
              </p>
            )}
          </div>

          {!isEditing && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Replicar durante
              </label>
              <select
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
              >
                <option value={1}>Solo esta semana (1 semana)</option>
                <option value={2}>Próximas 2 semanas</option>
                <option value={4}>Próximas 4 semanas (1 mes)</option>
                <option value={8}>Próximas 8 semanas (2 meses)</option>
                <option value={12}>Próximas 12 semanas (3 meses)</option>
              </select>
            </div>
          )}
        </div>

        {!isEditing && (
          <div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Días a replicar en la semana:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((w) => {
                const isSelected = selectedDays.includes(w.dayIndex);
                return (
                  <button
                    key={w.dayIndex}
                    type="button"
                    onClick={() => toggleDay(w.dayIndex)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Capacity (Aforo de Camas) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Cupo Máximo (Aforo de Camas)
        </label>
        <input
          type="number"
          min="1"
          max="50"
          required
          value={capacity}
          onChange={(e) => {
            const val = e.target.value;
            setCapacity(val === "" ? "" : Number(val));
          }}
          onBlur={() => {
            if (capacity === "" || Number(capacity) < 1) {
              setCapacity(1);
            }
          }}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-semibold"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Descripción o Recomendaciones (Opcional)
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej. Traer medias antideslizantes..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Summary Badge */}
      {!isEditing && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Se generarán <strong>{totalToCreate} clases</strong> ({selectedHours.length} horarios × {selectedDays.length} días × {repeatWeeks} semanas)
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || isStartDateWeekend || (!isEditing && (selectedHours.length === 0 || totalToCreate === 0))}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
        >
          {saving ? (
            "Guardando clases..."
          ) : isEditing ? (
            "Actualizar Clase"
          ) : selectedHours.length === 0 ? (
            "Selecciona al menos un horario"
          ) : (
            `Crear y Publicar ${totalToCreate} Clase${totalToCreate > 1 ? "s" : ""}`
          )}
        </button>
      </div>
    </form>
  );
}
