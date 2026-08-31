import { Shift, Booking, Instructor, Client, EmailLog, StudioSettings } from "@/types";

export const initialStudioSettings: StudioSettings = {
  studioName: "Selene Pilates",
  tagline: "Equilibrio, Fuerza y Movimiento Consciente",
  address: "Av. Alvear 1850, Recoleta, Buenos Aires",
  phone: "+54 11 4892-3300",
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
