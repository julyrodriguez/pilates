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
  Eye,
  Share2,
  RefreshCw,
  Palette,
  Ratio,
  Upload,
  Sliders,
  CheckSquare,
  Square,
  Clock,
  User,
  Type,
  LayoutGrid,
  ListFilter,
  Layers,
} from "lucide-react";

interface InstagramScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AspectRatio = "story" | "portrait" | "square";
type ThemeStyle = "dark_glass" | "warm_studio" | "instagram_gradient" | "pastel_glass" | "clean_white";
type LayoutMode = "cloud_days" | "matrix";

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const MONTH_NAMES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const DAY_NAMES_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_NAMES_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

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

// Extrae exclusivamente el primer nombre de la profesora (sin apellido ni prefijo)
function getFirstName(fullName?: string): string {
  if (!fullName) return "";
  const cleaned = fullName.trim().replace(/^prof\.?\s+/i, "");
  const first = cleaned.split(/\s+/)[0] || "";
  return first;
}

// Formato de hora en punto simplificado (ej. 14:00 -> 14hs, 09:00 -> 9hs)
function formatHourShort(timeStr: string): string {
  const [rawH, rawM] = timeStr.split(":");
  const hourNum = parseInt(rawH || "0", 10);
  return (rawM === "00" || !rawM) ? `${hourNum}hs` : `${timeStr}hs`;
}

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

export function InstagramScheduleModal({ isOpen, onClose }: InstagramScheduleModalProps) {
  const { shifts: fallbackShifts, disciplines } = useData();
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0: Esta semana, 1: Próxima semana, 2: En 2 semanas
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("cloud_days"); // "cloud_days" (Nube centrada) o "matrix"
  const [showCapacity, setShowCapacity] = useState<boolean>(false);
  const [hideFullShifts, setHideFullShifts] = useState<boolean>(true); // Por defecto oculta los turnos llenos
  const [theme, setTheme] = useState<ThemeStyle>("dark_glass");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("story");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(75); // 0 a 100%
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);

  // Textos personalizables del pie de imagen
  const [footerLine1, setFooterLine1] = useState<string>("📍 Cesar Diaz 3031, CABA  •  📱 Instagram: @selenepilates");
  const [footerLine2, setFooterLine2] = useState<string>("✨ Reserva tu lugar online en selenepilates.com");

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedBgImageRef = useRef<HTMLImageElement | null>(null);

  // Calcular las fechas de la semana seleccionada (Lunes a Sábado)
  const allWeekDays = useMemo(() => {
    const monday = getWeekMonday(weekOffset);
    const list: Array<{
      dateStr: string;
      dayName: string;
      dayNameShort: string;
      dayNumber: number;
      monthNumberStr: string;
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
      const mNum = String(d.getMonth() + 1).padStart(2, "0");
      list.push({
        dateStr: formatDateYMD(d),
        dayName: DAY_NAMES_ES[i],
        dayNameShort: DAY_NAMES_SHORT[i],
        dayNumber: d.getDate(),
        monthNumberStr: mNum,
        monthNameShort: MONTH_NAMES_SHORT[d.getMonth()],
        monthName: MONTH_NAMES_ES[d.getMonth()],
      });
    }

    return list;
  }, [weekOffset]);

  // Filtrar para no mostrar días pasados si es la semana actual
  const todayStr = useMemo(() => formatDateYMD(new Date()), []);
  const activeDays = useMemo(() => {
    if (weekOffset === 0) {
      // Semana actual: solo días desde hoy en adelante
      return allWeekDays.filter((d) => d.dateStr >= todayStr);
    }
    // Semanas futuras: mostrar todos los días
    return allWeekDays;
  }, [allWeekDays, weekOffset, todayStr]);

  const weekLabel = useMemo(() => {
    if (activeDays.length === 0) return "";
    const first = activeDays[0];
    const last = activeDays[activeDays.length - 1];
    if (first.monthName === last.monthName) {
      return `${first.dayNumber} al ${last.dayNumber} de ${first.monthName}`;
    }
    return `${first.dayNumber} ${first.monthNameShort} - ${last.dayNumber} ${last.monthNameShort}`;
  }, [activeDays]);

  // Cargar turnos y reservas de la semana seleccionada desde Firestore
  const loadWeekData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);

    const startDate = allWeekDays[0]?.dateStr;
    const endDate = allWeekDays[5]?.dateStr;

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
  }, [isOpen, allWeekDays, fallbackShifts]);

  useEffect(() => {
    if (isOpen) {
      loadWeekData();
    }
  }, [isOpen, loadWeekData]);

  // Horarios únicos presentes en la semana
  const timeSlots = useMemo(() => {
    const rawTimes = Array.from(new Set(shifts.map((s) => s.startTime))).filter(Boolean);
    rawTimes.sort();

    if (rawTimes.length === 0) {
      return ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
    }
    return rawTimes;
  }, [shifts]);

  // Manejar carga de imagen de fondo personalizada
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          loadedBgImageRef.current = img;
          setCustomBgImage(result);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (customBgImage) {
      const img = new Image();
      img.onload = () => {
        loadedBgImageRef.current = img;
        drawInstagramImage();
      };
      img.src = customBgImage;
    }
  }, [customBgImage]);

  // DIBUJAR MATRIZ O LISTA EN EL CANVAS (ULTRA HD 2X)
  const drawInstagramImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = 2; // 2x Ultra HD / 4K para máxima nitidez
    let width = 1080;
    let height = 1920; // Story 9:16 por defecto

    if (aspectRatio === "portrait") {
      height = 1350; // Post 4:5
    } else if (aspectRatio === "square") {
      height = 1080; // Post 1:1
    }

    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);

    // Paleta y estilo según tema
    let isLight = theme === "clean_white" || theme === "pastel_glass";
    let bgGradientStart = "#090d16";
    let bgGradientEnd = "#111827";
    let cardBg = "rgba(255, 255, 255, 0.08)";
    let cardBorder = "rgba(255, 255, 255, 0.18)";
    let emptyCellBg = "rgba(255, 255, 255, 0.02)";
    let emptyCellBorder = "rgba(255, 255, 255, 0.06)";
    let textPrimary = "#FFFFFF";
    let textSecondary = "#CBD5E1";
    let textAccent = "#818CF8";
    let headerPillBg = "#4F46E5";
    let headerPillText = "#FFFFFF";
    let timeLabelBg = "rgba(255, 255, 255, 0.12)";
    let timeLabelText = "#FFFFFF";
    let spotBg = "rgba(16, 185, 129, 0.25)";
    let spotText = "#34D399";
    let fullBg = "rgba(239, 68, 68, 0.25)";
    let fullText = "#F87171";

    if (theme === "warm_studio") {
      bgGradientStart = "#181210";
      bgGradientEnd = "#2D1D18";
      cardBg = "rgba(255, 237, 213, 0.12)";
      cardBorder = "rgba(251, 146, 60, 0.25)";
      emptyCellBg = "rgba(255, 255, 255, 0.02)";
      emptyCellBorder = "rgba(255, 255, 255, 0.05)";
      textPrimary = "#FFF7ED";
      textSecondary = "#FED7AA";
      textAccent = "#FDBA74";
      headerPillBg = "#EA580C";
      headerPillText = "#FFFFFF";
      timeLabelBg = "rgba(234, 88, 12, 0.25)";
      timeLabelText = "#FFEDD5";
      spotBg = "rgba(34, 197, 94, 0.28)";
      spotText = "#86EFAC";
      fullBg = "rgba(239, 68, 68, 0.28)";
      fullText = "#FCA5A5";
    } else if (theme === "instagram_gradient") {
      bgGradientStart = "#3B185F";
      bgGradientEnd = "#A12568";
      cardBg = "rgba(0, 0, 0, 0.35)";
      cardBorder = "rgba(255, 255, 255, 0.25)";
      emptyCellBg = "rgba(0, 0, 0, 0.15)";
      emptyCellBorder = "rgba(255, 255, 255, 0.08)";
      textPrimary = "#FFFFFF";
      textSecondary = "#F1F5F9";
      textAccent = "#FDE047";
      headerPillBg = "#E1306C";
      headerPillText = "#FFFFFF";
      timeLabelBg = "rgba(225, 48, 108, 0.32)";
      timeLabelText = "#FFFFFF";
      spotBg = "rgba(34, 197, 94, 0.3)";
      spotText = "#86EFAC";
      fullBg = "rgba(239, 68, 68, 0.35)";
      fullText = "#FCA5A5";
    } else if (theme === "pastel_glass") {
      bgGradientStart = "#FDF4FF";
      bgGradientEnd = "#F3E8FF";
      cardBg = "rgba(255, 255, 255, 0.85)";
      cardBorder = "rgba(147, 51, 234, 0.25)";
      emptyCellBg = "rgba(255, 255, 255, 0.35)";
      emptyCellBorder = "rgba(147, 51, 234, 0.1)";
      textPrimary = "#3B0764";
      textSecondary = "#6B21A8";
      textAccent = "#7E22CE";
      headerPillBg = "#9333EA";
      headerPillText = "#FFFFFF";
      timeLabelBg = "#F3E8FF";
      timeLabelText = "#581C87";
      spotBg = "#DCFCE7";
      spotText = "#15803D";
      fullBg = "#FEE2E2";
      fullText = "#B91C1C";
    } else if (theme === "clean_white") {
      bgGradientStart = "#FFFFFF";
      bgGradientEnd = "#F8FAFC";
      cardBg = "rgba(255, 255, 255, 0.95)";
      cardBorder = "#CBD5E1";
      emptyCellBg = "#F8FAFC";
      emptyCellBorder = "#E2E8F0";
      textPrimary = "#0F172A";
      textSecondary = "#475569";
      textAccent = "#2563EB";
      headerPillBg = "#0F172A";
      headerPillText = "#FFFFFF";
      timeLabelBg = "#F1F5F9";
      timeLabelText = "#0F172A";
      spotBg = "#DCFCE7";
      spotText = "#15803D";
      fullBg = "#FEE2E2";
      fullText = "#DC2626";
    }

    // 1. FONDO (Imagen Personalizada o Gradiente Studio)
    if (loadedBgImageRef.current) {
      const img = loadedBgImageRef.current;
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let renderW = width;
      let renderH = height;
      let renderX = 0;
      let renderY = 0;

      if (imgRatio > canvasRatio) {
        renderW = height * imgRatio;
        renderX = (width - renderW) / 2;
      } else {
        renderH = width / imgRatio;
        renderY = (height - renderH) / 2;
      }

      ctx.drawImage(img, renderX, renderY, renderW, renderH);

      const alpha = overlayOpacity / 100;
      ctx.fillStyle = isLight
        ? `rgba(255, 255, 255, ${alpha})`
        : `rgba(9, 13, 22, ${alpha})`;
      ctx.fillRect(0, 0, width, height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, bgGradientStart);
      bgGrad.addColorStop(1, bgGradientEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glowGrad = ctx.createRadialGradient(width / 2, 180, 20, width / 2, 180, 550);
      glowGrad.addColorStop(0, isLight ? "rgba(147, 51, 234, 0.12)" : "rgba(99, 102, 241, 0.22)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. HEADER ELEGANTE
    const headerTop = aspectRatio === "story" ? 95 : 60;

    // Logo / Nombre del Estudio
    ctx.textAlign = "center";
    ctx.font = "bold 32px 'Plus Jakarta Sans', sans-serif, -apple-system";
    ctx.fillStyle = textAccent;
    ctx.letterSpacing = "6px";
    ctx.fillText("✦  SELENE PILATES  ✦", width / 2, headerTop);

    // Título Principal
    ctx.font = "900 48px 'Plus Jakarta Sans', sans-serif, -apple-system";
    ctx.fillStyle = textPrimary;
    ctx.letterSpacing = "1px";
    ctx.fillText("CRONOGRAMA DE CLASES", width / 2, headerTop + 58);

    // Subtítulo con Rango de Fechas
    ctx.font = "600 24px 'Plus Jakarta Sans', sans-serif, -apple-system";
    ctx.fillStyle = textSecondary;
    ctx.fillText(`Semana del ${weekLabel}`, width / 2, headerTop + 98);

    // 3. RENDERIZADO SEGÚN MODO DE DISEÑO
    if (layoutMode === "cloud_days") {
      // =========================================================================
      // MODO: POR DÍAS (DÍA CENTRADO ARRIBA Y NUBE DE HORARIOS CENTRADOS ABAJO)
      // =========================================================================
      const listTop = headerTop + (aspectRatio === "story" ? 140 : 110);
      const listBottom = height - (aspectRatio === "story" ? 115 : 85);
      const availableListHeight = listBottom - listTop;

      // Filtrar los días a mostrar: no días pasados, y si hideFullShifts es true, omitir días sin turnos disponibles
      const daysToRender = activeDays.map((day) => {
        let dayShifts = shifts.filter((s) => s.date === day.dateStr);
        dayShifts.sort((a, b) => a.startTime.localeCompare(b.startTime));

        const shiftsWithInfo = dayShifts.map((s) => {
          const activeBookings = bookings.filter((b) => b.shiftId === s.id && b.status === "confirmed").length;
          const booked = Math.max(s.bookedCount || 0, activeBookings);
          const freeSpots = Math.max(0, s.capacity - booked);
          const isFull = freeSpots <= 0;
          return { shift: s, booked, freeSpots, isFull };
        });

        const visibleShifts = hideFullShifts
          ? shiftsWithInfo.filter((item) => !item.isFull)
          : shiftsWithInfo;

        return {
          day,
          visibleShifts,
        };
      }).filter((item) => !hideFullShifts || item.visibleShifts.length > 0);

      const numDays = Math.max(daysToRender.length, 1);
      const dayCardGap = aspectRatio === "story" ? 16 : 12;
      const dayCardHeight = (availableListHeight - dayCardGap * (numDays - 1)) / numDays;
      const paddingX = 40;
      const cardW = width - paddingX * 2;

      if (daysToRender.length === 0) {
        ctx.textAlign = "center";
        ctx.font = "bold 26px 'Plus Jakarta Sans', sans-serif, -apple-system";
        ctx.fillStyle = textSecondary;
        ctx.fillText("No hay turnos con cupo disponible esta semana", width / 2, listTop + availableListHeight / 2);
      } else {
        daysToRender.forEach(({ day, visibleShifts }, dayIdx) => {
          const cardY = listTop + dayIdx * (dayCardHeight + dayCardGap);

          // Tarjeta contenedor del día
          ctx.fillStyle = cardBg;
          ctx.strokeStyle = cardBorder;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(paddingX, cardY, cardW, dayCardHeight, 22);
          ctx.fill();
          ctx.stroke();

          // 1. DÍA CENTRADO EN EL MEDIO SUPERIOR (Pill / Título)
          const dayTitleStr = `✦  ${day.dayName.toUpperCase()} ${day.dayNumber}/${day.monthNumberStr}  ✦`;
          const dayPillW = Math.min(320, cardW - 40);
          const dayPillH = 36;
          const dayPillX = (width - dayPillW) / 2;
          const dayPillY = cardY + 12;

          ctx.fillStyle = headerPillBg;
          ctx.beginPath();
          ctx.roundRect(dayPillX, dayPillY, dayPillW, dayPillH, dayPillH / 2);
          ctx.fill();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "900 16px 'Plus Jakarta Sans', sans-serif, -apple-system";
          ctx.fillStyle = headerPillText;
          ctx.fillText(dayTitleStr, width / 2, dayPillY + dayPillH / 2);
          ctx.textBaseline = "alphabetic";

          // 2. NUBE DE HORARIOS CENTRADA ABAJO (MULTI-LÍNEA SI NO ENTRAN)
          const chipsAreaY = dayPillY + dayPillH + 12;
          const chipsAreaH = dayCardHeight - (dayPillH + 24);

          if (visibleShifts.length === 0) {
            ctx.textAlign = "center";
            ctx.font = "italic 16px 'Plus Jakarta Sans', sans-serif, -apple-system";
            ctx.fillStyle = textSecondary;
            ctx.fillText("Sin clases programadas", width / 2, chipsAreaY + chipsAreaH / 2 + 5);
          } else {
            // Calcular tamaños de chips (cápsulas)
            const chipH = Math.min(38, chipsAreaH);
            const chipPaddingX = 14;
            const gapX = 12;
            const gapY = 8;
            const maxLineWidth = cardW - 32;

            // Medir ancho individual de cada chip
            const chipsWithWidth = visibleShifts.map((item) => {
              const teacherFirst = getFirstName(item.shift.instructorName);
              const hourStr = formatHourShort(item.shift.startTime);
              const capStr = showCapacity ? (item.isFull ? "Lleno" : `${item.freeSpots} lib.`) : "";

              // Ancho estimado = círculo hora (32px) + texto profe + cupo + paddings
              const teacherTextW = teacherFirst ? teacherFirst.length * 8 + 10 : 0;
              const capTextW = capStr ? capStr.length * 7 + 16 : 0;
              const calcW = Math.max(120, 36 + teacherTextW + capTextW + chipPaddingX * 2);

              return {
                ...item,
                hourStr,
                teacherFirst,
                capStr,
                chipW: calcW,
              };
            });

            // Agrupar en líneas centradas (si no entran bajan a la siguiente línea)
            const lines: Array<typeof chipsWithWidth> = [];
            let currentLine: typeof chipsWithWidth = [];
            let currentLineWidth = 0;

            chipsWithWidth.forEach((chip) => {
              if (currentLine.length > 0 && currentLineWidth + gapX + chip.chipW > maxLineWidth) {
                lines.push(currentLine);
                currentLine = [chip];
                currentLineWidth = chip.chipW;
              } else {
                currentLine.push(chip);
                currentLineWidth += (currentLine.length === 1 ? 0 : gapX) + chip.chipW;
              }
            });
            if (currentLine.length > 0) {
              lines.push(currentLine);
            }

            // Calcular posición Y inicial para centrar verticalmente todas las líneas en el área
            const totalLinesH = lines.length * chipH + (lines.length - 1) * gapY;
            const startY = chipsAreaY + Math.max(0, (chipsAreaH - totalLinesH) / 2);

            // Dibujar cada línea centrada horizontalmente
            lines.forEach((lineChips, lineIdx) => {
              const lineY = startY + lineIdx * (chipH + gapY);
              const totalLineW = lineChips.reduce((acc, c) => acc + c.chipW, 0) + (lineChips.length - 1) * gapX;
              let currentX = (width - totalLineW) / 2;

              lineChips.forEach((chip) => {
                // Fondo del chip redondeado
                ctx.fillStyle = timeLabelBg;
                ctx.strokeStyle = cardBorder;
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.roundRect(currentX, lineY, chip.chipW, chipH, chipH / 2);
                ctx.fill();
                ctx.stroke();

                // Círculo del horario
                const circleD = chipH - 6;
                const circleX = currentX + 3;
                const circleY = lineY + 3;

                ctx.fillStyle = headerPillBg;
                ctx.beginPath();
                ctx.arc(circleX + circleD / 2, circleY + circleD / 2, circleD / 2, 0, Math.PI * 2);
                ctx.fill();

                // Hora en el círculo
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.font = "900 13px 'Plus Jakarta Sans', sans-serif, -apple-system";
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(chip.hourStr, circleX + circleD / 2, circleY + circleD / 2);

                // Nombre de la profesora
                let textX = circleX + circleD + 8;
                ctx.textAlign = "left";
                ctx.font = "900 14px 'Plus Jakarta Sans', sans-serif, -apple-system";
                ctx.fillStyle = textPrimary;
                ctx.fillText(chip.teacherFirst, textX, lineY + chipH / 2);

                // Mini badge de cupo si está habilitado
                if (showCapacity && chip.capStr) {
                  const teacherWidth = ctx.measureText(chip.teacherFirst).width;
                  const badgeX = textX + teacherWidth + 8;
                  const badgeW = chip.capStr.length * 7 + 12;
                  const badgeH = 18;
                  const badgeY = lineY + (chipH - badgeH) / 2;

                  ctx.fillStyle = chip.isFull ? fullBg : spotBg;
                  ctx.beginPath();
                  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
                  ctx.fill();

                  ctx.textAlign = "center";
                  ctx.font = "bold 10px 'Plus Jakarta Sans', sans-serif, -apple-system";
                  ctx.fillStyle = chip.isFull ? fullText : spotText;
                  ctx.fillText(chip.capStr, badgeX + badgeW / 2, lineY + chipH / 2);
                }

                ctx.textBaseline = "alphabetic";
                currentX += chip.chipW + gapX;
              });
            });
          }
        });
      }
    } else {
      // =========================================================================
      // MODO: GRILLA MATRIZ TRADICIONAL (EJE X DÍAS, EJE Y HORARIOS)
      // =========================================================================
      const gridTop = headerTop + (aspectRatio === "story" ? 140 : 115);
      const gridBottom = height - (aspectRatio === "story" ? 115 : 85);
      const availableGridHeight = gridBottom - gridTop;

      const paddingX = 36;
      const timeColWidth = 88;
      const colGap = 8;
      const rowGap = 7;

      const daysLeft = paddingX + timeColWidth + colGap;
      const availableWidthForDays = width - daysLeft - paddingX;
      const dayColWidth = (availableWidthForDays - colGap * (activeDays.length - 1)) / activeDays.length;

      const headerRowHeight = 44;
      const numRows = Math.max(timeSlots.length, 1);
      const rowHeight = (availableGridHeight - headerRowHeight - rowGap * numRows) / numRows;

      // Encabezados de Días
      activeDays.forEach((day, dayIdx) => {
        const colX = daysLeft + dayIdx * (dayColWidth + colGap);

        ctx.fillStyle = headerPillBg;
        ctx.beginPath();
        ctx.roundRect(colX, gridTop, dayColWidth, headerRowHeight, 12);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.font = "900 16px 'Plus Jakarta Sans', sans-serif, -apple-system";
        ctx.fillStyle = headerPillText;
        ctx.fillText(
          `${day.dayNameShort} ${day.dayNumber}`,
          colX + dayColWidth / 2,
          gridTop + 24
        );

        ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif, -apple-system";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillText(
          day.monthNameShort.toUpperCase(),
          colX + dayColWidth / 2,
          gridTop + 37
        );
      });

      // Filas de Horarios
      timeSlots.forEach((timeStr, timeIdx) => {
        const rowY = gridTop + headerRowHeight + rowGap + timeIdx * (rowHeight + rowGap);

        const pillW = Math.min(timeColWidth - 4, 76);
        const pillH = Math.min(rowHeight - 8, 36);
        const pillX = paddingX + (timeColWidth - pillW) / 2;
        const pillY = rowY + (rowHeight - pillH) / 2;
        const pillRadius = pillH / 2;

        ctx.fillStyle = timeLabelBg;
        ctx.strokeStyle = cardBorder;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 16px 'Plus Jakarta Sans', sans-serif, -apple-system";
        ctx.fillStyle = timeLabelText;
        ctx.fillText(
          formatHourShort(timeStr),
          pillX + pillW / 2,
          pillY + pillH / 2
        );
        ctx.textBaseline = "alphabetic";

        // Celdas para cada día
        activeDays.forEach((day, dayIdx) => {
          const cellX = daysLeft + dayIdx * (dayColWidth + colGap);

          const matchedShift = shifts.find(
            (s) => s.date === day.dateStr && s.startTime === timeStr
          );

          if (!matchedShift) {
            ctx.fillStyle = emptyCellBg;
            ctx.strokeStyle = emptyCellBorder;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(cellX, rowY, dayColWidth, rowHeight, 10);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = "center";
            ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif, -apple-system";
            ctx.fillStyle = isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)";
            ctx.fillText("-", cellX + dayColWidth / 2, rowY + rowHeight / 2 + 5);
          } else {
            const activeBookings = bookings.filter((b) => b.shiftId === matchedShift.id && b.status === "confirmed").length;
            const booked = Math.max(matchedShift.bookedCount || 0, activeBookings);
            const freeSpots = Math.max(0, matchedShift.capacity - booked);
            const isFull = freeSpots <= 0;

            if (hideFullShifts && isFull) {
              ctx.fillStyle = emptyCellBg;
              ctx.strokeStyle = emptyCellBorder;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(cellX, rowY, dayColWidth, rowHeight, 10);
              ctx.fill();
              ctx.stroke();

              ctx.textAlign = "center";
              ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif, -apple-system";
              ctx.fillStyle = isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)";
              ctx.fillText("-", cellX + dayColWidth / 2, rowY + rowHeight / 2 + 5);
              return;
            }

            ctx.fillStyle = cardBg;
            ctx.strokeStyle = cardBorder;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cellX, rowY, dayColWidth, rowHeight, 10);
            ctx.fill();
            ctx.stroke();

            const classShort = matchedShift.title
              .replace(/^pilates\s+/i, "")
              .trim() || matchedShift.discipline;
            const teacherFirst = getFirstName(matchedShift.instructorName);

            ctx.textAlign = "center";

            if (showCapacity) {
              ctx.font = "900 13px 'Plus Jakarta Sans', sans-serif, -apple-system";
              ctx.fillStyle = textPrimary;
              ctx.fillText(classShort, cellX + dayColWidth / 2, rowY + rowHeight * 0.32);

              ctx.font = "600 12px 'Plus Jakarta Sans', sans-serif, -apple-system";
              ctx.fillStyle = textSecondary;
              ctx.fillText(teacherFirst, cellX + dayColWidth / 2, rowY + rowHeight * 0.58);

              const badgeW = dayColWidth - 16;
              const badgeH = 18;
              const badgeX = cellX + 8;
              const badgeY = rowY + rowHeight - badgeH - 5;

              ctx.fillStyle = isFull ? fullBg : spotBg;
              ctx.beginPath();
              ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
              ctx.fill();

              ctx.font = "bold 10px 'Plus Jakarta Sans', sans-serif, -apple-system";
              ctx.fillStyle = isFull ? fullText : spotText;
              const badgeText = isFull ? "LLENO" : freeSpots === 1 ? "1 LIBRE" : `${freeSpots} LIBRES`;
              ctx.fillText(badgeText, cellX + dayColWidth / 2, badgeY + 13);
            } else {
              ctx.font = "900 14px 'Plus Jakarta Sans', sans-serif, -apple-system";
              ctx.fillStyle = textPrimary;
              ctx.fillText(classShort, cellX + dayColWidth / 2, rowY + rowHeight * 0.44);

              ctx.font = "600 13px 'Plus Jakarta Sans', sans-serif, -apple-system";
              ctx.fillStyle = textSecondary;
              ctx.fillText(`Prof. ${teacherFirst}`, cellX + dayColWidth / 2, rowY + rowHeight * 0.74);
            }
          }
        });
      });
    }

    // 4. FOOTER TRANSLÚCIDO PERSONALIZABLE
    const footerY = height - (aspectRatio === "story" ? 65 : 42);

    ctx.textAlign = "center";
    if (footerLine1.trim()) {
      ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif, -apple-system";
      ctx.fillStyle = textPrimary;
      ctx.fillText(footerLine1.trim(), width / 2, footerY);
    }

    if (footerLine2.trim()) {
      ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif, -apple-system";
      ctx.fillStyle = textAccent;
      const secondLineY = footerLine1.trim() ? footerY + 26 : footerY;
      ctx.fillText(footerLine2.trim(), width / 2, secondLineY);
    }
  }, [
    aspectRatio,
    theme,
    layoutMode,
    weekLabel,
    activeDays,
    timeSlots,
    shifts,
    bookings,
    showCapacity,
    hideFullShifts,
    overlayOpacity,
    footerLine1,
    footerLine2,
  ]);

  // Redibujar cada vez que cambien opciones o datos
  useEffect(() => {
    if (isOpen && !isLoading) {
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
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }, "image/png");
    } catch (err) {
      console.warn("Clipboard copy fallback:", err);
      handleDownload();
    }
  };

  // Compartir en Web Share API
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full shadow-2xl animate-modal my-4 max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <InstagramIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Generador de Grilla para Instagram
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900/40">
                  Ultra HD 4K
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Diseño por días centrados con nube de horarios, sin días pasados y 100% de los turnos visibles
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

        {/* Modal Body: Controls (Left) & Canvas Live Preview (Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Selector de Modo de Diseño (Nube por Días vs Matriz X/Y) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Formato de Distribución:</span>
              </label>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setLayoutMode("cloud_days")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    layoutMode === "cloud_days"
                      ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  <span>Por Días (Nube Centrada)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode("matrix")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    layoutMode === "matrix"
                      ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Matriz (Ejes X / Y)</span>
                </button>
              </div>
            </div>

            {/* 2. Selector de Semana */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Selecciona la Semana:</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { offset: 0, label: "Esta Semana", desc: "Desde hoy" },
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
                <span>Rango activo: <strong>{weekLabel}</strong> ({activeDays.length} días)</span>
                <button
                  type="button"
                  onClick={loadWeekData}
                  className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                  title="Recargar datos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* 3. Opciones de Cupos y Filtro de Clases Llenas */}
            <div className="space-y-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Filtros de Visibilidad y Cupos:
              </span>

              {/* Toggle 1: Ocultar Clases Llenas / Solo con Cupo */}
              <div
                onClick={() => setHideFullShifts(!hideFullShifts)}
                className="flex items-start gap-3 cursor-pointer select-none py-1"
              >
                <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                  {hideFullShifts ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Ocultar turnos llenos (Solo mostrar con cupo disponible)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block">
                    {hideFullShifts
                      ? "✓ Activado: No aparecen clases llenas, solo turnos con cupo libre."
                      : "✕ Desactivado: Muestra todos los turnos programados."}
                  </span>
                </div>
              </div>

              {/* Toggle 2: Mostrar Cupos Disponibles */}
              <div
                onClick={() => setShowCapacity(!showCapacity)}
                className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-slate-200 dark:border-slate-800/80"
              >
                <div className="mt-0.5 text-indigo-600 dark:text-indigo-400">
                  {showCapacity ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Mostrar número de cupos libres en cada turno
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block">
                    {showCapacity
                      ? "Muestra tag '2 lib.', '1 lib.' en cada cápsula de turno."
                      : "Solo muestra la hora y la profesora (look super limpio)."}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Fondo Translúcido / Estilo Visual */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Estilo y Fondo Translúcido:</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "dark_glass", label: "Oscuro Translúcido", bg: "bg-slate-900 text-white" },
                  { id: "warm_studio", label: "Estudio Cálido", bg: "bg-amber-950 text-amber-100 border-amber-800" },
                  { id: "instagram_gradient", label: "Instagram Sunset", bg: "bg-gradient-to-r from-purple-900 to-pink-700 text-white" },
                  { id: "pastel_glass", label: "Pastel Studio", bg: "bg-purple-100 text-purple-950 border-purple-300" },
                  { id: "clean_white", label: "Minimal Blanco", bg: "bg-white text-slate-900 border-slate-300" },
                ].map((t) => {
                  const isSelected = theme === t.id && !customBgImage;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setCustomBgImage(null);
                        setTheme(t.id as ThemeStyle);
                      }}
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

              {/* Botón para Subir Foto de Fondo Propia */}
              <div className="pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    customBgImage
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30"
                      : "bg-slate-50 dark:bg-slate-950 border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {customBgImage
                      ? "✓ Foto propia cargada (Toca para cambiar)"
                      : "Subir foto propia de tu estudio de fondo"}
                  </span>
                </button>
              </div>

              {/* Control de Opacidad del Fondo */}
              {customBgImage && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Oscurecer fondo para legibilidad:</span>
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                      {overlayOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="95"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              )}
            </div>

            {/* 5. Formato / Aspect Ratio */}
            <div className="space-y-1.5">
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

            {/* 6. Texto Personalizable del Pie de Imagen */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Texto del Pie de Imagen:</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFooterLine1("📍 Cesar Diaz 3031, CABA  •  📱 Instagram: @selenepilates");
                    setFooterLine2("✨ Reserva tu lugar online en selenepilates.com");
                  }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Restablecer
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Línea 1 (Dirección / Redes):
                  </span>
                  <input
                    type="text"
                    value={footerLine1}
                    onChange={(e) => setFooterLine1(e.target.value)}
                    placeholder="Ej. 📍 Cesar Diaz 3031 • @selenepilates"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Línea 2 (Llamado a la acción / Web):
                  </span>
                  <input
                    type="text"
                    value={footerLine2}
                    onChange={(e) => setFooterLine2(e.target.value)}
                    placeholder="Ej. ✨ Reserva tu lugar online en selenepilates.com"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Live Preview Column */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa ({layoutMode === "cloud_days" ? "Nube por Días" : "Matriz X/Y"}):</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ultra HD 4K ({aspectRatio === "story" ? "2160 × 3840 px" : aspectRatio === "portrait" ? "2160 × 2700 px" : "2160 × 2160 px"})</span>
              </span>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center aspect-[9/16] max-h-[560px]">
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
            <span>Resolución 4K lista para historias de Instagram. Los textos son 100% nítidos en zoom.</span>
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
                  <span className="text-emerald-600">¡Copiada al Portapapeles!</span>
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
