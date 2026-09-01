"use client";

import React, { useState } from "react";
import { Client, Plan } from "@/types";
import { useData } from "@/context/DataContext";
import {
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  CalendarCheck,
  Edit3,
  MessageCircle,
} from "lucide-react";
import { ConfirmModal } from "@/components/common/ConfirmModal";

interface ClientPlanManagerTableProps {
  clients: Client[];
  plans: Plan[];
  onOpenClientHistory?: (client: Client) => void;
}

export function ClientPlanManagerTable({ clients, plans, onOpenClientHistory }: ClientPlanManagerTableProps) {
  const { updateClient, getClientWeeklyUsage, toggleClientWeeklyPayment } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlanId, setFilterPlanId] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [paymentToConfirm, setPaymentToConfirm] = useState<{
    clientId: string;
    clientName: string;
    mondayStr: string;
    currentlyPaid: boolean;
  } | null>(null);

  const filteredClients = clients.filter((c) => {
    if (
      searchTerm &&
      !c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.phone.includes(searchTerm)
    ) {
      return false;
    }
    if (filterPlanId === "with_plan" && !c.planId) return false;
    if (filterPlanId === "no_plan" && c.planId) return false;
    if (filterPlanId !== "all" && filterPlanId !== "with_plan" && filterPlanId !== "no_plan") {
      if (c.planId !== filterPlanId) return false;
    }
    if (filterPayment !== "all") {
      const currentStatus = c.paymentStatus || "pending";
      if (currentStatus !== filterPayment) return false;
    }
    return true;
  });

  const handlePlanChange = async (client: Client, newPlanId: string) => {
    const selectedPlan = plans.find((p) => p.id === newPlanId);
    if (!newPlanId) {
      await updateClient(client.id, {
        planId: "",
        planName: "",
        planClassesPerWeek: 0,
        customPrice: undefined,
      });
    } else if (selectedPlan) {
      await updateClient(client.id, {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planClassesPerWeek: selectedPlan.classesPerWeek,
        customPrice: client.customPrice, // Mantiene customPrice si ya lo tenía, sino undefined (toma el base)
        paymentStatus: client.paymentStatus || "pending",
      });
    }
  };

  const handleTogglePayment = async (client: Client) => {
    const current = client.paymentStatus || "pending";
    const nextStatus = current === "paid" ? "pending" : "paid";
    await updateClient(client.id, {
      paymentStatus: nextStatus,
      lastPaymentDate: nextStatus === "paid" ? new Date().toISOString().split("T")[0] : client.lastPaymentDate,
    });
  };

  const handleToggleCustomPrice = async (client: Client, enable: boolean) => {
    const assignedPlan = plans.find((p) => p.id === client.planId);
    await updateClient(client.id, {
      customPrice: enable ? (client.customPrice || assignedPlan?.price || 0) : undefined,
    });
  };

  const handleCustomPriceChange = async (client: Client, newPrice: number) => {
    if (isNaN(newPrice)) return;
    await updateClient(client.id, {
      customPrice: newPrice,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Seguimiento de Clientas y Planes</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de turnos utilizados esta semana, aranceles ajustados y estado de pago
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar clienta..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Plan Filter */}
          <select
            value={filterPlanId}
            onChange={(e) => setFilterPlanId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="all">Todos los Planes</option>
            <option value="with_plan">Solo con Plan Asignado</option>
            <option value="no_plan">Sin Plan (Particulares)</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="all">Todos los Pagos</option>
            <option value="paid">Pagados</option>
            <option value="pending">Pendientes de Pago</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List (< lg) */}
      <div className="block lg:hidden space-y-3">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No hay clientas que coincidan con la búsqueda.
          </div>
        ) : (
          filteredClients.map((client) => {
            const assignedPlan = plans.find((p) => p.id === client.planId);
            const weeklyUsage = getClientWeeklyUsage(client.id);
            const activePrice = client.customPrice !== undefined ? client.customPrice : assignedPlan?.price || 0;
            const now = new Date();
            const currentMonday = new Date(now);
            const day = currentMonday.getDay();
            const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
            currentMonday.setDate(diff);
            const currentMondayStr = currentMonday.toISOString().split("T")[0];
            const isWeekPaid = Boolean(client.weeklyPayments && client.weeklyPayments[currentMondayStr]);

            return (
              <div
                key={client.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                {/* Header: Client Name & Contact */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div
                      onClick={() => onOpenClientHistory && onOpenClientHistory(client)}
                      className="font-bold text-slate-900 dark:text-slate-100 text-sm cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <span className="underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2">{client.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{client.email || "Sin email"}</span>
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          • {client.phone}
                          {(() => {
                            const phoneDigits = (client.phone || "").replace(/\D/g, "");
                            const fullPhone = phoneDigits ? (phoneDigits.startsWith("54") ? phoneDigits : `549${phoneDigits}`) : null;
                            return fullPhone ? (
                              <a
                                href={`whatsapp://send?phone=${fullPhone}`}
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 ml-0.5"
                                title="Abrir app de WhatsApp de tu dispositivo"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            ) : null;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentToConfirm({
                        clientId: client.id,
                        clientName: client.name,
                        mondayStr: currentMondayStr,
                        currentlyPaid: isWeekPaid,
                      })
                    }
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shrink-0 ${
                      isWeekPaid
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {isWeekPaid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Pagado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        <span>Pendiente</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Plan Selection & Custom Price */}
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Plan Asignado:
                    </label>
                    <select
                      value={client.planId || ""}
                      onChange={(e) => handlePlanChange(client, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="">Sin Plan (Clase suelta individual)</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.classesPerWeek}x sem) - Base: ${p.price.toLocaleString("es-AR")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Arancel: solo si tiene plan */}
                  {client.planId && assignedPlan && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
                          Arancel ({client.customPrice !== undefined ? "Personalizado" : "Base del Plan"}):
                        </span>
                        <span className="font-black text-slate-900 dark:text-slate-100 text-xs">
                          ${(client.customPrice !== undefined ? client.customPrice : assignedPlan.price).toLocaleString("es-AR")}
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          <input
                            type="checkbox"
                            checked={client.customPrice !== undefined}
                            onChange={(e) => handleToggleCustomPrice(client, e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span>Personalizar</span>
                        </label>

                        {client.customPrice !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold text-[11px]">$</span>
                            <input
                              type="number"
                              step="500"
                              value={client.customPrice}
                              onChange={(e) => handleCustomPriceChange(client, Number(e.target.value))}
                              className="w-24 px-2 py-0.5 text-xs font-black rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                              placeholder="Arancel..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Weekly Usage Progress */}
                {client.planId && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span
                        className={
                          weeklyUsage.remaining === 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-indigo-600 dark:text-indigo-400"
                        }
                      >
                        {weeklyUsage.used} de {weeklyUsage.total} turnos usados esta semana
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {weeklyUsage.remaining} disp.
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          weeklyUsage.remaining === 0
                            ? "bg-rose-500"
                            : "bg-indigo-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (weeklyUsage.used / (weeklyUsage.total || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* View history action button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenClientHistory && onOpenClientHistory(client)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    Ver historial completo de semanas →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (>= lg) */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
            <tr>
              <th className="p-3.5">Clienta</th>
              <th className="p-3.5">Plan Asignado</th>
              <th className="p-3.5">Arancel Semanal/Mensual</th>
              <th className="p-3.5">Turnos Esta Semana</th>
              <th className="p-3.5 text-center">Estado de Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No hay clientas que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const assignedPlan = plans.find((p) => p.id === client.planId);
                const weeklyUsage = getClientWeeklyUsage(client.id);
                const isPaid = client.paymentStatus === "paid";

                return (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Client Name & Contact */}
                    <td className="p-3.5">
                      <div
                        onClick={() => onOpenClientHistory && onOpenClientHistory(client)}
                        className="font-bold text-slate-900 dark:text-slate-100 text-sm cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group"
                      >
                        <span className="underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2">{client.name}</span>
                        <span className="text-[11px] text-slate-400 ml-1.5 font-normal">👁️ ver turnos</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{client.email || "Sin email"}</span>
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            • {client.phone}
                            {(() => {
                              const phoneDigits = (client.phone || "").replace(/\D/g, "");
                              const fullPhone = phoneDigits ? (phoneDigits.startsWith("54") ? phoneDigits : `549${phoneDigits}`) : null;
                              return fullPhone ? (
                                <a
                                  href={`whatsapp://send?phone=${fullPhone}`}
                                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 ml-0.5"
                                  title="Abrir app de WhatsApp de tu dispositivo"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              ) : null;
                            })()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Plan Selector */}
                    <td className="p-3.5">
                      <select
                        value={client.planId || ""}
                        onChange={(e) => handlePlanChange(client, e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">Sin Plan (Clase suelta)</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.classesPerWeek}x sem)
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Custom Price Adjustment */}
                    <td className="p-3.5">
                      {!client.planId ? (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          — Sin arancel
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 dark:text-slate-100">
                              ${(client.customPrice !== undefined ? client.customPrice : (assignedPlan?.price || 0)).toLocaleString("es-AR")}
                            </span>
                            {client.customPrice === undefined && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                (base)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                              <input
                                type="checkbox"
                                checked={client.customPrice !== undefined}
                                onChange={(e) => handleToggleCustomPrice(client, e.target.checked)}
                                className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                              />
                              <span>Personalizar</span>
                            </label>

                            {client.customPrice !== undefined && (
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-bold">$</span>
                                <input
                                  type="number"
                                  step="500"
                                  value={client.customPrice}
                                  onChange={(e) => handleCustomPriceChange(client, Number(e.target.value))}
                                  className="w-20 px-1.5 py-0.5 text-xs font-black rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                                  placeholder="Arancel..."
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Weekly Shifts Usage Progress */}
                    <td className="p-3.5">
                      {client.planId ? (
                        <div className="space-y-1 max-w-[170px]">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span
                              className={
                                weeklyUsage.remaining === 0
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-indigo-600 dark:text-indigo-400"
                              }
                            >
                              {weeklyUsage.used} de {weeklyUsage.total} usados
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {weeklyUsage.remaining} disp.
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                weeklyUsage.remaining === 0
                                  ? "bg-rose-500"
                                  : "bg-indigo-600"
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (weeklyUsage.used / (weeklyUsage.total || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">
                          Clases individuales
                        </span>
                      )}
                    </td>

                    {/* Weekly Payment Status Toggle */}
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const currentMonday = new Date(now);
                            const day = currentMonday.getDay();
                            const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
                            currentMonday.setDate(diff);
                            const currentMondayStr = currentMonday.toISOString().split("T")[0];
                            const isPaid = Boolean(client.weeklyPayments && client.weeklyPayments[currentMondayStr]);
                            setPaymentToConfirm({
                              clientId: client.id,
                              clientName: client.name,
                              mondayStr: currentMondayStr,
                              currentlyPaid: isPaid,
                            });
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                            Boolean(
                              client.weeklyPayments &&
                              client.weeklyPayments[
                                (() => {
                                  const now = new Date();
                                  const currentMonday = new Date(now);
                                  const day = currentMonday.getDay();
                                  const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
                                  currentMonday.setDate(diff);
                                  return currentMonday.toISOString().split("T")[0];
                                })()
                              ]
                            )
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                          }`}
                          title="Toca para marcar o desmarcar el pago de esta semana"
                        >
                          {Boolean(
                            client.weeklyPayments &&
                            client.weeklyPayments[
                              (() => {
                                const now = new Date();
                                const currentMonday = new Date(now);
                                const day = currentMonday.getDay();
                                const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
                                currentMonday.setDate(diff);
                                return currentMonday.toISOString().split("T")[0];
                              })()
                            ]
                          ) ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>✓ Sem. Pagada</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                              <span>⏳ Sem. Pendiente</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenClientHistory && onOpenClientHistory(client)}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                        >
                          Ver todas las semanas
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Weekly Payment status toggle */}
      <ConfirmModal
        isOpen={!!paymentToConfirm}
        title={paymentToConfirm?.currentlyPaid ? "Desmarcar Pago de la Semana" : "Confirmar Cobro de la Semana"}
        message={
          paymentToConfirm?.currentlyPaid
            ? `¿Deseas marcar la semana actual de ${paymentToConfirm?.clientName} como PENDIENTE de pago?`
            : `¿Deseas registrar el cobro y marcar la semana actual de ${paymentToConfirm?.clientName} como PAGADA?`
        }
        confirmText={paymentToConfirm?.currentlyPaid ? "Sí, Marcar Pendiente" : "Sí, Marcar Pagada"}
        onConfirm={async () => {
          if (paymentToConfirm) {
            await toggleClientWeeklyPayment(paymentToConfirm.clientId, paymentToConfirm.mondayStr);
            setPaymentToConfirm(null);
          }
        }}
        onCancel={() => setPaymentToConfirm(null)}
      />
    </div>
  );
}
