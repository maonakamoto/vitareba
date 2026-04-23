import {
  type PatientSignal,
  PATIENT_SIGNAL,
  NO_CHECKIN_CRITICAL_DAYS,
  SCORE_DROP_CRITICAL,
  NEW_PATIENT_GRACE_DAYS,
  SPARKLINE_LOW_THRESHOLD,
  SPARKLINE_MID_THRESHOLD,
} from "@/lib/config/admin";
import { DAY_MS } from "@/lib/utils/format";
import { CHECKIN_SCALE_MAX } from "@/lib/config/portal";
import { BOOKING_STATUS, type BookingStatus } from "@/lib/config/booking-status";

type CheckinRow = {
  date: string; // YYYY-MM-DD
  sleep: number;
  energy: number;
  mood: number;
  focus: number;
  stress: number;
};

type AssessmentRow = {
  overallScore: number;
  completedAt: Date;
};

export type SignalInput = {
  registeredAt: Date;
  checkins: CheckinRow[];       // last N days, descending by date
  assessments: AssessmentRow[]; // latest 2, descending
  bookings: { id: string; status: BookingStatus }[];
  now?: Date;                   // injectable for tests; defaults to new Date()
};

export type SignalResult = {
  signal: PatientSignal;
  reason: string;
};

/** Wellness score per check-in day: 1–5 where 5 is best. Stress is inverted. */
export function wellnessAvg(c: CheckinRow): number {
  return (c.sleep + c.energy + c.mood + c.focus + (CHECKIN_SCALE_MAX + 1 - c.stress)) / 5;
}

export function computePatientSignal({
  registeredAt,
  checkins,
  assessments,
  bookings,
  now = new Date(),
}: SignalInput): SignalResult {
  const daysSinceRegistration = Math.floor(
    (now.getTime() - registeredAt.getTime()) / DAY_MS
  );

  // New: registered recently, no activity expected yet
  if (daysSinceRegistration < NEW_PATIENT_GRACE_DAYS) {
    return { signal: PATIENT_SIGNAL.new, reason: "Registered recently — grace period active" };
  }

  // Check-in based signals
  if (checkins.length > 0) {
    const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
    const lastCheckinDate = new Date(sorted[0].date + "T00:00:00");
    const daysSinceLast = Math.floor(
      (now.getTime() - lastCheckinDate.getTime()) / DAY_MS
    );

    // Critical: has check-in history but gone silent ≥ threshold days
    if (daysSinceLast >= NO_CHECKIN_CRITICAL_DAYS) {
      return {
        signal: PATIENT_SIGNAL.critical,
        reason: `No check-in for ${daysSinceLast} days (last: ${sorted[0].date})`,
      };
    }

    // Critical: last 3 days all show strictly declining wellness
    const last3 = sorted.slice(0, 3);
    if (last3.length === 3) {
      const [d0, d1, d2] = last3.map(wellnessAvg); // d0 = most recent
      if (d0 < d1 && d1 < d2) {
        return {
          signal: PATIENT_SIGNAL.critical,
          reason: `Wellness declining 3 consecutive days (${d2.toFixed(1)} → ${d1.toFixed(1)} → ${d0.toFixed(1)})`,
        };
      }
    }
  }

  // Critical: assessment score dropped significantly
  if (assessments.length >= 2) {
    const drop = assessments[0].overallScore - assessments[1].overallScore;
    if (drop < -SCORE_DROP_CRITICAL) {
      return {
        signal: PATIENT_SIGNAL.critical,
        reason: `Assessment score dropped ${Math.abs(drop)} points (${assessments[1].overallScore} → ${assessments[0].overallScore})`,
      };
    }
  }

  // Attention: registered but never taken assessment
  if (assessments.length === 0) {
    return { signal: PATIENT_SIGNAL.attention, reason: "No assessment taken yet" };
  }

  // Attention: has assessment but no active booking (confirmed or attended)
  const activeBookings = bookings.filter(
    (b) => b.status === BOOKING_STATUS.confirmed || b.status === BOOKING_STATUS.attended
  );
  if (activeBookings.length === 0) {
    return { signal: PATIENT_SIGNAL.attention, reason: "Assessment done — no booking yet" };
  }

  return { signal: PATIENT_SIGNAL.active, reason: "All signals normal" };
}

/**
 * Maps a wellness average (1–5 scale) to a CSS modifier class token:
 * "low" | "mid" | "high". Thresholds are sourced from admin config SSOT.
 */
export function sparkLevel(avg: number): "low" | "mid" | "high" {
  if (avg < SPARKLINE_LOW_THRESHOLD) return "low";
  if (avg < SPARKLINE_MID_THRESHOLD) return "mid";
  return "high";
}
