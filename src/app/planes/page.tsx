"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useData } from "@/context/DataContext";
import { PlanCard } from "@/components/plans/PlanCard";
import { PlanFormModal } from "@/components/plans/PlanFormModal";
import { ClientPlanManagerTable } from "@/components/plans/ClientPlanManagerTable";
import { ClientHistoryModal } from "@/components/clients/ClientHistoryModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Plan, Client } from "@/types";
import { Award, Plus, CalendarCheck, Users, DollarSign } from "lucide-react";

export default function PlanesPage() {
  const { plans, clients, deletePlan } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);

  const handleCreateNew = () => {
    setEditingPlan(null);
    setModalOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const handleOpenClientHistory = (client: Client) => {
    setSelectedClientForHistory(client);
    setHistoryModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletePlanId) {
      await deletePlan(deletePlanId);
      setDeletePlanId(null);
    }
  };

  const totalClientsWithPlan = clients.filter((c) => !!c.planId).length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Banner & Stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span>Planes y Membresías Semanales</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configura planes de 1x, 2x, 3x por semana, ajusta aranceles por clienta y controla los pagos semana a semana
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center gap-1.5 self-start md:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Plan</span>
          </button>
        </div>

        {/* Plans Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Planes Disponibles ({plans.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                clients={clients}
                onEdit={handleEditPlan}
                onDelete={(id) => setDeletePlanId(id)}
              />
            ))}
          </div>
        </div>

        {/* Client Plan Management & Payment Tracking Table */}
        <ClientPlanManagerTable
          clients={clients}
          plans={plans}
          onOpenClientHistory={handleOpenClientHistory}
        />
      </div>

      {/* Plan Form Modal */}
      <PlanFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        planToEdit={editingPlan}
      />

      {/* Client History & Weekly Payments Modal */}
      <ClientHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        client={selectedClientForHistory}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletePlanId}
        title="Eliminar Plan"
        message="¿Estás seguro de eliminar este plan? Las clientas asociadas mantendrán sus datos pero quedarán sin plan asignado."
        isDestructive={true}
        confirmText="Eliminar Plan"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletePlanId(null)}
      />
    </AppShell>
  );
}
