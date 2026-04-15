// Portal-wide constants — single source of truth for all magic numbers

/** How many recent assessments to load for delta calculation on the dashboard */
export const RECENT_ASSESSMENTS_LIMIT = 2;

/** How long (ms) to show a "Saved ✓" success indicator before resetting */
export const SAVED_FEEDBACK_MS = 3_000;

/** Daily check-in scale: 1 = worst, 5 = best (except stress: 1 = none, 5 = high) */
export const CHECKIN_SCALE_MIN = 1;
export const CHECKIN_SCALE_MAX = 5;

/** How many days of check-in history to display in the trend chart */
export const CHECKIN_HISTORY_DAYS = 30;

/** Exercise frequency options — SSOT for select/display */
export const EXERCISE_FREQUENCY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "light", label: "Light (1–2× / week)" },
  { value: "moderate", label: "Moderate (3× / week)" },
  { value: "regular", label: "Regular (4–5× / week)" },
  { value: "intense", label: "Intense (daily / 2×/day)" },
] as const;

export type ExerciseFrequency = (typeof EXERCISE_FREQUENCY_OPTIONS)[number]["value"];

/** Sleep hours range for the profile selector */
export const SLEEP_HOURS_MIN = 3;
export const SLEEP_HOURS_MAX = 12;

/** The 10 clinical fields that count toward profile completeness */
export const PROFILE_COMPLETION_FIELDS = [
  "dateOfBirth",
  "city",
  "occupation",
  "mainConcern",
  "goals",
  "diagnosisHistory",
  "currentMedications",
  "currentSupplements",
  "sleepHoursAvg",
  "exerciseFrequency",
] as const;

/** Fraction of PROFILE_COMPLETION_FIELDS filled before admin is notified */
export const PROFILE_COMPLETION_THRESHOLD = 0.7;

/** Below this fraction the profile completeness indicator shows a warning color */
export const PROFILE_COMPLETION_LOWER_THRESHOLD = 0.3;
