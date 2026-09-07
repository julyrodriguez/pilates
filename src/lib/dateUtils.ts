/**
 * Parsea fecha (YYYY-MM-DD) y hora (HH:mm o H:mm) en un objeto Date local fiable.
 */
export function parseShiftDateTime(dateStr?: string, timeStr?: string): Date {
  if (!dateStr) return new Date(NaN);
  const [year, month, day] = dateStr.split("-").map(Number);
  const timeParts = (timeStr || "00:00").split(":");
  const hours = parseInt(timeParts[0], 10) || 0;
  const minutes = parseInt(timeParts[1], 10) || 0;
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Devuelve true únicamente si el turno está en el futuro respecto al momento actual.
 */
export function isShiftInFuture(dateStr?: string, timeStr?: string): boolean {
  const dt = parseShiftDateTime(dateStr, timeStr);
  if (isNaN(dt.getTime())) return false;
  return dt.getTime() > Date.now();
}

/**
 * Devuelve true si el turno ya ha comenzado o finalizado en el pasado.
 */
export function isShiftPast(dateStr?: string, timeStr?: string): boolean {
  const dt = parseShiftDateTime(dateStr, timeStr);
  if (isNaN(dt.getTime())) return true;
  return dt.getTime() <= Date.now();
}

/**
 * Devuelve las horas restantes hasta el inicio del turno.
 * Devuelve un número negativo si ya pasó.
 */
export function getHoursUntilShift(dateStr?: string, timeStr?: string): number {
  const dt = parseShiftDateTime(dateStr, timeStr);
  if (isNaN(dt.getTime())) return -999;
  return (dt.getTime() - Date.now()) / (1000 * 60 * 60);
}
