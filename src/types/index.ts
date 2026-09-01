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
  status: 'sent' | 'opened';
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
