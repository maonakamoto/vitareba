import { z } from "zod";
import { formatDateISO } from "@/lib/utils/format";
import { CHECKIN_SCALE_MIN, CHECKIN_SCALE_MAX, CHECKIN_NOTES_MAX_LENGTH } from "@/lib/config/portal";

/** Single metric: integer on the 1–5 scale */
export const metricSchema = z.number().int().min(CHECKIN_SCALE_MIN).max(CHECKIN_SCALE_MAX);

/** Validates a complete daily check-in submission */
export const checkinSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleep: metricSchema,
  energy: metricSchema,
  mood: metricSchema,
  focus: metricSchema,
  stress: metricSchema,
  notes: z.string().max(CHECKIN_NOTES_MAX_LENGTH).optional(),
});

/**
 * Normalize a raw 1–5 check-in metric value to the 0–100 integer scale used
 * for goal tracking and progress display.
 */
export function normalizeCheckinMetric(raw: number): number {
  return Math.round(((raw - CHECKIN_SCALE_MIN) / (CHECKIN_SCALE_MAX - CHECKIN_SCALE_MIN)) * 100);
}

/**
 * Compute the current consecutive daily check-in streak.
 * Streak counts backwards from today: if today is checked in → 1+,
 * if yesterday is also checked in → 2+, etc.
 * Gaps reset the streak to zero.
 *
 * @param checkins - Check-in records; only the `date` (YYYY-MM-DD) field is required.
 * @param now      - Injectable for tests; defaults to the current date.
 */
export function computeStreak(
  checkins: { date: string }[],
  now: Date = new Date()
): number {
  if (checkins.length === 0) return 0;

  const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  const today = formatDateISO(now);

  let streak = 0;
  let expected = today;

  for (const c of sorted) {
    if (c.date === expected) {
      streak++;
      // Use UTC midnight to avoid DST / timezone crossing when stepping back one day
      const prev = new Date(expected + "T00:00:00.000Z");
      prev.setUTCDate(prev.getUTCDate() - 1);
      expected = prev.toISOString().slice(0, 10);
    } else {
      break;
    }
  }

  return streak;
}
