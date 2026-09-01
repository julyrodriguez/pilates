export interface Discipline {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export type DisciplineType = 'reformer' | 'mat' | 'cadillac' | 'tower' | 'prenatal' | 'power' | string;

export type ShiftStatus = 'available' | 'almost_full' | 'full' | 'cancelled' | 'completed';

export type BookingStatus = 'confirmed' | 'cancelled' | 'attended' | 'no_show';

export interface Shift {
  id: string;
  title: string;
  discipline: DisciplineType;
  instructorId: string;
  instructorName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  bookedCount: number;
  price: number;
  status: ShiftStatus;
  room: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Todos los niveles';
  description?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  shiftId: string;
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  discipline: DisciplineType;
  instructorName: string;
  room: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  cancellationCode: string;
  status: BookingStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  notes?: string;
  price: number;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: DisciplineType[];
  bio: string;
  avatarUrl?: string;
  active: boolean;
  colorTag: string;
}

export interface Plan {
  id: string;
  name: string; // ej. "Plan 2x por semana"
  classesPerWeek: number; // 1, 2, 3, etc.
  price: number;
  description?: string;
  active: boolean;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  attendedBookings: number;
  cancelledBookings: number;
  lastBookingDate: string;
  healthNotes?: string;
  createdAt: string;
  // Membresía / Plan y Cobro
  planId?: string;
  planName?: string;
  planClassesPerWeek?: number;
  billingFrequency?: "weekly" | "monthly"; // Modalidad de cobro: Semanal o Mensual
  customPrice?: number; // Arancel personalizado
  paymentStatus?: "paid" | "pending" | "overdue";
  lastPaymentDate?: string;
  weeklyPayments?: Record<string, boolean>; // Estado de pago por semana (clave: fecha del lunes de la semana 'YYYY-MM-DD')
  monthlyPayments?: Record<string, boolean>; // Estado de pago por mes (clave: 'YYYY-MM')
  paymentNotes?: string;
}

export interface EmailLog {
  id: string;
  bookingId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  cancellationCode: string;
  cancellationUrl: string;
  sentAt: string;
  status: 'sent' | 'opened' | 'cancelled' | 'rescheduled';
  type?: 'confirmation' | 'cancellation' | 'rescheduled';
}

export interface StudioSettings {
  studioName: string;
  tagline: string;
  address: string;
  phone: string;
  instagram: string;
  cancellationWindowHours: number; // e.g. 2 hours before shift
  allowWaitlist: boolean;
  currency: string;
}

export interface FeedbackComment {
  id: string;
  authorName: string;
  authorRole: "Dueña / Estudio" | "Desarrollador (Julián)" | "Profesor / Staff" | "Otro";
  category: "idea" | "error" | "duda" | "general";
  content: string;
  createdAt: string;
  status: "pending" | "in_progress" | "resolved";
  reply?: string;
  replyAuthor?: string;
  replyAt?: string;
}
