import { Booking } from "@/types";

/**
 * Normaliza un string para búsquedas: minúsculas, sin acentos ni diacríticos, sin espacios sobrantes.
 */
export function normalizeSearchString(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Genera una lista de tokens y prefijos (de longitud >= 3) a partir de los datos de una reserva,
 * permitiendo búsquedas ultrarrápidas y económicas en Firestore mediante `array-contains`.
 */
export function generateBookingSearchKeywords(data: Partial<Booking>): string[] {
  const tokens = new Set<string>();

  const rawFields = [
    data.clientName,
    data.clientEmail,
    data.clientPhone,
    data.cancellationCode,
    data.shiftTitle,
    data.instructorName,
  ].filter(Boolean) as string[];

  for (const raw of rawFields) {
    const cleanRaw = raw.toLowerCase().trim();
    const cleanNorm = normalizeSearchString(raw);

    const variants = cleanRaw === cleanNorm ? [cleanRaw] : [cleanRaw, cleanNorm];

    for (const v of variants) {
      // Separar por palabras y delimitadores comunes (espacios, arroba, guiones, puntos)
      const parts = v.split(/[\s@._\-]+/);
      for (const part of parts) {
        if (part.length >= 3) {
          for (let i = 3; i <= Math.min(part.length, 25); i++) {
            tokens.add(part.substring(0, i));
          }
        }
      }

      // Prefijos directos del token completo (por ej. para códigos como "PIL-JULI-T44N")
      if (v.length >= 3 && v.length <= 30) {
        for (let i = 3; i <= v.length; i++) {
          tokens.add(v.substring(0, i));
        }
      }
    }
  }

  return Array.from(tokens);
}
