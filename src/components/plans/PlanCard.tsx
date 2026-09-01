"use client";

import React from "react";
import { Plan, Client } from "@/types";
import { Award, Users, Edit2, Trash2, CalendarCheck, CheckCircle2 } from "lucide-react";

interface PlanCardProps {
  plan: Plan;
  clients: Client[];
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
}

export function PlanCard({ plan, clients, onEdit, onDelete }: PlanCardProps) {
  const subscribedClients = clients.filter((c) => c.planId === plan.id);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600" />

      <div>
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shadow-2xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {plan.name}
              </h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>{plan.classesPerWeek} {plan.classesPerWeek === 1 ? "clase semanal" : "clases por semana"}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(plan)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Editar plan"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(plan.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Eliminar plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
            {plan.description}
          </p>
        )}

        {/* Pricing */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 mb-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Arancel base del plan
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ${plan.price.toLocaleString("es-AR")}
            </span>
            <span className="text-xs font-bold text-slate-500">/ plan</span>
          </div>
        </div>
      </div>

      {/* Footer: Subscribed Clients Count */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
          <Users className="w-4 h-4 text-indigo-500" />
          <span>{subscribedClients.length} {subscribedClients.length === 1 ? "clienta activa" : "clientas activas"}</span>
        </span>

        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Activo</span>
        </span>
      </div>
    </div>
  );
}
