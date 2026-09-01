"use client";

import React from "react";
import { Client } from "@/types";
import { User, Phone, Mail, History, Edit, MessageCircle } from "lucide-react";

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
      {/* Mobile & Tablet Card List (< lg) */}
      <div className="block lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
        {clients.map((client) => {
          const phoneDigits = (client.phone || "").replace(/\D/g, "");
          const fullPhone = phoneDigits
            ? phoneDigits.startsWith("54")
              ? phoneDigits
              : `549${phoneDigits}`
            : null;
          const waUrl = fullPhone ? `https://api.whatsapp.com/send?phone=${fullPhone}` : null;

          return (
            <div key={client.id} className="p-4 space-y-3">
              {/* Header: Student name & total bookings badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {client.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {client.phone || "Sin teléfono"}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                  {client.totalBookings} {client.totalBookings === 1 ? "clase" : "clases"}
                </span>
              </div>

              {/* Email & Last Booking */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1 text-[11px] truncate max-w-[200px]">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{client.email || "Sin email"}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Última: {client.lastBookingDate || "Sin clases"}
                  </span>
                </div>

                {client.healthNotes && (
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-xl">
                    <strong>Observación:</strong> {client.healthNotes}
                  </div>
                )}
              </div>

              {/* Actions with WhatsApp button */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {waUrl ? (
                  <a
                    href={waUrl}
                    target="whatsapp_tab"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                    title="Escribir por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                ) : <div />}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onViewHistory(client)}
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Historial</span>
                  </button>

                  <button
                    onClick={() => onEditClient(client)}
                    type="button"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold btn-primary flex items-center gap-1.5 shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Ficha</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= lg) */}
      <div className="hidden lg:block overflow-x-auto">
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
                  <div
                    onClick={() => onViewHistory(client)}
                    className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {client.name.charAt(0)}
                    </div>
                    <span className="underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2">{client.name}</span>
                  </div>
                </td>

                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{client.phone || "Sin teléfono"}</span>
                    </div>
                    {(() => {
                      const phoneDigits = (client.phone || "").replace(/\D/g, "");
                      const fullPhone = phoneDigits ? (phoneDigits.startsWith("54") ? phoneDigits : `549${phoneDigits}`) : null;
                      return fullPhone ? (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${fullPhone}`}
                          target="whatsapp_tab"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          title="Abrir chat de WhatsApp (misma pestaña)"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      ) : null;
                    })()}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[160px]">{client.email || "Sin email"}</span>
                  </div>
                </td>

                <td className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                      {client.totalBookings} {client.totalBookings === 1 ? "activa" : "activas"}
                    </span>
                    {(client.cancelledBookings || 0) > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50" title="Clases canceladas">
                        {client.cancelledBookings} canc.
                      </span>
                    )}
                  </div>
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
                    {(() => {
                      const phoneDigits = (client.phone || "").replace(/\D/g, "");
                      const fullPhone = phoneDigits ? (phoneDigits.startsWith("54") ? phoneDigits : `549${phoneDigits}`) : null;
                      return fullPhone ? (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${fullPhone}`}
                          target="whatsapp_tab"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          title="Escribir por WhatsApp (reutiliza pestaña)"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      ) : null;
                    })()}
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
