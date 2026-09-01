import { Shift, Booking, Instructor, Client, EmailLog, StudioSettings, Plan, Discipline } from "@/types";

export const initialStudioSettings: StudioSettings = {
  studioName: "Selene Pilates",
  tagline: "",
  address: "Cesar Diaz 3031, CABA",
  phone: "",
  instagram: "@selene.pilates",
  cancellationWindowHours: 3,
  allowWaitlist: true,
  currency: "ARS",
};

export const initialInstructors: Instructor[] = [];
export const initialShifts: Shift[] = [];
export const initialBookings: Booking[] = [];
export const initialClients: Client[] = [];
export const initialEmailLogs: EmailLog[] = [];

export const initialDisciplines: Discipline[] = [];
export const initialPlans: Plan[] = [];
