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
  Type,
  LayoutGrid,
  ListFilter,
  Paintbrush,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

interface InstagramScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AspectRatio = "story" | "portrait" | "square";
type ThemeStyle =
  | "obsidian_glass"
  | "warm_latte"
  | "sunset_instagram"
  | "matcha_botanical"
  | "editorial_white"
  | "lavender_aura";
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

// Convierte HEX a RGBA con opacidad
function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Extrae exclusivamente el primer nombre de la profesora (limpio y elegante)
function getCleanInstructorName(fullName?: string): string {
  if (!fullName) return "";
  const cleaned = fullName.trim().replace(/^prof\.?\s+/i, "");
  const first = cleaned.split(/\s+/)[0] || "";
  return first;
}

// Formato de hora en punto simplificado (ej. 14:00 -> 14hs, 09:30 -> 09:30hs)
function formatHourShort(timeStr: string): string {
  if (!timeStr) return "";
  const [rawH, rawM] = timeStr.split(":");
  const hourNum = parseInt(rawH || "0", 10);
  return rawM === "00" || !rawM ? `${hourNum}hs` : `${rawH}:${rawM}hs`;
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
  const { shifts: fallbackShifts } = useData();
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("cloud_days");
  const [showCapacity, setShowCapacity] = useState<boolean>(false);
  const [hideFullShifts, setHideFullShifts] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeStyle>("obsidian_glass");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("story");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(75);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);

  // Colores personalizables por el usuario
  const [dayPillBgColor, setDayPillBgColor] = useState<string>("#6366F1");
  const [cardBgColor, setCardBgColor] = useState<string>("#0F172A");
  const [cardBgOpacity, setCardBgOpacity] = useState<number>(65);
  const [chipBgColor, setChipBgColor] = useState<string>("#1E293B");
  const [chipBgOpacity, setChipBgOpacity] = useState<number>(80);
  const [hourCircleBgColor, setHourCircleBgColor] = useState<string>("#6366F1");
  const [textColor, setTextColor] = useState<string>("#FFFFFF");
  const [dayTextColor, setDayTextColor] = useState<string>("#FFFFFF");
  const [hourTextColor, setHourTextColor] = useState<string>("#FFFFFF");
  const [accentGlowColor, setAccentGlowColor] = useState<string>("#818CF8");

  // Presets de temas premium de boutique studio
  const applyThemePreset = (themeId: ThemeStyle) => {
    setTheme(themeId);
    setCustomBgImage(null);

    if (themeId === "obsidian_glass") {
      setDayPillBgColor("#6366F1");
      setCardBgColor("#0F172A");
      setCardBgOpacity(65);
      setChipBgColor("#1E293B");
      setChipBgOpacity(80);
      setHourCircleBgColor("#6366F1");
      setTextColor("#FFFFFF");
      setDayTextColor("#FFFFFF");
      setHourTextColor("#FFFFFF");
      setAccentGlowColor("#818CF8");
    } else if (themeId === "warm_latte") {
      setDayPillBgColor("#D97706");
      setCardBgColor("#261914");
      setCardBgOpacity(70);
      setChipBgColor("#3D2820");
      setChipBgOpacity(85);
      setHourCircleBgColor("#D97706");
      setTextColor("#FFFBEB");
      setDayTextColor("#FFFFFF");
      setHourTextColor("#FFFFFF");
      setAccentGlowColor("#F59E0B");
    } else if (themeId === "sunset_instagram") {
      setDayPillBgColor("#EC4899");
      setCardBgColor("#250E36");
      setCardBgOpacity(75);
      setChipBgColor("#4A154B");
      setChipBgOpacity(85);
      setHourCircleBgColor("#EC4899");
      setTextColor("#FFFFFF");
      setDayTextColor("#FFFFFF");
      setHourTextColor("#FFFFFF");
      setAccentGlowColor("#F43F5E");
    } else if (themeId === "matcha_botanical") {
      setDayPillBgColor("#10B981");
      setCardBgColor("#0B2019");
      setCardBgOpacity(70);
      setChipBgColor("#133B2E");
      setChipBgOpacity(85);
      setHourCircleBgColor("#10B981");
      setTextColor("#ECFDF5");
      setDayTextColor("#FFFFFF");
      setHourTextColor("#FFFFFF");
      setAccentGlowColor("#34D399");
    } else if (themeId === "editorial_white") {
      setDayPillBgColor("#0F172A");
      setCardBgColor("#FFFFFF");
      setCardBgOpacity(95);
      setChipBgColor("#F8FAFC");
      setChipBgOpacity(95);
      setHourCircleBgColor("#0F172A");
      setTextColor("#0F172A");
      setDayTextColor("#FFFFFF");
      setHourTextColor("#FFFFFF");
      setAccentGlowColor("#3B82F6");
    } else if (themeId === "lavender_aura") {
      setDayPillBgColor("#8B5CF6");
      setCardBgColor("#FFFFFF");
      setCardBgOpacity(90);
      setChipBgColor("#F5F3FF");
      setChipBgOpacity(95);
      setHourCircleBgColor("#8B5CF6");
      setTextColor("#4C1D95");
      setDayTextColor("#FFFFFF");
      setHourTextColor("#FFFFFF");
      setAccentGlowColor("#A78BFA");
    }
  };

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
      return allWeekDays.filter((d) => d.dateStr >= todayStr);
    }
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

  // Horarios únicos presentes en la semana para modo matriz
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

  // =========================================================================
  // MOTOR DE RENDERIZADO GRÁFICO ULTRA-ESTÉTICO DE ALTA DEFINICIÓN (2X HD)
  // =========================================================================
  const drawInstagramImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = 2; // Ultra HD 2x para nitidez cristalina
    let width = 1080;
    let height = 1920; // 9:16 Story

    if (aspectRatio === "portrait") {
      height = 1350; // 4:5 Post
    } else if (aspectRatio === "square") {
      height = 1080; // 1:1 Cuadrado
    }

    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);

    const isLight = theme === "editorial_white" || theme === "lavender_aura";

    // Paletas de fondo y ambientación según el tema
    let bgGradStart = "#090D16";
    let bgGradEnd = "#111827";
    let glowColor1 = hexToRgba(accentGlowColor, 0.25);
    let glowColor2 = hexToRgba(dayPillBgColor, 0.2);

    if (theme === "warm_latte") {
      bgGradStart = "#1C130E";
      bgGradEnd = "#2E1C14";
    } else if (theme === "sunset_instagram") {
      bgGradStart = "#250E36";
      bgGradEnd = "#4A154B";
    } else if (theme === "matcha_botanical") {
      bgGradStart = "#081E17";
      bgGradEnd = "#0F3226";
    } else if (theme === "editorial_white") {
      bgGradStart = "#F8FAFC";
      bgGradEnd = "#FFFFFF";
      glowColor1 = "rgba(59, 130, 246, 0.08)";
      glowColor2 = "rgba(147, 51, 234, 0.06)";
    } else if (theme === "lavender_aura") {
      bgGradStart = "#FAF5FF";
      bgGradEnd = "#F3E8FF";
      glowColor1 = "rgba(168, 85, 247, 0.12)";
      glowColor2 = "rgba(139, 92, 246, 0.1)";
    }

    // 1. DIBUJAR FONDO
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
      // Degradé de fondo rico y profundo
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, bgGradStart);
      bgGrad.addColorStop(1, bgGradEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Mesh Glow 1 (Top Center)
      const glow1 = ctx.createRadialGradient(width / 2, 120, 20, width / 2, 120, 600);
      glow1.addColorStop(0, glowColor1);
      glow1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      // Ambient Mesh Glow 2 (Bottom Right)
      const glow2 = ctx.createRadialGradient(width * 0.8, height * 0.85, 10, width * 0.8, height * 0.85, 500);
      glow2.addColorStop(0, glowColor2);
      glow2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. HEADER EDITORIAL BOUTIQUE
    const headerTop = aspectRatio === "story" ? 85 : aspectRatio === "portrait" ? 60 : 45;

    // Mini Brand Pre-title con Espaciado Elegante
    ctx.textAlign = "center";
    ctx.font = "800 16px 'Plus Jakarta Sans', -apple-system, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillStyle = isLight ? "#64748B" : hexToRgba(accentGlowColor, 0.9);
    ctx.fillText("✦  SELENE PILATES  ✦", width / 2, headerTop);

    // Título Principal
    ctx.font = "900 44px 'Plus Jakarta Sans', -apple-system, sans-serif";
    ctx.letterSpacing = "1.5px";
    ctx.fillStyle = isLight ? "#0F172A" : "#FFFFFF";
    ctx.fillText("CRONOGRAMA DE CLASES", width / 2, headerTop + 50);

    // Subtítulo con Rango de Fechas en Cápsula Glassmorphism
    const subtitleText = `SEMANA DEL ${weekLabel.toUpperCase()}`;
    ctx.font = "800 16px 'Plus Jakarta Sans', -apple-system, sans-serif";
    ctx.letterSpacing = "2px";
    const subBadgeW = ctx.measureText(subtitleText).width + 48;
    const subBadgeH = 34;
    const subBadgeY = headerTop + 72;
    const subBadgeX = (width - subBadgeW) / 2;

    // Sombra sutil del badge
    ctx.save();
    ctx.shadowColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.roundRect(subBadgeX, subBadgeY, subBadgeW, subBadgeH, subBadgeH / 2);
    ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.08)";
    ctx.fill();
    ctx.restore();

    // Borde de lujo
    ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(subBadgeX, subBadgeY, subBadgeW, subBadgeH, subBadgeH / 2);
    ctx.stroke();

    ctx.fillStyle = isLight ? "#334155" : "#E2E8F0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(subtitleText, width / 2, subBadgeY + subBadgeH / 2);
    ctx.textBaseline = "alphabetic";

    // 3. RENDERIZADO DEL CONTENIDO
    if (layoutMode === "cloud_days") {
      // =========================================================================
      // MODO: POR DÍAS (TARJETAS GLASSMORPHISM CON PÍLDORAS FLUIDAS)
      // =========================================================================
      const listTop = headerTop + (aspectRatio === "story" ? 135 : aspectRatio === "portrait" ? 120 : 105);
      const listBottom = height - (aspectRatio === "story" ? 95 : aspectRatio === "portrait" ? 75 : 60);
      const availableListHeight = listBottom - listTop;

      // Filtrar los días a mostrar
      const daysToRender = activeDays
        .map((day) => {
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
        })
        .filter((item) => !hideFullShifts || item.visibleShifts.length > 0);

      const numDays = Math.max(daysToRender.length, 1);
      const paddingX = 40;
      const cardW = width - paddingX * 2;
      const maxLineWidth = cardW - 40;
      const gapX = 14;
      const gapY = 12;

      // Tamaño dinámico del chip adaptado a la cantidad de días
      let targetChipH =
        aspectRatio === "story"
          ? numDays <= 3
            ? 74
            : numDays <= 4
            ? 68
            : 60
          : aspectRatio === "portrait"
          ? numDays <= 3
            ? 64
            : 54
          : numDays <= 3
          ? 56
          : 46;

      const calculateLayout = (chipH: number) => {
        const circleD = chipH - 8;
        const hourFontSize = Math.round(circleD * 0.35);
        const teacherFontSize = Math.round(chipH * 0.34);
        const disciplineFontSize = Math.max(10, Math.round(chipH * 0.22));
        const dayPillH = Math.min(46, Math.max(38, Math.round(chipH * 0.7)));

        ctx.font = `800 ${teacherFontSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;

        const daysLayout = daysToRender.map(({ day, visibleShifts }) => {
          if (visibleShifts.length === 0) {
            return {
              day,
              lines: [],
              cardH: dayPillH + 60,
              chipH,
              circleD,
              hourFontSize,
              teacherFontSize,
              disciplineFontSize,
              dayPillH,
            };
          }

          const chipsWithWidth = visibleShifts.map((item) => {
            const teacherFirst = getCleanInstructorName(item.shift.instructorName);
            const hourStr = formatHourShort(item.shift.startTime);
            const disciplineName = item.shift.title.replace(/^pilates\s+/i, "").trim() || item.shift.discipline;
            const capStr = showCapacity ? (item.isFull ? "Completo" : `${item.freeSpots} lib.`) : "";

            const teacherW = teacherFirst ? ctx.measureText(teacherFirst).width : 0;
            const capW = capStr ? capStr.length * 7 + 16 : 0;

            const calcW = Math.max(
              165,
              6 + circleD + 12 + teacherW + (capStr ? 12 + capW : 0) + 20
            );

            return {
              ...item,
              hourStr,
              teacherFirst,
              disciplineName,
              capStr,
              chipW: calcW,
              circleD,
            };
          });

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

          const chipsAreaH = lines.length * chipH + Math.max(0, lines.length - 1) * gapY;
          const cardH = 14 + dayPillH + 14 + chipsAreaH + 16;

          return {
            day,
            lines,
            cardH,
            chipH,
            circleD,
            hourFontSize,
            teacherFontSize,
            disciplineFontSize,
            dayPillH,
          };
        });

        const dayCardGap = numDays <= 3 ? 20 : numDays <= 4 ? 16 : 12;
        const totalCardsH =
          daysLayout.reduce((acc, d) => acc + d.cardH, 0) +
          Math.max(0, daysLayout.length - 1) * dayCardGap;

        return { daysLayout, totalCardsH, dayCardGap };
      };

      let layoutResult = calculateLayout(targetChipH);
      while (layoutResult.totalCardsH > availableListHeight && targetChipH > 40) {
        targetChipH -= 2;
        layoutResult = calculateLayout(targetChipH);
      }

      const { daysLayout, totalCardsH, dayCardGap } = layoutResult;
      const startListY = listTop + Math.max(0, (availableListHeight - totalCardsH) / 2);

      if (daysToRender.length === 0) {
        ctx.textAlign = "center";
        ctx.font = "700 24px 'Plus Jakarta Sans', -apple-system, sans-serif";
        ctx.fillStyle = isLight ? "#64748B" : "#94A3B8";
        ctx.fillText("No hay clases con cupo disponible para esta semana", width / 2, listTop + availableListHeight / 2);
      } else {
        let currentCardY = startListY;

        daysLayout.forEach(
          ({
            day,
            lines,
            cardH,
            chipH,
            circleD,
            hourFontSize,
            teacherFontSize,
            disciplineFontSize,
            dayPillH,
          }) => {
            const cardY = currentCardY;
            currentCardY += cardH + dayCardGap;

            // 1. Tarjeta Contenedor del Día (Luxury Glassmorphism)
            const cardGrad = ctx.createLinearGradient(paddingX, cardY, paddingX, cardY + cardH);
            cardGrad.addColorStop(
              0,
              hexToRgba(cardBgColor, Math.min(1, (cardBgOpacity + 15) / 100))
            );
            cardGrad.addColorStop(
              1,
              hexToRgba(cardBgColor, Math.max(0, (cardBgOpacity - 10) / 100))
            );

            // Sombra suave
            ctx.save();
            ctx.shadowColor = isLight ? "rgba(0, 0, 0, 0.07)" : "rgba(0, 0, 0, 0.4)";
            ctx.shadowBlur = 24;
            ctx.shadowOffsetY = 8;
            ctx.beginPath();
            ctx.roundRect(paddingX, cardY, cardW, cardH, 32);
            ctx.fillStyle = cardGrad;
            ctx.fill();
            ctx.restore();

            // Borde especular con brillo superior
            ctx.strokeStyle = isLight
              ? hexToRgba(cardBgColor, Math.min(1, (cardBgOpacity + 25) / 100))
              : hexToRgba("#FFFFFF", 0.15);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(paddingX, cardY, cardW, cardH, 32);
            ctx.stroke();

            // 2. Encabezado del Día (Píldora Centrada)
            const dayTitleStr = `${day.dayName.toUpperCase()}  •  ${day.dayNumber}/${day.monthNumberStr}`;
            ctx.font = `900 ${Math.round(dayPillH * 0.42)}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
            ctx.letterSpacing = "1.5px";
            const dayTitleW = ctx.measureText(dayTitleStr).width;
            const dayPillW = Math.max(300, Math.min(cardW - 40, dayTitleW + 52));
            const dayPillX = (width - dayPillW) / 2;
            const dayPillY = cardY + 14;

            // Sombra del Pill de Día
            ctx.save();
            ctx.shadowColor = hexToRgba(dayPillBgColor, 0.5);
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 3;

            const dayPillGrad = ctx.createLinearGradient(dayPillX, dayPillY, dayPillX, dayPillY + dayPillH);
            dayPillGrad.addColorStop(0, dayPillBgColor);
            dayPillGrad.addColorStop(1, hexToRgba(dayPillBgColor, 0.85));

            ctx.fillStyle = dayPillGrad;
            ctx.beginPath();
            ctx.roundRect(dayPillX, dayPillY, dayPillW, dayPillH, dayPillH / 2);
            ctx.fill();
            ctx.restore();

            // Borde superior brillante
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(dayPillX, dayPillY, dayPillW, dayPillH, dayPillH / 2);
            ctx.stroke();

            // Texto del Día
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = dayTextColor;
            ctx.fillText(dayTitleStr, width / 2, dayPillY + dayPillH / 2);
            ctx.textBaseline = "alphabetic";

            // 3. Nube de Horarios Centrada
            const startY = dayPillY + dayPillH + 14;

            if (lines.length === 0) {
              ctx.textAlign = "center";
              ctx.font = "italic 16px 'Plus Jakarta Sans', -apple-system, sans-serif";
              ctx.fillStyle = isLight ? "#94A3B8" : "#64748B";
              ctx.fillText("Sin clases programadas", width / 2, startY + 18);
            } else {
              lines.forEach((lineChips, lineIdx) => {
                const lineY = startY + lineIdx * (chipH + gapY);
                const totalLineW =
                  lineChips.reduce((acc, c) => acc + c.chipW, 0) +
                  (lineChips.length - 1) * gapX;
                let currentX = (width - totalLineW) / 2;

                lineChips.forEach((chip) => {
                  // Cápsula del Turno
                  const chipGrad = ctx.createLinearGradient(currentX, lineY, currentX, lineY + chipH);
                  chipGrad.addColorStop(
                    0,
                    hexToRgba(chipBgColor, Math.min(1, (chipBgOpacity + 10) / 100))
                  );
                  chipGrad.addColorStop(
                    1,
                    hexToRgba(chipBgColor, Math.max(0, (chipBgOpacity - 10) / 100))
                  );

                  ctx.save();
                  ctx.shadowColor = isLight ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.25)";
                  ctx.shadowBlur = 8;
                  ctx.shadowOffsetY = 2;
                  ctx.fillStyle = chipGrad;
                  ctx.beginPath();
                  ctx.roundRect(currentX, lineY, chip.chipW, chipH, chipH / 2);
                  ctx.fill();
                  ctx.restore();

                  ctx.strokeStyle = isLight
                    ? hexToRgba(chipBgColor, Math.min(1, (chipBgOpacity + 20) / 100))
                    : "rgba(255, 255, 255, 0.16)";
                  ctx.lineWidth = 1.3;
                  ctx.beginPath();
                  ctx.roundRect(currentX, lineY, chip.chipW, chipH, chipH / 2);
                  ctx.stroke();

                  // Círculo del Horario (Limpio y Radiante)
                  const circleX = currentX + 4;
                  const circleY = lineY + (chipH - circleD) / 2;
                  const centerX = circleX + circleD / 2;
                  const centerY = circleY + circleD / 2;

                  ctx.save();
                  ctx.shadowColor = hexToRgba(hourCircleBgColor, 0.45);
                  ctx.shadowBlur = 10;
                  ctx.fillStyle = hourCircleBgColor;
                  ctx.beginPath();
                  ctx.arc(centerX, centerY, circleD / 2, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();

                  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
                  ctx.lineWidth = 1.2;
                  ctx.beginPath();
                  ctx.arc(centerX, centerY, circleD / 2, 0, Math.PI * 2);
                  ctx.stroke();

                  // Hora en el círculo
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.font = `900 ${hourFontSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
                  ctx.letterSpacing = "0px";
                  ctx.fillStyle = hourTextColor;
                  ctx.fillText(chip.hourStr, centerX, centerY + 0.5);

                  // Nombre de la Profesora y Disciplina
                  const textX = circleX + circleD + 12;
                  ctx.textAlign = "left";
                  ctx.font = `800 ${teacherFontSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
                  ctx.fillStyle = textColor;
                  ctx.fillText(chip.teacherFirst, textX, lineY + chipH / 2);

                  // Tag de Cupos (si está activado)
                  if (showCapacity && chip.capStr) {
                    const teacherWidth = ctx.measureText(chip.teacherFirst).width;
                    const badgeX = textX + teacherWidth + 10;
                    const badgeW = chip.capStr.length * 7 + 16;
                    const badgeH = Math.round(chipH * 0.48);
                    const badgeY = lineY + (chipH - badgeH) / 2;

                    const isFull = chip.isFull;
                    const badgeBg = isFull
                      ? "rgba(239, 68, 68, 0.25)"
                      : "rgba(16, 185, 129, 0.25)";
                    const badgeTextCol = isFull ? "#FCA5A5" : "#6EE7B7";

                    ctx.fillStyle = badgeBg;
                    ctx.beginPath();
                    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
                    ctx.fill();

                    ctx.textAlign = "center";
                    ctx.font = `800 ${Math.max(10, Math.round(badgeH * 0.52))}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
                    ctx.fillStyle = badgeTextCol;
                    ctx.fillText(chip.capStr, badgeX + badgeW / 2, lineY + chipH / 2);
                  }

                  ctx.textBaseline = "alphabetic";
                  currentX += chip.chipW + gapX;
                });
              });
            }
          }
        );
      }
    } else {
      // =========================================================================
      // MODO: MATRIZ SEMANAL (EJE X DÍAS, EJE Y HORARIOS)
      // =========================================================================
      const gridTop = headerTop + (aspectRatio === "story" ? 140 : aspectRatio === "portrait" ? 120 : 100);
      const gridBottom = height - (aspectRatio === "story" ? 100 : aspectRatio === "portrait" ? 75 : 60);
      const availableGridHeight = gridBottom - gridTop;

      const paddingX = 36;
      const timeColWidth = 102;
      const colGap = 10;
      const rowGap = 10;

      const daysLeft = paddingX + timeColWidth + colGap;
      const availableWidthForDays = width - daysLeft - paddingX;
      const totalAvailableColSpace = availableWidthForDays - colGap * Math.max(0, activeDays.length - 1);

      // Calcular peso dinámico de ancho para cada día: si el día tiene clases con nombres largos como "Reformer Flow", se le asigna más ancho
      const dayWeights = activeDays.map((day) => {
        const dayShifts = shifts.filter((s) => s.date === day.dateStr);
        const maxTitleLen = dayShifts.reduce((max, s) => {
          const t = s.title.replace(/^pilates\s+/i, "").trim() || s.discipline;
          return Math.max(max, t.length);
        }, 0);
        return maxTitleLen > 10 ? 1.3 : 1.0;
      });

      const totalWeight = dayWeights.reduce((acc, w) => acc + w, 0) || 1;
      const dayColWidths = dayWeights.map((w) => (totalAvailableColSpace * w) / totalWeight);

      // Posiciones X exactas de cada columna de día
      const dayColPositions: number[] = [];
      let currentTrackX = daysLeft;
      dayColWidths.forEach((w) => {
        dayColPositions.push(currentTrackX);
        currentTrackX += w + colGap;
      });

      const headerRowHeight = 58;
      const numRows = Math.max(timeSlots.length, 1);
      const rowHeight = (availableGridHeight - headerRowHeight - rowGap * numRows) / numRows;

      // Encabezados de Días (Con Ancho Dinámico)
      activeDays.forEach((day, dayIdx) => {
        const colX = dayColPositions[dayIdx];
        const dayColWidth = dayColWidths[dayIdx];

        ctx.save();
        ctx.shadowColor = hexToRgba(dayPillBgColor, 0.4);
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = dayPillBgColor;
        ctx.beginPath();
        ctx.roundRect(colX, gridTop, dayColWidth, headerRowHeight, 16);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(colX, gridTop, dayColWidth, headerRowHeight, 16);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.font = "900 20px 'Plus Jakarta Sans', -apple-system, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillStyle = dayTextColor;
        ctx.fillText(
          `${day.dayNameShort} ${day.dayNumber}`,
          colX + dayColWidth / 2,
          gridTop + 30
        );

        ctx.font = "800 13px 'Plus Jakarta Sans', -apple-system, sans-serif";
        ctx.letterSpacing = "1.5px";
        ctx.fillStyle = hexToRgba(dayTextColor, 0.85);
        ctx.fillText(
          day.monthNameShort.toUpperCase(),
          colX + dayColWidth / 2,
          gridTop + 48
        );
      });

      // Filas de Horarios
      timeSlots.forEach((timeStr, timeIdx) => {
        const rowY = gridTop + headerRowHeight + rowGap + timeIdx * (rowHeight + rowGap);

        const pillW = timeColWidth;
        const pillH = Math.min(rowHeight, 52);
        const pillX = paddingX;
        const pillY = rowY + (rowHeight - pillH) / 2;

        ctx.save();
        ctx.shadowColor = hexToRgba(hourCircleBgColor, 0.35);
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = hexToRgba(hourCircleBgColor, 0.85);
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 16);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 16);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 20px 'Plus Jakarta Sans', -apple-system, sans-serif";
        ctx.letterSpacing = "0.5px";
        ctx.fillStyle = hourTextColor;
        ctx.fillText(formatHourShort(timeStr), pillX + pillW / 2, pillY + pillH / 2);
        ctx.textBaseline = "alphabetic";

        // Celdas por Día
        activeDays.forEach((day, dayIdx) => {
          const colX = dayColPositions[dayIdx];
          const dayColWidth = dayColWidths[dayIdx];

          const matchedShift = shifts.find(
            (s) => s.date === day.dateStr && s.startTime === timeStr
          );

          if (!matchedShift) {
            ctx.fillStyle = isLight ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.03)";
            ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.07)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(colX, rowY, dayColWidth, rowHeight, 16);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "600 16px 'Plus Jakarta Sans', -apple-system, sans-serif";
            ctx.fillStyle = isLight ? "rgba(0, 0, 0, 0.18)" : "rgba(255, 255, 255, 0.18)";
            ctx.fillText("—", colX + dayColWidth / 2, rowY + rowHeight / 2);
            ctx.textBaseline = "alphabetic";
          } else {
            const activeBookings = bookings.filter(
              (b) => b.shiftId === matchedShift.id && b.status === "confirmed"
            ).length;
            const booked = Math.max(matchedShift.bookedCount || 0, activeBookings);
            const freeSpots = Math.max(0, matchedShift.capacity - booked);
            const isFull = freeSpots <= 0;

            if (hideFullShifts && isFull) {
              ctx.fillStyle = isLight ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.03)";
              ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.07)";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.roundRect(colX, rowY, dayColWidth, rowHeight, 16);
              ctx.fill();
              ctx.stroke();

              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.font = "600 16px 'Plus Jakarta Sans', -apple-system, sans-serif";
              ctx.fillStyle = isLight ? "rgba(0, 0, 0, 0.18)" : "rgba(255, 255, 255, 0.18)";
              ctx.fillText("—", colX + dayColWidth / 2, rowY + rowHeight / 2);
              ctx.textBaseline = "alphabetic";
              return;
            }

            // Fondo de la Card del Turno (Degradé y Sombra)
            const cellGrad = ctx.createLinearGradient(colX, rowY, colX, rowY + rowHeight);
            cellGrad.addColorStop(
              0,
              hexToRgba(cardBgColor, Math.min(1, (cardBgOpacity + 15) / 100))
            );
            cellGrad.addColorStop(
              1,
              hexToRgba(cardBgColor, Math.max(0, (cardBgOpacity - 10) / 100))
            );

            ctx.save();
            ctx.shadowColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.3)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = cellGrad;
            ctx.beginPath();
            ctx.roundRect(colX, rowY, dayColWidth, rowHeight, 16);
            ctx.fill();
            ctx.restore();

            ctx.strokeStyle = isLight
              ? hexToRgba(cardBgColor, Math.min(1, (cardBgOpacity + 25) / 100))
              : "rgba(255, 255, 255, 0.22)";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(colX, rowY, dayColWidth, rowHeight, 16);
            ctx.stroke();

            const classShort =
              matchedShift.title.replace(/^pilates\s+/i, "").trim() ||
              matchedShift.discipline;
            const teacherFirst = getCleanInstructorName(matchedShift.instructorName);

            const isTallCell = rowHeight >= 85;
            const baseClassFontSize = Math.min(20, Math.max(15, Math.round(rowHeight * 0.18)));
            const baseTeacherFontSize = Math.min(25, Math.max(18, Math.round(rowHeight * 0.22)));
            const badgeFontSize = Math.min(15, Math.max(12, Math.round(rowHeight * 0.14)));

            const maxTextWidth = dayColWidth - 14;
            const classWords = classShort.toUpperCase().split(/\s+/);

            ctx.textAlign = "center";

            if (showCapacity) {
              // 1. Disciplina / Clase con soporte multi-línea inteligente
              let targetClassSize = baseClassFontSize;
              ctx.font = `800 ${targetClassSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
              ctx.fillStyle = hexToRgba(textColor, 0.9);

              const singleWidth = ctx.measureText(classShort.toUpperCase()).width;
              if (singleWidth <= maxTextWidth) {
                ctx.fillText(
                  classShort.toUpperCase(),
                  colX + dayColWidth / 2,
                  rowY + rowHeight * (isTallCell ? 0.28 : 0.26)
                );
              } else if (classWords.length >= 2) {
                const line1 = classWords[0];
                const line2 = classWords.slice(1).join(" ");
                const subSize = Math.max(12, targetClassSize - 2);
                ctx.font = `800 ${subSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
                ctx.fillText(line1, colX + dayColWidth / 2, rowY + rowHeight * 0.20);
                ctx.fillText(line2, colX + dayColWidth / 2, rowY + rowHeight * 0.32);
              } else {
                while (targetClassSize > 11 && ctx.measureText(classShort.toUpperCase()).width > maxTextWidth) {
                  targetClassSize--;
                  ctx.font = `800 ${targetClassSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
                }
                ctx.fillText(
                  classShort.toUpperCase(),
                  colX + dayColWidth / 2,
                  rowY + rowHeight * (isTallCell ? 0.28 : 0.26)
                );
              }

              // 2. Nombre de la Profesora
              let teacherSize = baseTeacherFontSize;
              ctx.font = `900 ${teacherSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
              while (teacherSize > 13 && ctx.measureText(teacherFirst).width > maxTextWidth) {
                teacherSize--;
                ctx.font = `900 ${teacherSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
              }
              ctx.fillStyle = textColor;
              ctx.fillText(
                teacherFirst,
                colX + dayColWidth / 2,
                rowY + rowHeight * (isTallCell ? 0.58 : 0.56)
              );

              // 3. Badge de Cupos
              const badgeW = Math.min(dayColWidth - 16, 110);
              const badgeH = Math.min(28, Math.max(22, Math.round(rowHeight * 0.24)));
              const badgeX = colX + (dayColWidth - badgeW) / 2;
              const badgeY = rowY + rowHeight - badgeH - (isTallCell ? 10 : 6);

              const badgeBg = isFull
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(16, 185, 129, 0.3)";
              const badgeBorder = isFull
                ? "rgba(239, 68, 68, 0.5)"
                : "rgba(16, 185, 129, 0.5)";
              const badgeTextCol = isFull ? "#FCA5A5" : "#6EE7B7";

              ctx.fillStyle = badgeBg;
              ctx.strokeStyle = badgeBorder;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
              ctx.fill();
              ctx.stroke();

              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.font = `900 ${badgeFontSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
              const badgeText = isFull ? "LLENO" : freeSpots === 1 ? "1 LIBRE" : `${freeSpots} LIBRES`;
              ctx.fillStyle = badgeTextCol;
              ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
              ctx.textBaseline = "alphabetic";
            } else {
              // Vista limpia sin cupos: sólo Clase y Profesora (grandes, equilibrados y nunca desbordados)
              let targetClassSize = baseClassFontSize + 2;
              ctx.font = `800 ${targetClassSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
              ctx.fillStyle = isLight ? "#6366F1" : hexToRgba(accentGlowColor, 0.95);

              const singleWidth = ctx.measureText(classShort.toUpperCase()).width;
              if (singleWidth <= maxTextWidth) {
                // 1 Sola Línea
                ctx.fillText(
                  classShort.toUpperCase(),
                  colX + dayColWidth / 2,
                  rowY + rowHeight * (isTallCell ? 0.38 : 0.36)
                );
              } else if (classWords.length >= 2) {
                // 2 Líneas si es compuesto (ej. "REFORMER" arriba y "FLOW" abajo)
                const line1 = classWords[0];
                const line2 = classWords.slice(1).join(" ");
                const subSize = Math.max(13, targetClassSize - 2);
                ctx.font = `800 ${subSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
                ctx.fillText(line1, colX + dayColWidth / 2, rowY + rowHeight * (isTallCell ? 0.28 : 0.26));
                ctx.fillText(line2, colX + dayColWidth / 2, rowY + rowHeight * (isTallCell ? 0.44 : 0.42));
              } else {
                while (targetClassSize > 12 && ctx.measureText(classShort.toUpperCase()).width > maxTextWidth) {
                  targetClassSize--;
                  ctx.font = `800 ${targetClassSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
                }
                ctx.fillText(
                  classShort.toUpperCase(),
                  colX + dayColWidth / 2,
                  rowY + rowHeight * (isTallCell ? 0.38 : 0.36)
                );
              }

              // 2. Nombre de la Profesora (GRANDE y CENTRADO)
              let teacherSize = baseTeacherFontSize + 4;
              ctx.font = `900 ${teacherSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
              while (teacherSize > 14 && ctx.measureText(teacherFirst).width > maxTextWidth) {
                teacherSize--;
                ctx.font = `900 ${teacherSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
              }
              ctx.fillStyle = textColor;
              ctx.fillText(
                teacherFirst,
                colX + dayColWidth / 2,
                rowY + rowHeight * (isTallCell ? 0.74 : 0.72)
              );
            }
          }
        });
      });
    }

    // 4. FOOTER EDITORIAL DE LUJO
    const footerY = height - (aspectRatio === "story" ? 65 : aspectRatio === "portrait" ? 45 : 35);

    ctx.textAlign = "center";
    if (footerLine1.trim()) {
      ctx.font = "800 19px 'Plus Jakarta Sans', -apple-system, sans-serif";
      ctx.fillStyle = isLight ? "#1E293B" : "#FFFFFF";
      ctx.fillText(footerLine1.trim(), width / 2, footerY);
    }

    if (footerLine2.trim()) {
      ctx.font = "700 15px 'Plus Jakarta Sans', -apple-system, sans-serif";
      ctx.fillStyle = isLight ? "#6366F1" : hexToRgba(accentGlowColor, 0.95);
      const secondLineY = footerLine1.trim() ? footerY + 24 : footerY;
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
    dayPillBgColor,
    dayTextColor,
    cardBgColor,
    cardBgOpacity,
    chipBgColor,
    chipBgOpacity,
    hourCircleBgColor,
    hourTextColor,
    textColor,
    accentGlowColor,
  ]);

  // Redibujar automáticamente con debounce
  useEffect(() => {
    if (isOpen && !isLoading) {
      const t = setTimeout(() => {
        drawInstagramImage();
      }, 40);
      return () => clearTimeout(t);
    }
  }, [isOpen, isLoading, drawInstagramImage]);

  // Descargar imagen en alta resolución
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

  // Compartir mediante Web Share API
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full shadow-2xl animate-modal my-4 max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <InstagramIcon className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                Generador de Imagen
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900/40 uppercase tracking-wider hidden sm:inline-block">
                Ultra HD
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Panel de Configuración (Izquierda) y Preview en Vivo (Derecha) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Selector de Estilo / Temas Premium */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Temas Boutique:</span>
                </label>
                <button
                  type="button"
                  onClick={() => applyThemePreset("obsidian_glass")}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Por Defecto</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "obsidian_glass",
                    label: "Obsidian Slate",
                    badge: "Dark Glass",
                    bg: "bg-slate-900 text-white border-slate-700",
                    dot: "bg-indigo-500",
                  },
                  {
                    id: "warm_latte",
                    label: "Warm Studio",
                    badge: "Terracotta",
                    bg: "bg-[#2A1B14] text-amber-100 border-amber-900/60",
                    dot: "bg-amber-500",
                  },
                  {
                    id: "sunset_instagram",
                    label: "Sunset Rose",
                    badge: "Instagram",
                    bg: "bg-[#2B0E36] text-pink-100 border-pink-900/60",
                    dot: "bg-pink-500",
                  },
                  {
                    id: "matcha_botanical",
                    label: "Matcha Sage",
                    badge: "Botanical",
                    bg: "bg-[#0B241C] text-emerald-100 border-emerald-900/60",
                    dot: "bg-emerald-500",
                  },
                  {
                    id: "editorial_white",
                    label: "Minimal White",
                    badge: "Editorial",
                    bg: "bg-slate-50 text-slate-900 border-slate-300",
                    dot: "bg-slate-900",
                  },
                  {
                    id: "lavender_aura",
                    label: "Lavender Aura",
                    badge: "Pastel",
                    bg: "bg-purple-50 text-purple-950 border-purple-200",
                    dot: "bg-purple-600",
                  },
                ].map((t) => {
                  const isSelected = theme === t.id && !customBgImage;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyThemePreset(t.id as ThemeStyle)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "ring-2 ring-indigo-500 border-indigo-500 shadow-sm"
                          : "opacity-85 hover:opacity-100"
                      } ${t.bg}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-extrabold block leading-tight">{t.label}</span>
                      <span className="text-[9px] opacity-70 block">{t.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Selector de Modo de Distribución */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Formato de Distribución:</span>
              </label>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setLayoutMode("cloud_days")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    layoutMode === "matrix"
                      ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Matriz Semanal (X/Y)</span>
                </button>
              </div>
            </div>

            {/* 3. Selector de Semana */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Semana a Mostrar:</span>
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
                      className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${
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
                <span>Rango: <strong>{weekLabel}</strong> ({activeDays.length} días activos)</span>
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

            {/* 4. Filtros de Disponibilidad y Cupos */}
            <div className="space-y-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Filtros de Cupos y Disponibilidad:
              </span>

              <div
                onClick={() => setHideFullShifts(!hideFullShifts)}
                className="flex items-start gap-2.5 cursor-pointer select-none py-1"
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
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {hideFullShifts ? "✓ Solo se publican turnos con lugares libres" : "✕ Se muestran todas las clases"}
                  </span>
                </div>
              </div>

              <div
                onClick={() => setShowCapacity(!showCapacity)}
                className="flex items-start gap-2.5 cursor-pointer select-none pt-2 border-t border-slate-200 dark:border-slate-800/80"
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
                    Mostrar etiquetas de cupos disponibles
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {showCapacity ? "Muestra '2 lib.', 'Completo' en cada turno" : "Aspecto minimalista solo con hora y profesora"}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Personalización Fina de Colores */}
            <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Paintbrush className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Colores Personalizados:</span>
                </label>
                <button
                  type="button"
                  onClick={() => applyThemePreset(theme)}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Restablecer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Fondo de la Píldora del Día */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                      Píldora del Día
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{dayPillBgColor}</span>
                  </div>
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={dayPillBgColor}
                      onChange={(e) => setDayPillBgColor(e.target.value)}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                {/* 2. Círculo de Horarios */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                      Círculo de Hora
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{hourCircleBgColor}</span>
                  </div>
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={hourCircleBgColor}
                      onChange={(e) => setHourCircleBgColor(e.target.value)}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                {/* 3. Color de Letras Principal */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                      Letras Profesora
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{textColor}</span>
                  </div>
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                {/* 4. Color de Letras en Círculos (Hora / Día) */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                      Texto Hora y Día
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{hourTextColor}</span>
                  </div>
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={hourTextColor}
                      onChange={(e) => {
                        setHourTextColor(e.target.value);
                        setDayTextColor(e.target.value);
                      }}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                {/* 5. Fondo y Opacidad de la Tarjeta Contenedora */}
                <div className="col-span-1 sm:col-span-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                        Fondo de Tarjeta de Día
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">
                        {cardBgColor} • Opacidad: {cardBgOpacity}%
                      </span>
                    </div>
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner shrink-0 cursor-pointer">
                      <input
                        type="color"
                        value={cardBgColor}
                        onChange={(e) => setCardBgColor(e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={cardBgOpacity}
                    onChange={(e) => setCardBgOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* 6. Fondo y Opacidad de las Cápsulas de Turno */}
                <div className="col-span-1 sm:col-span-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                        Fondo de Cápsula de Turno
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">
                        {chipBgColor} • Opacidad: {chipBgOpacity}%
                      </span>
                    </div>
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner shrink-0 cursor-pointer">
                      <input
                        type="color"
                        value={chipBgColor}
                        onChange={(e) => setChipBgColor(e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={chipBgOpacity}
                    onChange={(e) => setChipBgOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* 6. Formato de Imagen / Aspect Ratio */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Ratio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Formato de Publicación:</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "story", label: "Historia (9:16)", desc: "1080 × 1920" },
                  { id: "portrait", label: "Post (4:5)", desc: "1080 × 1350" },
                  { id: "square", label: "Cuadrado (1:1)", desc: "1080 × 1080" },
                ].map((r) => {
                  const isSelected = aspectRatio === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAspectRatio(r.id as AspectRatio)}
                      className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-[11px] font-bold block">{r.label}</span>
                      <span className="text-[9px] opacity-70">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Foto de Fondo de Estudio Personalizada */}
            <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Foto Propia del Estudio:</span>
                </label>
                {customBgImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomBgImage(null);
                      loadedBgImageRef.current = null;
                      drawInstagramImage();
                    }}
                    className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Quitar Foto
                  </button>
                )}
              </div>

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
                    : "bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>
                  {customBgImage
                    ? "✓ Foto propia cargada (Toca para cambiar)"
                    : "Subir foto de fondo de tu estudio"}
                </span>
              </button>

              {customBgImage && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
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
                    min="20"
                    max="95"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              )}
            </div>

            {/* 8. Textos del Pie de Imagen */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Pie de Imagen (Info & CTA):</span>
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
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Línea 1 (Ubicación / Redes):
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
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Línea 2 (Web / Enlace de Reservas):
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
                <span>Vista Previa en Vivo:</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ultra HD 4K ({aspectRatio === "story" ? "2160 × 3840 px" : aspectRatio === "portrait" ? "2160 × 2700 px" : "2160 × 2160 px"})</span>
              </span>
            </div>

            {/* Canvas Container */}
            <div
              className={`relative w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center ${
                aspectRatio === "story"
                  ? "aspect-[9/16] max-h-[580px]"
                  : aspectRatio === "portrait"
                  ? "aspect-[4/5] max-h-[520px]"
                  : "aspect-square max-h-[480px]"
              }`}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-slate-50/80 dark:bg-slate-950/80">
          <div className="text-xs text-slate-500 flex items-center gap-2 text-center sm:text-left">
            <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
            <span>Resolución Ultra HD 4K nítida, ideal para Instagram Stories y Posts.</span>
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
                  <span className="text-emerald-600 font-bold">¡Copiada!</span>
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
              <span>Descargar PNG HD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
