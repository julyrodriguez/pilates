"use client";

import React, { useState } from "react";
import { Client } from "@/types";
import { useData } from "@/context/DataContext";
import { User, Mail, Phone, HeartPulse } from "lucide-react";

interface ClientFormProps {
  initialClient?: Client | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientForm({ initialClient, onSuccess, onCancel }: ClientFormProps) {
  const { addClient, updateClient, plans } = useData();
  const [name, setName] = useState(initialClient?.name || "");
  const [email, setEmail] = useState(initialClient?.email || "");
  const [phone, setPhone] = useState(initialClient?.phone || "");
  const [healthNotes, setHealthNotes] = useState(initialClient?.healthNotes || "");
  const [planId, setPlanId] = useState(initialClient?.planId || "");
  const [hasCustomPrice, setHasCustomPrice] = useState(
    initialClient?.customPrice !== undefined && initialClient?.customPrice !== null
  );
  const [customPrice, setCustomPrice] = useState<number | undefined>(
    initialClient?.customPrice
  );
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending" | "overdue">(
    initialClient?.paymentStatus || "pending"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === planId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor ingresa el nombre de la clienta.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Debes ingresar al menos Correo electrónico o Teléfono.");
      return;
    }

    setSaving(true);
    setError(null);

    const finalCustomPrice =
      planId && hasCustomPrice && customPrice !== undefined && !isNaN(Number(customPrice))
        ? Number(customPrice)
        : undefined;

    try {
      if (initialClient) {
        await updateClient(initialClient.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          healthNotes: healthNotes.trim(),
          planId: planId || "",
          planName: selectedPlan ? selectedPlan.name : "",
          planClassesPerWeek: selectedPlan ? selectedPlan.classesPerWeek : 0,
          customPrice: finalCustomPrice,
          paymentStatus,
        });
      } else {
        await addClient({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          healthNotes: healthNotes.trim(),
          planId: planId || "",
          planName: selectedPlan ? selectedPlan.name : "",
          planClassesPerWeek: selectedPlan ? selectedPlan.classesPerWeek : 0,
          customPrice: finalCustomPrice,
          paymentStatus,
        });
      }
      onSuccess();
    } catch (err) {
      console.error("Error al guardar alumno:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Nombre Completo
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Sofía Benítez"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alumno@ejemplo.com"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Teléfono / WhatsApp
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11 1234 5678"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Plan Asignado & Arancel & Pago */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-3">
        <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
          Plan y Arancel Semanal
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Plan Asignado
            </label>
            <select
              value={planId}
              onChange={(e) => {
                const newPlanId = e.target.value;
                setPlanId(newPlanId);
                if (!newPlanId) {
                  setHasCustomPrice(false);
                  setCustomPrice(undefined);
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="">Sin Plan (Clase suelta individual)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.classesPerWeek}x sem) - Base: ${p.price.toLocaleString("es-AR")}
                </option>
              ))}
            </select>
          </div>

          {/* Si tiene plan asignado, mostrar arancel base y opción de personalizar */}
          {selectedPlan && (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Arancel base del plan:
                </span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  ${selectedPlan.price.toLocaleString("es-AR")}
                </span>
              </div>

              {/* Checkbox para activar arancel personalizado */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCustomPrice}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasCustomPrice(checked);
                      if (checked) {
                        setCustomPrice(customPrice !== undefined ? customPrice : selectedPlan.price);
                      } else {
                        setCustomPrice(undefined);
                      }
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Ajustar arancel personalizado
                  </span>
                </label>

                {hasCustomPrice && (
                  <div className="mt-2.5">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Monto del Arancel Personalizado ($)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        step="500"
                        value={customPrice !== undefined ? customPrice : selectedPlan.price}
                        onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Monto personalizado..."
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Estado de Pago
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaymentStatus("paid")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                paymentStatus === "paid"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              ✓ Pagado
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus("pending")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                paymentStatus === "pending"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              ⏳ Pendiente
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Notas Clínicas / Patologías Posturales
        </label>
        <div className="relative">
          <HeartPulse className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows={2}
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            placeholder="Ej. Escoliosis leve, hiperlaxitud, rehabilitación de meniscos..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
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
          {saving ? "Guardando..." : "Guardar Alumno"}
        </button>
      </div>
    </form>
  );
}
