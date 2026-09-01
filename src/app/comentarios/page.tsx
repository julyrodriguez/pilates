"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { FeedbackComment } from "@/types";
import {
  MessageSquare,
  Sparkles,
  Send,
  AlertTriangle,
  HelpCircle,
  MessageCircle,
  Clock,
  Trash2,
  CornerDownRight,
  Filter,
} from "lucide-react";

const CATEGORIES = [
  { id: "idea", label: "Idea / Propuesta", icon: Sparkles, color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" },
  { id: "error", label: "Ajuste / Error", icon: AlertTriangle, color: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800" },
  { id: "duda", label: "Duda / Consulta", icon: HelpCircle, color: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  { id: "general", label: "Comentario General", icon: MessageCircle, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
] as const;

const ROLES = [
  { id: "Dueña / Estudio", label: "Dueña / Estudio", badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  { id: "Desarrollador (Julián)", label: "Desarrollador (Julián)", badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" },
  { id: "Profesor / Staff", label: "Profesor / Staff", badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  { id: "Otro", label: "Otro", badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
] as const;

export default function FeedbackPage() {
  const {
    feedbackComments,
    addFeedbackComment,
    deleteFeedbackComment,
    updateFeedbackCommentStatus,
    replyFeedbackComment,
    showToast,
  } = useData();

  // Form State
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState<FeedbackComment["authorRole"]>("Dueña / Estudio");
  const [category, setCategory] = useState<FeedbackComment["category"]>("idea");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter State
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Reply Input State per comment
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthorName, setReplyAuthorName] = useState("Julián (Desarrollador)");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const finalAuthorName = authorName.trim() || authorRole;
      await addFeedbackComment({
        authorName: finalAuthorName,
        authorRole,
        category,
        content: content.trim(),
        status: "pending",
      });

      setContent("");
      showToast("¡Comentario publicado con éxito!", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al publicar el comentario", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    try {
      await replyFeedbackComment(commentId, replyText.trim(), replyAuthorName.trim() || "Desarrollador");
      setReplyingToId(null);
      setReplyText("");
      showToast("Respuesta enviada", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al responder", "error");
    }
  };

  const filteredComments = feedbackComments.filter((c) => {
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    if (filterStatus !== "all" && (c.status || "pending") !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Banner de Bienvenida y Propósito */}
      <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Feedback del Prototipo</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Canal de Comunicación y Mejoras
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-medium">
            Usa este muro para anotar sugerencias de nuevas funciones, reportar errores o comportamientos a corregir, y resolver dudas. Todo queda guardado para coordinar el avance del proyecto.
          </p>
        </div>
      </div>

      {/* Formulario para publicar nuevo comentario */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Dejar un Nuevo Comentario o Sugerencia</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Rol de quien escribe */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                ¿Quién escribe?
              </label>
              <select
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre opcional */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tu Nombre (Opcional)
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ej. Julián, Laura..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Tipo de Comentario
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-400/40"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Mensaje o Detalle
            </label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe aquí tu propuesta, duda o reporte detallado..."
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Publicando..." : "Publicar Comentario"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Listado de comentarios */}
      <div className="space-y-4">
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Muro de Comentarios ({filteredComments.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">Todas las Categorías</option>
              <option value="idea">💡 Ideas / Mejoras</option>
              <option value="error">⚠️ Ajustes / Errores</option>
              <option value="duda">❓ Dudas</option>
              <option value="general">💬 Generales</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">Todos los Estados</option>
              <option value="pending">⏳ Pendiente</option>
              <option value="in_progress">🔄 En Revisión</option>
              <option value="resolved">✅ Resuelto</option>
            </select>
          </div>
        </div>

        {/* Feed de Comentarios */}
        {filteredComments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-indigo-500" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No hay comentarios en este filtro
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sé el primero en dejar una sugerencia o consulta sobre el prototipo de la app.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredComments.map((comment) => {
              const catObj = CATEGORIES.find((c) => c.id === comment.category) || CATEGORIES[3];
              const roleObj = ROLES.find((r) => r.id === comment.authorRole) || ROLES[3];
              const CatIcon = catObj.icon;
              const dateFormatted = new Date(comment.createdAt).toLocaleString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={comment.id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
                    comment.status === "resolved"
                      ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* Header del comentario */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {comment.authorName}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleObj.badgeColor}`}>
                            {comment.authorRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{dateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {/* Badge de Categoría */}
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 ${catObj.color}`}>
                        <CatIcon className="w-3 h-3" />
                        <span>{catObj.label}</span>
                      </span>

                      {/* Selector de Estado */}
                      <select
                        value={comment.status || "pending"}
                        onChange={(e) => updateFeedbackCommentStatus(comment.id, e.target.value as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          comment.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200"
                            : comment.status === "in_progress"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200"
                        }`}
                      >
                        <option value="pending">⏳ Pendiente</option>
                        <option value="in_progress">🔄 En revisión</option>
                        <option value="resolved">✅ Resuelto</option>
                      </select>

                      {/* Botón eliminar */}
                      <button
                        type="button"
                        onClick={() => deleteFeedbackComment(comment.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Eliminar comentario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo del comentario */}
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Respuesta existente */}
                  {comment.reply && (
                    <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5 ml-3 sm:ml-6">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Respuesta de {comment.replyAuthor || "Desarrollador"}:</span>
                        </span>
                        {comment.replyAt && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.replyAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {comment.reply}
                      </p>
                    </div>
                  )}

                  {/* Formulario para agregar o editar respuesta */}
                  {replyingToId === comment.id ? (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 ml-3 sm:ml-6">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Escribir respuesta:</span>
                        <select
                          value={replyAuthorName}
                          onChange={(e) => setReplyAuthorName(e.target.value)}
                          className="px-2 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                          <option value="Julián (Desarrollador)">Julián (Desarrollador)</option>
                          <option value="Dueña / Estudio">Dueña / Estudio</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyText("");
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReply(comment.id)}
                          disabled={!replyText.trim()}
                          className="px-4 py-1.5 text-xs font-bold btn-primary rounded-lg shadow-xs"
                        >
                          Enviar Respuesta
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(comment.id);
                          setReplyText(comment.reply || "");
                        }}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>{comment.reply ? "Editar respuesta" : "Responder"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
