"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Shift, Plan } from "@/types";
import { useData } from "@/context/DataContext";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  User,
  Mail,
  Phone,
  HeartPulse,
  Sparkles,
  Award,
  CheckSquare,
  Square,
  CalendarPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  MapPin,
  Check,
} from "lucide-react";

interface PublicBookingFormProps {
  shift: Shift;
  onSuccess: (result: { cancellationCode: string; cancellationUrl: string; booking: any }) => void;
  onCancel: () => void;
}

export function PublicBookingForm({ shift, onSuccess, onCancel }: PublicBookingFormProps) {
  const { createBooking, clients, shifts, bookings, plans: contextPlans, getClientWeeklyUsage } = useData();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [additionalShiftIds, setAdditionalShiftIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Planes disponibles cargados desde Firestore o contexto
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Función para normalizar números de teléfono para comparación flexible
  const cleanPhone = (val: string) => (val || "").replace(/\D/g, "");

  // Comparador exacto de números de teléfono (ignora formato de guiones/espacios pero exige número completo exacto)
  const isExactPhoneMatch = (inputPhone: string, dbPhone: string): boolean => {
    const p1 = cleanPhone(inputPhone);
    const p2 = cleanPhone(dbPhone);

    if (!p1 || !p2 || p1.length < 8 || p2.length < 8) return false;

    // Coincidencia exacta de dígitos
    if (p1 === p2) return true;

    // Comparar formato nacional argentino (removiendo prefijos internacionales 54 / 549 o prefijo 0 o 15)
    const nat1 = p1.replace(/^549?/, "").replace(/^0/, "").replace(/^15/, "");
    const nat2 = p2.replace(/^549?/, "").replace(/^0/, "").replace(/^15/, "");

    return nat1 === nat2 && nat1.length >= 8;
  };

  // Estado de clienta detectada únicamente activado al salir del campo (onBlur)
  const [matchedClient, setMatchedClient] = useState<any | null>(null);

  // Detectar si el usuario ya tiene una reserva confirmada en un turno específico (solo con contacto completo o clienta confirmada)
  const isClientAlreadyBookedInShift = useCallback(
    (shiftIdToCheck: string) => {
      const emailNorm = clientEmail.trim().toLowerCase();
      const phoneDigits = cleanPhone(clientPhone);

      const hasValidEmail = emailNorm.includes("@") && emailNorm.includes(".") && emailNorm.length >= 6;
      const hasValidPhone = phoneDigits.length >= 8;

      if (!hasValidEmail && !hasValidPhone && !matchedClient) return false;

      return bookings.some((b) => {
        if (b.shiftId !== shiftIdToCheck || b.status === "cancelled") return false;

        const matchEmail = Boolean(hasValidEmail && b.clientEmail && b.clientEmail.trim().toLowerCase() === emailNorm);
        const matchPhone = Boolean(
          hasValidPhone &&
          b.clientPhone &&
          isExactPhoneMatch(phoneDigits, b.clientPhone)
        );
        const matchMatchedClient = Boolean(
          matchedClient &&
          ((matchedClient.email && b.clientEmail && b.clientEmail.trim().toLowerCase() === matchedClient.email.trim().toLowerCase()) ||
           (matchedClient.phone && b.clientPhone && isExactPhoneMatch(b.clientPhone, matchedClient.phone)))
        );

        return matchEmail || matchPhone || matchMatchedClient;
      });
    },
    [clientEmail, clientPhone, bookings, matchedClient]
  );

  // Función para calcular rango de semana (Lunes a Domingo)
  const getWeekRange = (dateStr: string) => {
    let [y, m, d] = (dateStr || "").split("-").map(Number);
    const baseDate = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(baseDate);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatYMD = (date: Date) => {
      const yy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    };
    return { mondayStr: formatYMD(monday), sundayStr: formatYMD(sunday) };
  };

  const [weeklyUsage, setWeeklyUsage] = useState<{
    used: number;
    total: number;
    remaining: number;
    planName: string;
    hasPlan: boolean;
  }>({ used: 0, total: 0, remaining: 0, planName: "", hasPlan: false });
  const [isCheckingPlan, setIsCheckingPlan] = useState(false);

  // Detectar clienta y calcular uso semanal de su plan directamente en Firestore
  const detectClientAndUsage = useCallback(
    async (emailInput?: string, phoneInput?: string) => {
      const emailNorm = (emailInput !== undefined ? emailInput : clientEmail).trim().toLowerCase();
      const digits = cleanPhone(phoneInput !== undefined ? phoneInput : clientPhone);
      const db = getFirebaseDb();

      let found: any = null;

      // 1. Buscar por email (priorizando registro con plan)
      if (emailNorm.includes("@") && emailNorm.includes(".") && emailNorm.length >= 6) {
        found = clients.find((c) => c.email && c.email.trim().toLowerCase() === emailNorm && (c.planId || c.planName));
        if (!found) {
          found = clients.find((c) => c.email && c.email.trim().toLowerCase() === emailNorm);
        }
        if (!found && db) {
          try {
            const qSnap = await getDocs(
              query(collection(db, "pilates_clients"), where("email", "==", emailNorm))
            );
            if (!qSnap.empty) {
              const matches = qSnap.docs.map((d) => d.data());
              found = matches.find((m: any) => m.planId || m.planName || m.planClassesPerWeek) || matches[0];
            }
          } catch (err) {
            console.warn("Error querying client by email:", err);
          }
        }
      }

      // 2. Buscar por teléfono si no se halló por email
      if (!found && digits.length >= 8) {
        found = clients.find((c) => isExactPhoneMatch(digits, c.phone || "") && (c.planId || c.planName));
        if (!found) {
          found = clients.find((c) => isExactPhoneMatch(digits, c.phone || ""));
        }
        if (!found && db) {
          try {
            const qSnap = await getDocs(
              query(collection(db, "pilates_clients"), where("phone", "==", digits))
            );
            if (!qSnap.empty) {
              const matches = qSnap.docs.map((d) => d.data());
              found = matches.find((m: any) => m.planId || m.planName || m.planClassesPerWeek) || matches[0];
            }
          } catch (err) {
            console.warn("Error querying client by phone:", err);
          }
        }
      }

      if (found) {
        setMatchedClient(found);
        if (!clientName.trim() && found.name) setClientName(found.name);
        if (!clientPhone.trim() && found.phone) setClientPhone(found.phone);
        if (!clientEmail.trim() && found.email) setClientEmail(found.email);

        // 3. Verificar si la clienta posee un plan activo
        let totalAllowed = found.planClassesPerWeek || 0;
        let planName = found.planName || "";

        if ((!totalAllowed || !planName) && found.planId && db) {
          try {
            const pSnap = await getDocs(
              query(collection(db, "pilates_plans"), where("id", "==", found.planId))
            );
            if (!pSnap.empty) {
              const pData = pSnap.docs[0].data();
              if (!totalAllowed) totalAllowed = pData.classesPerWeek || 0;
              if (!planName) planName = pData.name || "";
            }
          } catch (e) {
            console.warn("Error fetching plan doc in public form:", e);
          }
        }

        const hasPlan = Boolean(totalAllowed > 0 || planName || found.planId);

        if (hasPlan) {
          setIsCheckingPlan(true);
          const { mondayStr, sundayStr } = getWeekRange(shift.date);
          let usedCount = found.weeklyUsageMap?.[mondayStr];

          if (usedCount === undefined && db) {
            try {
              const searchEmail = (found.email || emailNorm).trim().toLowerCase();
              const bSnap = await getDocs(
                query(
                  collection(db, "pilates_bookings"),
                  where("clientEmail", "==", searchEmail),
                  where("status", "==", "confirmed")
                )
              );
              const weekBookings = bSnap.docs
                .map((d) => d.data())
                .filter((b: any) => b.shiftDate >= mondayStr && b.shiftDate <= sundayStr);
              usedCount = weekBookings.length;
            } catch (err) {
              console.warn("Error querying client week bookings:", err);
              usedCount = 0;
            }
          }

          const finalUsed = usedCount || 0;
          const finalTotal = totalAllowed > 0 ? totalAllowed : 2;
          setWeeklyUsage({
            hasPlan: true,
            planName: planName || "Plan de Clases",
            total: finalTotal,
            used: finalUsed,
            remaining: Math.max(0, finalTotal - finalUsed),
          });
          setIsCheckingPlan(false);
        } else {
          setWeeklyUsage({ used: 0, total: 0, remaining: 0, planName: "", hasPlan: false });
        }
      } else {
        setMatchedClient(null);
        setWeeklyUsage({ used: 0, total: 0, remaining: 0, planName: "", hasPlan: false });
      }
    },
    [clients, clientName, clientPhone, clientEmail, shift.date]
  );

  // Al escribir en el teléfono
  const handlePhoneChange = (val: string) => {
    const digits = (val || "").replace(/\D/g, "");
    setClientPhone(digits);
    if (!digits && !clientEmail.trim()) {
      setMatchedClient(null);
      setWeeklyUsage({ used: 0, total: 0, remaining: 0, planName: "", hasPlan: false });
    }
  };

  const handlePhoneBlur = () => {
    detectClientAndUsage(undefined, clientPhone);
  };

  // Al escribir en el correo
  const handleEmailChange = (val: string) => {
    setClientEmail(val);
    if (!val.trim() && !clientPhone.trim()) {
      setMatchedClient(null);
      setWeeklyUsage({ used: 0, total: 0, remaining: 0, planName: "", hasPlan: false });
    }
  };

  const handleEmailBlur = () => {
    detectClientAndUsage(clientEmail, undefined);
  };

  // Detección automática al terminar de tipear con debounce
  useEffect(() => {
    const emailNorm = clientEmail.trim().toLowerCase();
    const digits = cleanPhone(clientPhone);

    if ((emailNorm.includes("@") && emailNorm.includes(".") && emailNorm.length >= 6) || digits.length >= 8) {
      const timer = setTimeout(() => {
        detectClientAndUsage(clientEmail, clientPhone);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [clientEmail, clientPhone, detectClientAndUsage]);

  // Cargar planes activos del estudio desde Firestore o del contexto (ordenados de menor a mayor precio)
  useEffect(() => {
    const db = getFirebaseDb();
    if (db) {
      getDocs(query(collection(db, "pilates_plans")))
        .then((snap) => {
          const list = snap.docs
            .map((d) => d.data() as Plan)
            .filter((p) => p && p.id && !p.id.startsWith("_") && p.active !== false);
          if (list.length > 0) {
            setAvailablePlans(list.sort((a, b) => (a.price || 0) - (b.price || 0)));
          } else if (contextPlans && contextPlans.length > 0) {
            setAvailablePlans(contextPlans.filter((p) => p.active !== false).sort((a, b) => (a.price || 0) - (b.price || 0)));
          }
        })
        .catch(() => {
          if (contextPlans && contextPlans.length > 0) {
            setAvailablePlans(contextPlans.filter((p) => p.active !== false).sort((a, b) => (a.price || 0) - (b.price || 0)));
          }
        });
    } else if (contextPlans && contextPlans.length > 0) {
      setAvailablePlans(contextPlans.filter((p) => p.active !== false).sort((a, b) => (a.price || 0) - (b.price || 0)));
    }
  }, [contextPlans]);

  // Selección o cambio de plan por parte de un usuario sin plan asignado
  const handleSelectPlan = (plan: Plan | null) => {
    setSelectedPlan(plan);
    if (plan) {
      const classesAllowed = plan.classesPerWeek || 2;
      setWeeklyUsage({
        hasPlan: true,
        planName: plan.name,
        total: classesAllowed,
        used: 0,
        remaining: classesAllowed,
      });
    } else {
      setWeeklyUsage({
        hasPlan: false,
        planName: "",
        total: 0,
        used: 0,
        remaining: 0,
      });
      setAdditionalShiftIds([]);
    }
  };
  const otherAvailableWeekShifts = useMemo(() => {
    const baseDate = new Date(shift.date + "T12:00:00");
    const monday = new Date(baseDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const mondayStr = monday.toISOString().split("T")[0];
    const sundayStr = sunday.toISOString().split("T")[0];

    return shifts.filter((s) => {
      if (s.id === shift.id) return false;
      if (s.date < mondayStr || s.date > sundayStr) return false;
      if (s.bookedCount >= s.capacity) return false; // solo clases con lugar
      return true;
    }).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [shifts, shift]);

  // Cantidad máxima de clases ADICIONALES que puede sumar (además de la principal)
  // SOLO disponible si el usuario ingresó sus datos y es miembro de un plan con cupo restante
  const maxAdditionalShifts = useMemo(() => {
    if (weeklyUsage.hasPlan) {
      return Math.max(0, weeklyUsage.remaining - 1);
    }
    return 0; // Particulares o sin datos NO ven la opción de agendar más clases
  }, [weeklyUsage]);

  // Días laborables (Lunes a Viernes) de la semana del turno para el selector
  const weekDays = useMemo(() => {
    const baseDate = new Date(shift.date + "T12:00:00");
    const monday = new Date(baseDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);

    const namesShort = ["Lun", "Mar", "Mié", "Jue", "Vie"];
    const namesFull = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    const list = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const count = otherAvailableWeekShifts.filter((s) => s.date === dateStr).length;
      list.push({
        dateStr,
        dayNum: d.getDate(),
        dayShort: namesShort[i],
        dayFull: namesFull[i],
        count,
      });
    }
    return list;
  }, [shift.date, otherAvailableWeekShifts]);

  const [selectedAddDay, setSelectedAddDay] = useState<string>(() => {
    return shift.date;
  });

  // Clases filtradas por el día seleccionado
  const shiftsForSelectedAddDay = useMemo(() => {
    return otherAvailableWeekShifts.filter((s) => s.date === selectedAddDay);
  }, [otherAvailableWeekShifts, selectedAddDay]);

  // Si deja de ser miembro de plan o cambia email, limpiar selecciones adicionales
  React.useEffect(() => {
    if (!weeklyUsage.hasPlan) {
      setAdditionalShiftIds([]);
    }
  }, [weeklyUsage.hasPlan]);

  const toggleAdditionalShift = (id: string) => {
    setAdditionalShiftIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= maxAdditionalShifts) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const totalShiftsToBook = 1 + additionalShiftIds.length;

  const isMainShiftAlreadyBooked = isClientAlreadyBookedInShift(shift.id);

  // Validaciones de formulario
  const hasContactInfo = clientEmail.trim().length > 0 || clientPhone.trim().length > 0;
  const hasShiftStarted = (dateStr: string, startTimeStr: string) => {
    try {
      const now = new Date();
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = startTimeStr.split(":").map(Number);
      const shiftDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      return now.getTime() >= shiftDate.getTime();
    } catch {
      return false;
    }
  };

  const isMainShiftStarted = hasShiftStarted(shift.date, shift.startTime);
  const hasNameInfo = clientName.trim().length > 0;
  const isFormValid = hasNameInfo && hasContactInfo;
  const requiresPlanSelection = !matchedClient?.planId && !matchedClient?.planName && !matchedClient?.planClassesPerWeek && availablePlans.length > 0;
  const isPlanSelected = !requiresPlanSelection || Boolean(selectedPlan);
  const isPlanQuotaExceeded = weeklyUsage.hasPlan && weeklyUsage.remaining === 0;
  const isSubmitDisabled = submitting || !isFormValid || !isPlanSelected || isPlanQuotaExceeded || isMainShiftAlreadyBooked || isMainShiftStarted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isMainShiftStarted) {
      setError("Esta clase ya ha comenzado o su horario ya ha pasado. Por favor selecciona un turno próximo.");
      return;
    }

    if (!hasNameInfo) {
      setError("Por favor ingresa tu nombre y apellido.");
      return;
    }

    if (!hasContactInfo) {
      setError("Debes ingresar al menos un medio de contacto: Correo Electrónico o Teléfono / WhatsApp.");
      return;
    }

    if (requiresPlanSelection && !selectedPlan) {
      setError("Por favor selecciona un plan de clases para continuar.");
      return;
    }

    if (isMainShiftAlreadyBooked) {
      setError("Ya te encuentras inscripta/o en este turno.");
      return;
    }

    if (isPlanQuotaExceeded) {
      setError("Has alcanzado el límite de clases semanales de tu plan. No puedes reservar más turnos para esta semana.");
      return;
    }

    setSubmitting(true);

    try {
      const planToAttach = selectedPlan
        ? {
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            planClassesPerWeek: selectedPlan.classesPerWeek,
          }
        : {};

      // 1. Reservar clase principal
      const mainResult = await createBooking({
        shiftId: shift.id,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        notes,
        ...planToAttach,
      });

      // 2. Reservar clases adicionales si seleccionó más de una
      for (const addId of additionalShiftIds) {
        await createBooking({
          shiftId: addId,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim(),
          notes: notes ? `${notes} (Reserva grupal semanal)` : "Reserva grupal semanal",
          ...planToAttach,
        });
      }

      onSuccess(mainResult);
    } catch (err: any) {
      setError(err.message || "Error al completar tu reserva.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Warning banner si ya está inscripto en el turno principal */}
      {isMainShiftAlreadyBooked && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs space-y-1.5 shadow-2xs">
          <div className="font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Ya tienes una reserva confirmada en esta clase</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Ya figuras en la lista de alumnos inscriptos para el {shift.date} a las {shift.startTime} hs. No es posible reservar dos veces el mismo turno.
          </p>
        </div>
      )}

      {/* Main Shift Highlight Banner */}
      <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
        isMainShiftAlreadyBooked
          ? "bg-slate-100 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 opacity-80"
          : "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80"
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] uppercase font-bold ${
            isMainShiftAlreadyBooked ? "text-slate-500" : "text-indigo-600 dark:text-indigo-400"
          }`}>
            Clase Principal {isMainShiftAlreadyBooked ? "(Ya inscripta/o)" : "Seleccionada"}
          </span>
          {isMainShiftAlreadyBooked ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Registrada
            </span>
          ) : weeklyUsage.hasPlan ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-600 text-white shadow-2xs">
              ✨ Incluido en tu Plan
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
              Turno Disponible
            </span>
          )}
        </div>

        <div className="font-black text-slate-900 dark:text-slate-100 text-sm">{shift.title}</div>
        <div className="text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{shift.date} • {shift.startTime} a {shift.endTime} hs</span>
        </div>
        <div className="text-slate-600 dark:text-slate-300 text-[11px] flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Cesar Diaz 3031, CABA • {shift.room} (Prof. {shift.instructorName})</span>
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Tu Correo Electrónico <span className="text-slate-400 font-normal">(Recomendado)</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="martina@ejemplo.com"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Phone Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Teléfono / WhatsApp
        </label>
        <div className="relative">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            inputMode="numeric"
            value={clientPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={handlePhoneBlur}
            placeholder="1112345678"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Name Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Tu Nombre y Apellido <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej. Martina Silveyra"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Selector de Planes y Costos para Clientas Nuevas o Sin Plan Asignado */}
      {!matchedClient?.planId && !matchedClient?.planName && !matchedClient?.planClassesPerWeek && hasNameInfo && hasContactInfo && availablePlans.length > 0 && (
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                  Elige tu Plan de Clases
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Selecciona el plan semanal que deseas contratar con su arancel correspondiente:
                </p>
              </div>
            </div>
          </div>

          {/* Grid de Planes Disponibles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {availablePlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? "bg-white dark:bg-slate-950 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {plan.name}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {plan.classesPerWeek} {plan.classesPerWeek === 1 ? "clase semanal" : "clases por semana"}
                      </div>
                    </div>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-baseline justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-medium">Arancel:</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                      ${plan.price.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan Status Banner (Si la clienta ya tiene Plan asignado en base de datos) */}
      {matchedClient && (matchedClient.planId || matchedClient.planName || matchedClient.planClassesPerWeek) && weeklyUsage.hasPlan && (
        weeklyUsage.remaining === 0 ? (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="font-bold flex items-center gap-2 text-xs sm:text-sm text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Cupo Semanal Completo</span>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                0 turnos disponibles
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Ya has utilizado los <strong>{weeklyUsage.total} de {weeklyUsage.total} turnos</strong> de tu <strong>{weeklyUsage.planName}</strong> para esta semana.
            </p>
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-indigo-950 dark:text-indigo-200 truncate">
                    Miembro activo de {weeklyUsage.planName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {weeklyUsage.used} de {weeklyUsage.total} clases tomadas esta semana
                  </div>
                </div>
              </div>

              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black bg-indigo-600 text-white shadow-2xs shrink-0">
                {weeklyUsage.remaining} {weeklyUsage.remaining === 1 ? "turno disponible" : "turnos disponibles"}
              </span>
            </div>

            {/* Visual mini progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((weeklyUsage.used / Math.max(1, weeklyUsage.total)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )
      )}

      {/* Selector de Clases Adicionales de la Misma Semana (SOLO para Miembros de Plan con cupo disponible) */}
      {weeklyUsage.hasPlan && otherAvailableWeekShifts.length > 0 && maxAdditionalShifts > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <CalendarPlus className="w-4 h-4" />
              <span>Sumar otra clase para esta semana</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {additionalShiftIds.length} de {maxAdditionalShifts} extra seleccionadas
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Selecciona el día para ver los turnos disponibles y sumarlos a tu plan:
          </p>

          {/* 5-Day Selector Grid */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
            {weekDays.map((d) => {
              const isSelected = d.dateStr === selectedAddDay;
              const isMainShiftDay = d.dateStr === shift.date;
              const isAlreadyBookedInThisDay = bookings.some(
                (b) =>
                  b.status !== "cancelled" &&
                  b.shiftDate === d.dateStr &&
                  (
                    (clientEmail && b.clientEmail && b.clientEmail.toLowerCase() === clientEmail.trim().toLowerCase()) ||
                    (cleanPhone(clientPhone).length >= 8 &&
                     cleanPhone(b.clientPhone || "").length >= 8 &&
                     isExactPhoneMatch(clientPhone, b.clientPhone || ""))
                  )
              );
              const hasSelectedShiftInThisDay =
                isMainShiftDay ||
                isAlreadyBookedInThisDay ||
                additionalShiftIds.some((id) =>
                  otherAvailableWeekShifts.some((s) => s.id === id && s.date === d.dateStr)
                );
              const totalCountOnDay = d.count + (isMainShiftDay ? 1 : 0);
              const hasShifts = totalCountOnDay > 0;

              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedAddDay(d.dateStr)}
                  className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40 font-black"
                      : hasShifts
                      ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                      : "bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border border-transparent opacity-60"
                  }`}
                >
                  {hasSelectedShiftInThisDay && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs" />
                    </span>
                  )}
                  <span className="text-[9px] uppercase font-bold tracking-wider">{d.dayShort}</span>
                  <span className="text-xs font-black">{d.dayNum}</span>
                  <span className={`text-[8px] font-bold mt-0.5 px-1 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {totalCountOnDay}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Classes list for selected day */}
          <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-0.5">
            {/* Si es el día del turno principal, mostrarlo destacado como seleccionado */}
            {selectedAddDay === shift.date && (
              <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2.5 shadow-2xs transition-all ${
                isMainShiftAlreadyBooked
                  ? "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/90 text-slate-500"
                  : "border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/40"
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Time Badge */}
                  <div className={`px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[70px] sm:min-w-[76px] ${
                    isMainShiftAlreadyBooked
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      : "bg-emerald-600 text-white shadow-2xs"
                  }`}>
                    <span className="text-sm sm:text-base font-black tracking-tight leading-none">
                      {shift.startTime}
                    </span>
                    <span className="text-[9px] font-bold mt-0.5 text-emerald-100">
                      a {shift.endTime} hs
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-black truncate ${
                        isMainShiftAlreadyBooked ? "text-slate-700 dark:text-slate-300 line-through" : "text-slate-900 dark:text-slate-100"
                      }`}>
                        {shift.title}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black text-white shrink-0 ${
                        isMainShiftAlreadyBooked ? "bg-slate-500" : "bg-emerald-600"
                      }`}>
                        Principal
                      </span>
                    </div>
                    <div className={`text-[11px] font-medium mt-0.5 ${
                      isMainShiftAlreadyBooked ? "text-slate-500 dark:text-slate-400" : "text-emerald-800 dark:text-emerald-300"
                    }`}>
                      Prof. {shift.instructorName} • {shift.room}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 ${
                  isMainShiftAlreadyBooked
                    ? "text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    : "text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30"
                }`}>
                  {isMainShiftAlreadyBooked ? "Ya inscripta/o" : "✓ Seleccionada"}
                </span>
              </div>
            )}

            {shiftsForSelectedAddDay.length === 0 && selectedAddDay !== shift.date ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                No hay turnos con cupo libre para el día seleccionado.
              </div>
            ) : (
              shiftsForSelectedAddDay.map((s) => {
                const isAlreadyBookedInThisShift = isClientAlreadyBookedInShift(s.id);
                const isChecked = additionalShiftIds.includes(s.id);
                const disabled = isAlreadyBookedInThisShift || (!isChecked && additionalShiftIds.length >= maxAdditionalShifts);

                return (
                  <div
                    key={s.id}
                    onClick={() => !disabled && toggleAdditionalShift(s.id)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-xs flex items-center justify-between gap-2.5 transition-all ${
                      isAlreadyBookedInThisShift
                        ? "bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
                        : isChecked
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm cursor-pointer ring-2 ring-indigo-400/40"
                        : disabled
                        ? "opacity-40 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 pointer-events-none"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300 cursor-pointer shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Prominent Time Badge */}
                      <div className={`px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[70px] sm:min-w-[76px] transition-colors ${
                        isAlreadyBookedInThisShift
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          : isChecked
                          ? "bg-white/20 text-white"
                          : "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                      }`}>
                        <span className="text-sm sm:text-base font-black tracking-tight leading-none">
                          {s.startTime}
                        </span>
                        <span className={`text-[9px] font-bold mt-0.5 ${
                          isChecked
                            ? "text-indigo-100"
                            : isAlreadyBookedInThisShift
                            ? "text-slate-400"
                            : "text-indigo-500/80 dark:text-indigo-400"
                        }`}>
                          a {s.endTime} hs
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                          <span className={`font-black truncate ${isAlreadyBookedInThisShift ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
                            {s.title}
                          </span>
                        </div>
                        <div className={`text-[11px] font-medium mt-0.5 ${
                          isChecked ? "text-indigo-100" : isAlreadyBookedInThisShift ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                        }`}>
                          Prof. {s.instructorName} • {s.room}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-1">
                      {isAlreadyBookedInThisShift ? (
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-300/50 dark:border-slate-700/50">
                          Ya inscripta/o
                        </span>
                      ) : (
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          isChecked ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}>
                          {s.capacity - s.bookedCount} libres
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Health / Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          ¿Tienes alguna lesión o condición física a tener en cuenta? (Opcional)
        </label>
        <div className="relative">
          <HeartPulse className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Dolor lumbar, embarazo, rehabilitación..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
            isSubmitDisabled
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700"
              : "btn-primary"
          }`}
        >
          {isSubmitDisabled && !submitting ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>
            {submitting
              ? "Confirmando..."
              : isMainShiftAlreadyBooked
              ? "Ya estás inscripta/o en este turno"
              : isPlanQuotaExceeded
              ? "Cupo Semanal Completo (Sin turnos)"
              : !isFormValid
              ? "Completa tus datos para reservar"
              : !isPlanSelected
              ? "Elige un plan de clases"
              : weeklyUsage.hasPlan
              ? totalShiftsToBook > 1
                ? `Confirmar ${totalShiftsToBook} Clases (${weeklyUsage.planName})`
                : `Confirmar Clase (${weeklyUsage.planName})`
              : totalShiftsToBook > 1
              ? `Confirmar ${totalShiftsToBook} Clases`
              : "Confirmar Reserva"}
          </span>
        </button>
      </div>
    </form>
  );
}
