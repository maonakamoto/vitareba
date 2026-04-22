import { formatDateISO } from "@/lib/utils/format";

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
