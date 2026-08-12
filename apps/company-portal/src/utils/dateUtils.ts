/**
 * Global date utility functions
 * Can be used throughout the application for date manipulation and formatting
 */

export const dayMs = 24 * 60 * 60 * 1000;

/**
 * Get the start of a day (00:00:00)
 */
export const atDayStart = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

/**
 * Add days to a date
 */
export const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

/**
 * Format date as short string (e.g., "Jan 5")
 */
export const formatDateShort = (value: Date): string =>
  value.toLocaleDateString(undefined, { month: "short", day: "numeric" });

/**
 * Check if a timestamp (ISO string) falls within a date window
 */
export const inWindow = (iso: string, start: Date, end: Date): boolean => {
  const ts = new Date(iso).getTime();
  return ts >= start.getTime() && ts < end.getTime();
};

/**
 * Format datetime as "YYYY-MM-DD HH:MM" (removes seconds and timezone)
 * @example formatDateTime("2025-08-13T14:30:45.123Z") => "2025-08-13 14:30"
 */
export const formatDateTime = (value: string): string => value.replace("T", " ").slice(0, 16);

/**
 * Format datetime for display (e.g., "Aug 13, 2026, 02:30 PM")
 */
export const formatDateTimeDisplay = (iso: string): string => {
  const value = new Date(iso);
  return value.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Convert an ISO timestamp to a local `datetime-local` input value
 */
export const toLocalDateTimeValue = (iso: string): string => {
  const value = new Date(iso);
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

/**
 * Get Monday-based start of the week for a date
 */
export const startOfWeek = (value: Date): Date => {
  const dayStart = atDayStart(value);
  const day = dayStart.getDay();
  const shift = day === 0 ? -6 : 1 - day;
  return addDays(dayStart, shift);
};

/**
 * Get the first day of the month
 */
export const startOfMonth = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth(), 1);

/**
 * Get the last day of the month
 */
export const endOfMonth = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth() + 1, 0);

/**
 * Check whether two dates fall on the same calendar day
 */
export const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();
