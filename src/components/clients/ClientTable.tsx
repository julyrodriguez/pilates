"use client";

import React from "react";
import { Client } from "@/types";
import { User, Phone, Mail, History, Edit } from "lucide-react";

interface ClientTableProps {
  clients: Client[];
  onViewHistory: (client: Client) => void;
  onEditClient: (client: Client) => void;
}

export function ClientTable({
  clients,
  onViewHistory,
  onEditClient,
}: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <User className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No hay alumnos registrados
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Los alumnos se registrarán automáticamente al reservar o puedes añadirlos manualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Alumno</th>
              <th className="p-3.5">Contacto</th>
              <th className="p-3.5 text-center">Clases Reservadas</th>
              <th className="p-3.5">Notas de Salud</th>
              <th className="p-3.5">Última Clase</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:border-slate-800/80">
            {clients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="p-3.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                      {client.name.charAt(0)}
                    </div>
                    <span>{client.name}</span>
                  </div>
                </td>

                <td className="p-3.5">
                  <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[160px]">{client.email}</span>
                  </div>
                </td>

                <td className="p-3.5 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {client.totalBookings}
                  </span>
                </td>

                <td className="p-3.5">
                  {client.healthNotes ? (
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 inline-block max-w-[200px] truncate">
                      {client.healthNotes}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Sin observaciones</span>
                  )}
                </td>

                <td className="p-3.5 text-slate-600 dark:text-slate-400">
                  {client.lastBookingDate || "N/A"}
                </td>

                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewHistory(client)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Ver historial de reservas"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditClient(client)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Editar ficha"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
