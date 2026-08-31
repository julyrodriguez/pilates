"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { EmailSimulatorModal } from "@/components/modals/EmailSimulatorModal";
import { useData } from "@/context/DataContext";
import { Mail, ExternalLink, Key, Eye } from "lucide-react";

export default function SimuladorEmailsPage() {
  const { emailLogs } = useData();
  const [selectedEmailCode, setSelectedEmailCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenEmail = (code: string) => {
    setSelectedEmailCode(code);
    setModalOpen(true);
  };

  return (
    <AppShell>
      <Header />

      <div className="glass-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Simulador de Notificaciones por Correo & Cancelación con Enlace Único
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Cada vez que un alumno reserva un turno mediante el portal público, el sistema genera automáticamente un correo con los datos del turno y un <strong>enlace único de cancelación automática</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Historial de Correos Emitidos ({emailLogs.length})
        </h3>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Destinatario</th>
                <th className="p-3.5">Turno</th>
                <th className="p-3.5">Código Único</th>
                <th className="p-3.5">Fecha de Envío</th>
                <th className="p-3.5 text-right">Previsualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:border-slate-800/80">
              {emailLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {log.recipientName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {log.recipientEmail}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {log.shiftTitle}
                    </div>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      {log.shiftDate} • {log.shiftTime} hs
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                      <Key className="w-3 h-3 text-slate-400" />
                      {log.cancellationCode}
                    </span>
                  </td>

                  <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(log.sentAt).toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEmail(log.cancellationCode)}
                        type="button"
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ver Email HTML</span>
                      </button>

                      <Link
                        href={log.cancellationUrl}
                        target="_blank"
                        className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        title="Abrir enlace de cancelación directa"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EmailSimulatorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedEmailCode={selectedEmailCode}
      />
    </AppShell>
  );
}
