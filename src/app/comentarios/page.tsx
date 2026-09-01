"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { useData } from "@/context/DataContext";
import { FeedbackComment } from "@/types";
import {
  Send,
  Sparkles,
  Trash2,
  Clock,
  User,
  MessagesSquare,
} from "lucide-react";

export default function ComentariosPage() {
  const {
    feedbackComments,
    addFeedbackComment,
    deleteFeedbackComment,
    feedbackLoaded,
  } = useData();

  // Estados del chat
  const [currentUser, setCurrentUser] = useState<FeedbackComment["authorRole"]>("Dueña / Estudio");
  const [customName, setCustomName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ordenar mensajes cronológicamente (más antiguo primero, más nuevo abajo de todo)
  const sortedMessages = [...feedbackComments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Auto-scroll al final cuando llegan mensajes nuevos
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [feedbackComments.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    setSending(true);
    const author = customName.trim() || currentUser;

    try {
      await addFeedbackComment({
        authorName: author,
        authorRole: currentUser,
        category: "general",
        content: messageText.trim(),
        status: "pending",
      });
      setMessageText("");
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <AppShell>
      <Header />

      <div className="flex flex-col h-[calc(100vh-195px)] min-h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Banner Superior del Chat */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <MessagesSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Chat de Feedback y Mejoras del Prototipo
                </h2>
                {feedbackLoaded && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800">
                    {feedbackComments.length} mensajes
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Escribe aquí dudas, ideas de funciones o correcciones que quieras hacer en el prototipo
              </p>
            </div>
          </div>

          {/* Selector de Usuario Activo */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">Enviar como:</span>
            <select
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value as any)}
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-transparent cursor-pointer focus:outline-hidden"
            >
              <option value="Dueña / Estudio">Dueña / Estudio</option>
              <option value="Desarrollador (Julián)">Julián (Desarrollador)</option>
            </select>
          </div>
        </div>

        {/* Muro / Historial de Mensajes (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
          {!feedbackLoaded ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Cargando mensajes del chat...
              </p>
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <Sparkles className="w-10 h-10 text-indigo-400 opacity-40 animate-pulse" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Aún no hay mensajes en este chat
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Escribe abajo cualquier comentario o duda para empezar la conversación sobre el prototipo.
              </p>
            </div>
          ) : (
            sortedMessages.map((msg) => {
              const isJulian =
                msg.authorRole === "Desarrollador (Julián)" ||
                msg.authorName.toLowerCase().includes("julián") ||
                msg.authorName.toLowerCase().includes("julian");

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                    isJulian ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 text-white shadow-2xs ${
                      isJulian
                        ? "bg-indigo-600"
                        : "bg-purple-600"
                    }`}
                  >
                    {msg.authorName.charAt(0).toUpperCase()}
                  </div>

                  {/* Burbuja del Mensaje */}
                  <div className="space-y-1 group">
                    <div
                      className={`p-3.5 sm:p-4 rounded-3xl shadow-2xs relative ${
                        isJulian
                          ? "bg-indigo-600 text-white rounded-tr-xs"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs"
                      }`}
                    >
                      {/* Autor y Hora */}
                      <div
                        className={`flex items-center justify-between gap-3 text-[10px] font-bold mb-1 pb-1 border-b ${
                          isJulian
                            ? "text-indigo-200 border-indigo-500/40"
                            : "text-slate-400 border-slate-100 dark:border-slate-800"
                        }`}
                      >
                        <span className="truncate">{msg.authorName}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Texto del Mensaje */}
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>

                      {/* Botón Borrar (visible en hover) */}
                      <button
                        type="button"
                        onClick={() => deleteFeedbackComment(msg.id)}
                        className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-opacity ${
                          isJulian
                            ? "hover:bg-indigo-700 text-indigo-200"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                        }`}
                        title="Eliminar mensaje"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Fecha completa pequeña debajo */}
                    <div
                      className={`text-[9px] text-slate-400 px-1 ${
                        isJulian ? "text-right" : "text-left"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Barra Inferior para Escribir y Enviar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-end gap-2 shrink-0"
        >
          <div className="flex-1 min-w-0">
            <textarea
              rows={1}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Escribe un mensaje como ${currentUser}... (Enter para enviar)`}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 resize-none max-h-32"
            />
          </div>

          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="p-2.5 sm:px-5 sm:py-2.5 rounded-2xl btn-primary flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{sending ? "Enviando..." : "Enviar"}</span>
          </button>
        </form>
      </div>
    </AppShell>
  );
}
