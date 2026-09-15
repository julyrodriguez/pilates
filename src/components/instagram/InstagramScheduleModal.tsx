"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useData } from "@/context/DataContext";
import { Shift, Booking } from "@/types";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  X,
  Download,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Users,
  Eye,
  Layers,
  Share2,
  RefreshCw,
  Palette,
  Ratio,
  Info,
} from "lucide-react";

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface InstagramScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AspectRatio = "story" | "portrait" | "square";
type ThemeStyle = "dark" | "pastel" | "instagram" | "clean";

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const MONTH_NAMES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const DAY_NAMES_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_NAMES_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getWeekMonday(offsetWeeks: number = 0): Date {
  const now = new Date();
  const day = now.getDay(); // 0: Dom, 1: Lun, ..., 6: Sab
  const diffToMonday = day === 0 ? 1 : 1 - day;
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + diffToMonday + offsetWeeks * 7,
    12,
    0,
    0
  );
}

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function InstagramScheduleModal({ isOpen, onClose }: InstagramScheduleModalProps) {
  const { shifts: fallbackShifts, disciplines } = useData();
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0: Esta semana, 1: Próxima semana, 2: En 2 semanas
  const [showCapacity, setShowCapacity] = useState<boolean>(true);
  const [theme, setTheme] = useState<ThemeStyle>("dark");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("story");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calcular las fechas de la semana seleccionada (Lunes a Sábado)
  const weekDays = useMemo(() => {
    const monday = getWeekMonday(weekOffset);
    const list: Array<{
      dateStr: string;
      dayName: string;
      dayNameShort: string;
      dayNumber: number;
      monthNameShort: string;
      monthName: string;
    }> = [];

    for (let i = 0; i < 6; i++) {
      const d = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + i,
        12,
        0,
        0
      );
      list.push({
        dateStr: formatDateYMD(d),
        dayName: DAY_NAMES_ES[i],
        dayNameShort: DAY_NAMES_SHORT[i],
        dayNumber: d.getDate(),
        monthNameShort: MONTH_NAMES_SHORT[d.getMonth()],
        monthName: MONTH_NAMES_ES[d.getMonth()],
      });
    }

    return list;
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    if (weekDays.length < 6) return "";
    const first = weekDays[0];
    const last = weekDays[5];
    if (first.monthName === last.monthName) {
      return `${first.dayNumber} al ${last.dayNumber} de ${first.monthName}`;
    }
    return `${first.dayNumber} ${first.monthNameShort} - ${last.dayNumber} ${last.monthNameShort}`;
  }, [weekDays]);

  // Cargar turnos y reservas de la semana seleccionada desde Firestore
  const loadWeekData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);

    const startDate = weekDays[0]?.dateStr;
    const endDate = weekDays[5]?.dateStr;

    if (!startDate || !endDate) {
      setIsLoading(false);
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      const localShifts = fallbackShifts.filter(
        (s) => s.date >= startDate && s.date <= endDate
      );
      setShifts(localShifts);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Obtener turnos de la semana
      const shiftsSnap = await getDocs(
        query(
          collection(db, "pilates_shifts"),
          where("date", ">=", startDate),
          where("date", "<=", endDate)
        )
      );

      const loadedShifts = shiftsSnap.docs
        .map((d) => d.data() as Shift)
        .filter((s) => s && s.id && !s.id.startsWith("_"));

      // 2. Obtener reservas confirmadas de la semana para asegurar conteo exacto
      const bookingsSnap = await getDocs(
        query(
          collection(db, "pilates_bookings"),
          where("shiftDate", ">=", startDate),
          where("shiftDate", "<=", endDate)
        )
      );

      const loadedBookings = bookingsSnap.docs
        .map((d) => d.data() as Booking)
        .filter((b) => b && b.status === "confirmed" && b.shiftId !== "deleted");

      setShifts(loadedShifts);
      setBookings(loadedBookings);
    } catch (err) {
      console.warn("Error loading week data for Instagram export:", err);
      setShifts(fallbackShifts.filter((s) => s.date >= startDate && s.date <= endDate));
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, weekDays, fallbackShifts]);

  useEffect(() => {
    if (isOpen) {
      loadWeekData();
    }
  }, [isOpen, loadWeekData]);

  // Organizar turnos por cada día de la semana
  const daySchedule = useMemo(() => {
    return weekDays.map((day) => {
      let dayShifts = shifts.filter((s) => s.date === day.dateStr);

      if (selectedDiscipline !== "all") {
        dayShifts = dayShifts.filter((s) => s.discipline === selectedDiscipline);
      }

      // Ordenar cronológicamente
      dayShifts.sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Calcular cupos con reservas activas
      const items = dayShifts.map((s) => {
        const activeBookings = bookings.filter((b) => b.shiftId === s.id).length;
        const booked = Math.max(s.bookedCount || 0, activeBookings);
        const freeSpots = Math.max(0, s.capacity - booked);
        const isFull = freeSpots <= 0;

        return {
          shift: s,
          booked,
          freeSpots,
          isFull,
        };
      });

      return {
        ...day,
        items,
      };
    });
  }, [weekDays, shifts, bookings, selectedDiscipline]);

  // Dibujar en el Canvas de alta resolución para Instagram
  const drawInstagramImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dimensiones según el aspect ratio
    let width = 1080;
    let height = 1920; // Story 9:16

    if (aspectRatio === "portrait") {
      height = 1350; // Post 4:5
    } else if (aspectRatio === "square") {
      height = 1080; // Post 1:1
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Paleta de colores según tema
    let bgGradientStart = "#090d16";
    let bgGradientEnd = "#131b2e";
    let cardBg = "rgba(255, 255, 255, 0.05)";
    let cardBorder = "rgba(255, 255, 255, 0.12)";
    let textPrimary = "#FFFFFF";
    let textSecondary = "#94A3B8";
    let textAccent = "#818CF8";
    let pillBg = "#4F46E5";
    let pillText = "#FFFFFF";
    let spotBg = "rgba(16, 185, 129, 0.15)";
    let spotText = "#34D399";
    let fullBg = "rgba(239, 68, 68, 0.15)";
    let fullText = "#F87171";

    if (theme === "pastel") {
      bgGradientStart = "#FDF8F6";
      bgGradientEnd = "#F3E8FF";
      cardBg = "rgba(255, 255, 255, 0.85)";
      cardBorder = "rgba(147, 51, 234, 0.15)";
      textPrimary = "#1E1B4B";
      textSecondary = "#6B7280";
      textAccent = "#7C3AED";
      pillBg = "#8B5CF6";
      pillText = "#FFFFFF";
      spotBg = "#DCFCE7";
      spotText = "#15803D";
      fullBg = "#FEE2E2";
      fullText = "#B91C1C";
    } else if (theme === "instagram") {
      bgGradientStart = "#405DE6";
      bgGradientEnd = "#C13584";
      cardBg = "rgba(0, 0, 0, 0.28)";
      cardBorder = "rgba(255, 255, 255, 0.2)";
      textPrimary = "#FFFFFF";
      textSecondary = "#F1F5F9";
      textAccent = "#FDE047";
      pillBg = "#E1306C";
      pillText = "#FFFFFF";
      spotBg = "rgba(34, 197, 94, 0.25)";
      spotText = "#86EFAC";
      fullBg = "rgba(239, 68, 68, 0.3)";
      fullText = "#FCA5A5";
    } else if (theme === "clean") {
      bgGradientStart = "#FFFFFF";
      bgGradientEnd = "#F8FAFC";
      cardBg = "#FFFFFF";
      cardBorder = "#E2E8F0";
      textPrimary = "#0F172A";
      textSecondary = "#64748B";
      textAccent = "#2563EB";
      pillBg = "#0F172A";
      pillText = "#FFFFFF";
      spotBg = "#F0FDF4";
      spotText = "#16A34A";
      fullBg = "#FEF2F2";
      fullText = "#DC2626";
    }

    // 1. Fondo Degradado
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, bgGradientStart);
    bgGrad.addColorStop(1, bgGradientEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decoración sutil de fondo (círculos difusos / brillo)
    if (theme === "dark" || theme === "instagram") {
      const glowGrad = ctx.createRadialGradient(width / 2, 200, 10, width / 2, 200, 600);
      glowGrad.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      glowGrad.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. HEADER
    const headerTop = aspectRatio === "story" ? 110 : 70;

    // Logo / Nombre del Estudio
    ctx.textAlign = "center";
    ctx.font = "bold 38px 'Plus Jakarta Sans', sans-serif, -apple-system";
    ctx.fillStyle = textAccent;
    ctx.letterSpacing = "6px";
    ctx.fillText("✦  SELENE PILATES  ✦", width / 2, headerTop);

    // Título Principal
    ctx.font = "900 52px 'Plus Jakarta Sans', sans-serif, -apple-system";
    ctx.fillStyle = textPrimary;
    ctx.letterSpacing = "1px";
    ctx.fillText("CRONOGRAMA SEMANAL", width / 2, headerTop + 65);

    // Rango de fechas
    ctx.font = "600 28px 'Plus Jakarta Sans', sans-serif, -apple-system";
    ctx.fillStyle = textSecondary;
    ctx.fillText(`Semana del ${weekLabel}`, width / 2, headerTop + 110);

    // Línea separadora decorativa
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, headerTop + 135);
    ctx.lineTo(width / 2 + 200, headerTop + 135);
    ctx.stroke();

    // 3. GRILLA DE DÍAS (2 columnas x 3 filas)
    const gridTop = headerTop + 165;
    const paddingX = 60;
    const colGap = 24;
    const rowGap = aspectRatio === "story" ? 22 : 16;
    const colWidth = (width - paddingX * 2 - colGap) / 2;

    const availableHeight = height - gridTop - (aspectRatio === "story" ? 170 : 120);
    const cardHeight = (availableHeight - rowGap * 2) / 3;

    daySchedule.forEach((day, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cardX = paddingX + col * (colWidth + colGap);
      const cardY = gridTop + row * (cardHeight + rowGap);

      // Tarjeta del día
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, colWidth, cardHeight, 22);
      ctx.fill();
      ctx.stroke();

      // Header del Día (Pill badge)
      const pillW = 180;
      const pillH = 38;
      const pillX = cardX + 16;
      const pillY = cardY + 16;

      ctx.fillStyle = pillBg;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 12);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif, -apple-system";
      ctx.fillStyle = pillText;
      ctx.fillText(
        `${day.dayName.toUpperCase()} ${day.dayNumber}`,
        pillX + 16,
        pillY + 25
      );

      // Subtexto de mes
      ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif, -apple-system";
      ctx.fillStyle = textSecondary;
      ctx.textAlign = "right";
      ctx.fillText(day.monthNameShort, cardX + colWidth - 20, pillY + 25);

      // Lista de Turnos
      const itemsStartY = pillY + 54;
      const maxVisibleItems = aspectRatio === "story" ? 4 : 3;
      const visibleItems = day.items.slice(0, maxVisibleItems);
      const itemRowHeight = (cardHeight - 75) / Math.max(visibleItems.length, 1);

      if (visibleItems.length === 0) {
        ctx.textAlign = "center";
        ctx.font = "italic 18px 'Plus Jakarta Sans', sans-serif, -apple-system";
        ctx.fillStyle = textSecondary;
        ctx.fillText(
          "Sin clases este día",
          cardX + colWidth / 2,
          cardY + cardHeight / 2 + 10
        );
      } else {
        visibleItems.forEach((item, itemIdx) => {
          const itemY = itemsStartY + itemIdx * itemRowHeight;

          // Separador sutil entre clases
          if (itemIdx > 0) {
            ctx.strokeStyle = cardBorder;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cardX + 16, itemY - 6);
            ctx.lineTo(cardX + colWidth - 16, itemY - 6);
            ctx.stroke();
          }

          // Horario
          ctx.textAlign = "left";
          ctx.font = "900 20px 'Plus Jakarta Sans', sans-serif, -apple-system";
          ctx.fillStyle = textPrimary;
          ctx.fillText(`${item.shift.startTime} hs`, cardX + 20, itemY + 18);

          // Nombre de Disciplina y Profesora
          ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif, -apple-system";
          ctx.fillStyle = textSecondary;
          const classTitle = `${item.shift.title} • Prof. ${item.shift.instructorName}`;
          // Truncar si es muy largo
          const maxTitleWidth = showCapacity ? colWidth - 200 : colWidth - 120;
          let truncatedTitle = classTitle;
          if (ctx.measureText(truncatedTitle).width > maxTitleWidth) {
            while (
              ctx.measureText(truncatedTitle + "...").width > maxTitleWidth &&
              truncatedTitle.length > 5
            ) {
              truncatedTitle = truncatedTitle.slice(0, -1);
            }
            truncatedTitle += "...";
          }
          ctx.fillText(truncatedTitle, cardX + 115, itemY + 18);

          // Badge de Cupos (SOLO SI SHOW_CAPACITY ESTÁ ACTIVADO)
          if (showCapacity) {
            const badgeW = item.isFull ? 105 : 110;
            const badgeH = 28;
            const badgeX = cardX + colWidth - badgeW - 16;
            const badgeY = itemY + 1;

            ctx.fillStyle = item.isFull ? fullBg : spotBg;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
            ctx.fill();

            ctx.textAlign = "center";
            ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif, -apple-system";
            ctx.fillStyle = item.isFull ? fullText : spotText;
            const badgeText = item.isFull
              ? "COMPLETO"
              : item.freeSpots === 1
              ? "1 LUGAR"
              : `${item.freeSpots} LUGARES`;
            ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 19);
          }
        });

        // Indicador si hay más clases
        if (day.items.length > maxVisibleItems) {
          const extra = day.items.length - maxVisibleItems;
          ctx.textAlign = "right";
          ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif, -apple-system";
          ctx.fillStyle = textAccent;
          ctx.fillText(`+${extra} más`, cardX + colWidth - 20, cardY + cardHeight - 12);
        }
      }
    });

    // 4. FOOTER
    const footerY = height - (aspectRatio === "story" ? 85 : 55);

    ctx.textAlign = "center";
    ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif, -apple-system";
    ctx.fillStyle = textPrimary;
    ctx.fillText("📍 Cesar Diaz 3031, CABA  •  📱 @selenepilates", width / 2, footerY);

    ctx.font = "600 18px 'Plus Jakarta Sans', sans-serif, -apple-system";
    ctx.fillStyle = textAccent;
    ctx.fillText("Reserva tu lugar online en selenepilates.com", width / 2, footerY + 30);
  }, [aspectRatio, theme, weekLabel, daySchedule, showCapacity]);

  // Redibujar cada vez que cambien opciones o datos
  useEffect(() => {
    if (isOpen && !isLoading) {
      // Pequeño timeout para asegurar que el canvas esté montado
      const t = setTimeout(() => {
        drawInstagramImage();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, isLoading, drawInstagramImage]);

  // Descargar imagen
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeLabel = weekLabel.toLowerCase().replace(/[^a-z0-9]/g, "-");
      link.download = `cronograma-selene-pilates-${safeLabel}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error downloading image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar imagen al portapapeles
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        // ClipboardItem API
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }, "image/png");
    } catch (err) {
      console.warn("Clipboard copy not supported:", err);
      // Fallback a descarga
      handleDownload();
    }
  };

  // Compartir en Web Share API (en móviles abre Instagram o WhatsApp directamente)
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `cronograma-${weekLabel}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Cronograma Selene Pilates",
            text: `Cronograma de clases para la semana del ${weekLabel}`,
            files: [file],
          });
        } else {
          handleDownload();
        }
      }, "image/png");
    } catch (err) {
      console.warn("Share API error:", err);
      handleDownload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl animate-modal my-6 max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <InstagramIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Generador de Imagen para Instagram
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900/40">
                  Historias / Feed
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Genera el cronograma semanal en imagen HD listo para compartir
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls & Canvas Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (Left) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Selector de Semana (Max 2 semanas hacia adelante) */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>1. Selecciona la Semana:</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { offset: 0, label: "Esta Semana", desc: "Actual" },
                  { offset: 1, label: "Próxima", desc: "+1 semana" },
                  { offset: 2, label: "En 2 Semanas", desc: "+2 semanas" },
                ].map((w) => {
                  const isSelected = weekOffset === w.offset;
                  return (
                    <button
                      key={w.offset}
                      type="button"
                      onClick={() => setWeekOffset(w.offset)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                      }`}
                    >
                      <span className="text-xs font-bold block">{w.label}</span>
                      <span className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                        {w.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-800 dark:text-indigo-300 font-semibold flex items-center justify-between">
                <span>Rango: <strong>{weekLabel}</strong></span>
                <button
                  type="button"
                  onClick={loadWeekData}
                  className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                  title="Recargar datos de Firestore"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* 2. Checkbox: Mostrar o No Capacidad Disponible */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCapacity}
                  onChange={(e) => setShowCapacity(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Mostrar información de cupos disponibles
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {showCapacity
                      ? "Incluye badges de 'X lugares libres' o 'Completo' en cada clase."
                      : "Solo muestra el horario y la profesora (ideal para cronograma fijo)."}
                  </span>
                </div>
              </label>
            </div>

            {/* 3. Estilo Visual y Paleta */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Estilo Visual de la Imagen:</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "dark", label: "Oscuro Elegante", bg: "bg-slate-900 text-white" },
                  { id: "pastel", label: "Pastel Studio", bg: "bg-purple-100 text-purple-900 border-purple-300" },
                  { id: "instagram", label: "Instagram Vibe", bg: "bg-gradient-to-r from-pink-500 to-purple-600 text-white" },
                  { id: "clean", label: "Minimal Blanco", bg: "bg-white text-slate-900 border-slate-300" },
                ].map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id as ThemeStyle)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-indigo-500 border-indigo-500 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100"
                      } ${t.bg}`}
                    >
                      <span>{t.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Formato / Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Ratio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Formato de Imagen:</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "story", label: "Historia (9:16)", desc: "1080x1920" },
                  { id: "portrait", label: "Post (4:5)", desc: "1080x1350" },
                  { id: "square", label: "Cuadrado (1:1)", desc: "1080x1080" },
                ].map((r) => {
                  const isSelected = aspectRatio === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAspectRatio(r.id as AspectRatio)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-[11px] font-bold block">{r.label}</span>
                      <span className="text-[9px] text-slate-400">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Filtro Opcional de Disciplina */}
            {disciplines.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Filtrar por Disciplina (Opcional):
                </label>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Todas las Disciplinas (Completo)</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.name}>
                      Solo {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Canvas Live Preview Column (Right) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa en Tiempo Real:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Alta resolución HD (1080px)
              </span>
            </div>

            {/* Canvas Container with Scroll/Scale Preview */}
            <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center aspect-[9/16] max-h-[520px]">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-slate-50 dark:bg-slate-950/60">
          <div className="text-xs text-slate-500 flex items-center gap-2 text-center sm:text-left">
            <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
            <span>Lista para descargar y publicar directo en Instagram Stories o Feed.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyImage}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">¡Imagen Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copiar Imagen</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="sm:flex hidden px-3 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Compartir"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Imagen PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
