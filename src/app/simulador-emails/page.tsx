"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { EmailSimulatorModal } from "@/components/modals/EmailSimulatorModal";
import { useData } from "@/context/DataContext";
import { Mail, ExternalLink, Key, Eye, Sparkles, CheckCircle } from "lucide-react";

export default function SimuladorEmailsPage() {
  const { emailLogs, settings } = useData();
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-rose-50">
              Simulador de Notificaciones por Correo & Cancelación con Enlace Único
            </h2>
            <p className="text-xs text-slate-600 dark:text-rose-200/80 mt-1 leading-relaxed">
              Cada vez que un alumno reserva un turno mediante el portal público, el sistema genera automáticamente un correo con los datos del turno y un <strong>enlace único de cancelación automática</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-rose-50">
          Historial de Correos Emitidos ({emailLogs.length})
        </h3>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-[#150716] text-slate-600 dark:text-rose-200/80 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Destinatario</th>
                <th className="p-3.5">Turno</th>
                <th className="p-3.5">Código Único</th>
                <th className="p-3.5">Fecha de Envío</th>
                <th className="p-3.5 text-right">Previsualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-200/40 dark:divide-rose-900/30">
              {emailLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors"
                >
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800 dark:text-rose-50">
                      {log.recipientName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-rose-300/70">
                      {log.recipientEmail}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="font-semibold text-slate-700 dark:text-rose-100">
                      {log.shiftTitle}
                    </div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-300 font-medium">
                      {log.shiftDate} • {log.shiftTime} hs
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-rose-950/60 text-slate-700 dark:text-rose-200 border border-rose-200/40 text-[11px] font-bold">
                      <Key className="w-3 h-3 text-rose-500" />
                      {log.cancellationCode}
                    </span>
                  </td>

                  <td className="p-3.5 text-slate-500 dark:text-rose-300/70 text-[11px]">
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
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Email HTML</span>
                      </button>

                      <Link
                        href={log.cancellationUrl}
                        target="_blank"
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/15"
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
