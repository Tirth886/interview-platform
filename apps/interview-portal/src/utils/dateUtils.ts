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
 * Whether an ISO timestamp is still in the future (or equal to now).
 */
export const isNotExpired = (iso: string): boolean => {
  const value = new Date(iso).getTime();
  return !Number.isNaN(value) && Date.now() <= value;
};
