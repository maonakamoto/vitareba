import { computePatientSignal } from "./signals";
import { NEW_PATIENT_GRACE_DAYS, NO_CHECKIN_CRITICAL_DAYS, SCORE_DROP_CRITICAL } from "@/lib/config/admin";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date("2024-06-15T12:00:00Z");
  d.setDate(d.getDate() - n);
  return d;
}

const NOW = new Date("2024-06-15T12:00:00Z");

function dateStr(daysBack: number): string {
  const d = new Date("2024-06-15");
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

function checkin(daysBack: number, score: number) {
  // score 1–5; all dims equal for simplicity
  return {
    date: dateStr(daysBack),
    sleep: score,
    energy: score,
    mood: score,
    focus: score,
    stress: 6 - score, // inverted: high score = low stress
  };
}

const GOOD_ASSESSMENT = { overallScore: 75, completedAt: daysAgo(5) };
const DECENT_ASSESSMENT = { overallScore: 60, completedAt: daysAgo(30) };
const LOW_ASSESSMENT = { overallScore: 60 - SCORE_DROP_CRITICAL - 1, completedAt: daysAgo(1) };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("computePatientSignal", () => {
  it("returns 'new' when patient registered within grace period", () => {
    const result = computePatientSignal({
      registeredAt: daysAgo(NEW_PATIENT_GRACE_DAYS - 1),
      checkins: [],
      assessments: [],
      bookings: [],
      now: NOW,
    });
    expect(result.signal).toBe("new");
  });

  it("returns 'critical' when no check-in for >= threshold days", () => {
    const result = computePatientSignal({
      registeredAt: daysAgo(30),
      checkins: [checkin(NO_CHECKIN_CRITICAL_DAYS, 3)], // last checkin exactly at threshold
      assessments: [GOOD_ASSESSMENT],
      bookings: [{ id: "b1" }],
      now: NOW,
    });
    expect(result.signal).toBe("critical");
    expect(result.reason).toMatch(/No check-in/);
  });

  it("returns 'critical' when wellness declines 3 consecutive days", () => {
    const result = computePatientSignal({
      registeredAt: daysAgo(30),
      checkins: [
        checkin(0, 2), // most recent — worst
        checkin(1, 3),
        checkin(2, 4), // oldest of the 3 — best
      ],
      assessments: [GOOD_ASSESSMENT],
      bookings: [{ id: "b1" }],
      now: NOW,
    });
    expect(result.signal).toBe("critical");
    expect(result.reason).toMatch(/declining/);
  });

  it("does not flag critical when wellness is flat (not strictly declining)", () => {
    const result = computePatientSignal({
      registeredAt: daysAgo(30),
      checkins: [
        checkin(0, 3),
        checkin(1, 3), // same score — breaks strictly declining chain
        checkin(2, 4),
      ],
      assessments: [GOOD_ASSESSMENT],
      bookings: [{ id: "b1" }],
      now: NOW,
    });
    expect(result.signal).not.toBe("critical");
  });

  it("returns 'critical' when assessment score drops by more than threshold", () => {
    const result = computePatientSignal({
      registeredAt: daysAgo(30),
      checkins: [checkin(0, 3)],
      assessments: [
        LOW_ASSESSMENT,   // latest — dropped
        GOOD_ASSESSMENT,  // previous — was high
      ],
      bookings: [{ id: "b1" }],
      now: NOW,
    });
    expect(result.signal).toBe("critical");
    expect(result.reason).toMatch(/Assessment score dropped/);
  });

  it("returns 'attention' when no assessment taken (past grace period)", () => {
    const result = computePatientSignal({
      registeredAt: daysAgo(30),
      checkins: [checkin(0, 3)],
      assessments: [],
      bookings: [],
      now: NOW,
    });
    expect(result.signal).toBe("attention");
    expect(result.reason).toMatch(/No assessment/);
  });

  it("returns 'attention' when assessment done but no booking", () => {
    const result = computePatientSignal({
      registeredAt: daysAgo(30),
      checkins: [checkin(0, 3)],
      assessments: [GOOD_ASSESSMENT],
      bookings: [],
      now: NOW,
    });
    expect(result.signal).toBe("attention");
    expect(result.reason).toMatch(/no booking/);
  });

  it("returns 'active' when all conditions normal", () => {
    const result = computePatientSignal({
      registeredAt: daysAgo(30),
      checkins: [checkin(0, 3), checkin(1, 3), checkin(2, 3)],
      assessments: [GOOD_ASSESSMENT, DECENT_ASSESSMENT],
      bookings: [{ id: "b1" }],
      now: NOW,
    });
    expect(result.signal).toBe("active");
  });
});
