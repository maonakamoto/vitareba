// Date formatting utilities — SSOT for locale + format decisions

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

const LOCALE = "en-GB";

/** "2 Apr 2025" */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
}

/** "2 April 2025" */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" });
}

/** "02/04/2025" (numeric DD/MM/YYYY) */
export function formatDateNumeric(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE);
}

/** "2 Apr, 10:30" — for message timestamps */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(LOCALE, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** "2 Apr" — for chart axis labels where year is omitted for compactness */
export function formatDateMonthDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
}

/** ISO date string "YYYY-MM-DD" — for DB date column comparisons */
export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Human-readable relative date label for admin lists: "Today", "Yesterday", "Nd ago".
 * Accepts an ISO date string (YYYY-MM-DD) and a reference Date for testability.
 */
export function relativeDate(dateStr: string, now: Date): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = Math.floor((now.getTime() - d.getTime()) / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

/**
 * Returns the patient's display name: their name if set, otherwise the
 * local part of their email address, otherwise the fallback string.
 * Used wherever a human-readable name is needed for emails and alerts.
 */
export function displayName(
  name: string | null | undefined,
  email: string | null | undefined,
  fallback = "there"
): string {
  return name ?? email?.split("@")[0] ?? fallback;
}
