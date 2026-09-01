"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Booking } from "@/types";
import { DisciplineBadge } from "@/components/common/DisciplineBadge";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Key,
  Copy,
  ExternalLink,
} from "lucide-react";

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onCancelBooking: (booking: Booking) => void;
}

export function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  onCancelBooking,
}: BookingDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !booking) return null;

  const cancellationUrl = `/cancelar/${booking.cancellationCode}`;
  const fullCancellationUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }${cancellationUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullCancellationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60   p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-modal my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Comprobante de Reserva
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {booking.shiftTitle}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Body */}
        <div className="space-y-4">
          {/* Class details */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <DisciplineBadge discipline={booking.discipline} size="sm" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                ${booking.price.toLocaleString("es-AR")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{booking.shiftDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{booking.shiftTime} hs</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{booking.room}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 col-span-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Prof: {booking.instructorName}</span>
              </div>
            </div>
          </div>

          {/* Client info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              Datos del Alumno
            </div>
            <div className="text-slate-700 dark:text-slate-300">{booking.clientName}</div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {booking.clientPhone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {booking.clientEmail}
              </span>
            </div>
            {booking.notes && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 italic pt-1 border-t border-slate-200 dark:border-slate-800">
                Observaciones: {booking.notes}
              </div>
            )}
          </div>

          {/* Cancellation Code & Link */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Enlace Único de Cancelación Automática
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                {booking.cancellationCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullCancellationUrl}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              />
              <button
                onClick={handleCopyLink}
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-indigo-600 flex items-center gap-1 hover:opacity-90"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? "Copiado" : "Copiar"}</span>
              </button>
              <Link
                href={cancellationUrl}
                target="_blank"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Abrir página de cancelación"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
          >
            Cerrar
          </button>

          {booking.status !== "cancelled" && (
            <button
              onClick={() => {
                onClose();
                onCancelBooking(booking);
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl transition-colors text-center"
            >
              Cancelar Turno de Alumno
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
