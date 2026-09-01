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
  const [clientFormModalOpen, setClientFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase())
  );

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

      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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
          <span>+ Nuevo Alumno</span>
        </button>
      </div>

      <div className="mb-4">
        <span className="text-xs font-bold text-slate-500 dark:text-rose-300/70">
          Mostrando {filteredClients.length} alumnos
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
