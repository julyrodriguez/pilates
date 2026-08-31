"use client";

import React from "react";
import { Client } from "@/types";
import { User, Phone, Mail, Calendar, HeartPulse, History, Edit } from "lucide-react";

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
        <User className="w-12 h-12 text-rose-300 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-bold text-slate-800 dark:text-rose-100">
          No hay alumnos registrados
        </h3>
        <p className="text-xs text-slate-500 dark:text-rose-300/70 mt-1">
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
            <tr className="border-b border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-[#150716] text-slate-600 dark:text-rose-200/80 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Alumno</th>
              <th className="p-3.5">Contacto</th>
              <th className="p-3.5 text-center">Clases Reservadas</th>
              <th className="p-3.5">Notas de Salud</th>
              <th className="p-3.5">Última Clase</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-200/40 dark:divide-rose-900/30">
            {clients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors"
              >
                <td className="p-3.5">
                  <div className="font-bold text-slate-800 dark:text-rose-50 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
                      {client.name.charAt(0)}
                    </div>
                    <span>{client.name}</span>
                  </div>
                </td>

                <td className="p-3.5">
                  <div className="text-slate-600 dark:text-rose-200 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-rose-400" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="text-slate-500 dark:text-rose-300/70 text-[11px] flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-rose-400" />
                    <span className="truncate max-w-[160px]">{client.email}</span>
                  </div>
                </td>

                <td className="p-3.5 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
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

                <td className="p-3.5 text-slate-600 dark:text-rose-200">
                  {client.lastBookingDate || "N/A"}
                </td>

                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewHistory(client)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-rose-300 dark:hover:text-rose-50 hover:bg-rose-100/60 dark:hover:bg-rose-900/30"
                      title="Ver historial de reservas"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditClient(client)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
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
