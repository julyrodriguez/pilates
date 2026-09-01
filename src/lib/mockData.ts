import { Shift, Booking, Instructor, Client, EmailLog, StudioSettings, Plan } from "@/types";

export const initialStudioSettings: StudioSettings = {
  studioName: "Selene Pilates",
  tagline: "Equilibrio, Fuerza y Movimiento Consciente",
  address: "Cesar Diaz 3031, CABA",
  phone: "",
  instagram: "@selene.pilates",
  cancellationWindowHours: 2,
  allowWaitlist: true,
  currency: "ARS",
};

export const initialInstructors: Instructor[] = [];
export const initialShifts: Shift[] = [];
export const initialBookings: Booking[] = [];
export const initialClients: Client[] = [];
export const initialEmailLogs: EmailLog[] = [];

export const initialDisciplines = [
  { id: "disc-reformer", name: "Reformer (Camas)", slug: "reformer", color: "indigo" },
  { id: "disc-mat", name: "Mat Pilates (Suelo)", slug: "mat", color: "emerald" },
  { id: "disc-cadillac", name: "Cadillac", slug: "cadillac", color: "violet" },
  { id: "disc-tower", name: "Tower / Wall Unit", slug: "tower", color: "amber" },
  { id: "disc-prenatal", name: "Pilates Prenatal", slug: "prenatal", color: "rose" },
  { id: "disc-power", name: "Power Pilates HIIT", slug: "power", color: "red" },
];

export const initialPlans: Plan[] = [
  {
    id: "plan-1x",
    name: "Plan 1 Clase x Semana",
    classesPerWeek: 1,
    price: 32000,
    description: "Ideal para complementar con otra actividad física",
    active: true,
  },
  {
    id: "plan-2x",
    name: "Plan 2 Clases x Semana",
    classesPerWeek: 2,
    price: 52000,
    description: "El plan más elegido para tonificación y postura continua",
    active: true,
  },
  {
    id: "plan-3x",
    name: "Plan 3 Clases x Semana",
    classesPerWeek: 3,
    price: 68000,
    description: "Máxima frecuencia y progresión intensiva de fuerza y flexibilidad",
    active: true,
  },
];
