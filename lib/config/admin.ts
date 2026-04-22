// Admin signal thresholds — SSOT, no magic numbers in page files

/** Days since last check-in before patient is marked critical (has prior check-in history) */
export const NO_CHECKIN_CRITICAL_DAYS = 5;

/** Point drop in assessment overall score that triggers critical signal */
export const SCORE_DROP_CRITICAL = 10;

/** Days after registration where no activity is expected (new patient grace period) */
export const NEW_PATIENT_GRACE_DAYS = 3;

/** Days of check-in history to fetch for sparkline and signal computation */
export const SIGNAL_CHECKIN_WINDOW_DAYS = 7;

export const PATIENT_SIGNAL_VALUES = ["critical", "attention", "active", "new"] as const;
export type PatientSignal = (typeof PATIENT_SIGNAL_VALUES)[number];

/** Named constants for patient signal values — use in comparisons instead of string literals */
export const PATIENT_SIGNAL = {
  critical: "critical",
  attention: "attention",
  active: "active",
  new: "new",
} as const satisfies Record<PatientSignal, PatientSignal>;

/** Check-in metric keys that can be linked to clinical goals */
export const CHECKIN_GOAL_METRICS = ["focus", "mood", "energy", "sleep", "stress"] as const;
export type CheckinGoalMetric = (typeof CHECKIN_GOAL_METRICS)[number];

/** Sort order for signal severity — lower = shown first */
export const SIGNAL_SORT_ORDER: Record<PatientSignal, number> = {
  critical: 0,
  attention: 1,
  active: 2,
  new: 3,
};

export const SIGNAL_LABELS: Record<PatientSignal, string> = {
  critical: "Critical",
  attention: "Attention",
  active: "Active",
  new: "New",
};

/** Average check-in wellbeing score (mood+energy+sleep, 1–5) below which a dip is flagged */
export const CHECKIN_DIP_ALERT_THRESHOLD = 2.5;

/** Number of consecutive days at or below the threshold before Manuel is alerted */
export const CHECKIN_DIP_ALERT_DAYS = 3;

/** Days of check-in history to include in weekly digest computations */
export const ACTIVE_CHECKIN_DAYS = 30;

/** Wellness sparkline level thresholds (avg of 5 metrics, 1–5 scale) */
export const SPARKLINE_LOW_THRESHOLD = 2.5;
export const SPARKLINE_MID_THRESHOLD = 3.5;

/** CSS variable for each signal severity — SSOT for signal color rendering */
export const SIGNAL_COLORS: Record<PatientSignal, string> = {
  critical: "var(--danger)",
  attention: "var(--warn)",
  active: "var(--teal)",
  new: "var(--muted)",
};
