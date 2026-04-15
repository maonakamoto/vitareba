import { PROFILE_COMPLETION_FIELDS, PROFILE_COMPLETION_THRESHOLD, PROFILE_COMPLETION_LOWER_THRESHOLD } from "@/lib/config/portal";

/**
 * Returns a 0–100 integer representing how many of the 10 key clinical
 * profile fields are filled. Used for the patient dashboard bar and the
 * admin patient list column.
 */
export function computeProfileCompleteness(
  profile: Record<string, unknown> | null | undefined
): number {
  if (!profile) return 0;
  const filled = PROFILE_COMPLETION_FIELDS.filter(
    (f) => profile[f] != null && profile[f] !== ""
  ).length;
  return Math.round((filled / PROFILE_COMPLETION_FIELDS.length) * 100);
}

/**
 * Returns the CSS color variable for a given profile completeness percentage.
 * Thresholds sourced from SSOT constants — never hardcode 70/30 inline.
 */
export function profileCompletenessColor(pct: number): string {
  if (pct >= PROFILE_COMPLETION_THRESHOLD * 100) return "var(--teal)";
  if (pct >= PROFILE_COMPLETION_LOWER_THRESHOLD * 100) return "var(--warn)";
  return "var(--danger)";
}
