"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { ClientHistoryModal } from "@/components/clients/ClientHistoryModal";
import { useData } from "@/context/DataContext";
import { Client } from "@/types";
import { Search, UserPlus } from "lucide-react";

export default function ClientesPage() {
  const { clients } = useData();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "with_plan" | "no_plan" | "with_cancellations">("all");
  const [clientFormModalOpen, setClientFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);

  const filteredClients = clients.filter((c) => {
    // Búsqueda por texto
    if (search) {
      const q = search.toLowerCase();
      const matches =
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Filtros por tipo
    if (filterType === "with_plan" && !c.planId) return false;
    if (filterType === "no_plan" && c.planId) return false;
    if (filterType === "with_cancellations" && (!c.cancelledBookings || c.cancelledBookings === 0)) return false;

    return true;
  });

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setClientFormModalOpen(true);
  };

  const handleViewHistory = (client: Client) => {
    setSelectedClientForHistory(client);
    setHistoryModalOpen(true);
  };

  return (
    <AppShell>
      <Header />

      {/* Search & Actions Bar */}
      <div className="glass-card p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alumno por nombre, teléfono o email..."
            className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setClientFormModalOpen(true);
          }}
          type="button"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Alumno</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === "all"
                ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Todos ({clients.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("with_plan")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === "with_plan"
                ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Con Plan ({clients.filter((c) => !!c.planId).length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("no_plan")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === "no_plan"
                ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Particulares / Sin Plan ({clients.filter((c) => !c.planId).length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("with_cancellations")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === "with_cancellations"
                ? "bg-rose-500 text-white shadow-2xs"
                : "text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            Con Cancelaciones ({clients.filter((c) => (c.cancelledBookings || 0) > 0).length})
          </button>
        </div>

        <span className="text-xs font-bold text-slate-400">
          {filteredClients.length} {filteredClients.length === 1 ? "alumno" : "alumnos"}
        </span>
      </div>

      <ClientTable
        clients={filteredClients}
        onViewHistory={handleViewHistory}
        onEditClient={handleEdit}
      />

      {/* Modals */}
      <ClientFormModal
        isOpen={clientFormModalOpen}
        onClose={() => setClientFormModalOpen(false)}
        clientToEdit={editingClient}
      />

      <ClientHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        client={selectedClientForHistory}
      />
    </AppShell>
  );
}
