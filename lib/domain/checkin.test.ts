/// <reference types="vitest/globals" />
import { computeStreak, streakMessage, normalizeCheckinMetric } from "./checkin";

// Fixed reference "today": 2025-04-10
const TODAY = new Date("2025-04-10T12:00:00");

function d(offset: number): string {
  // Returns a YYYY-MM-DD string offset days before TODAY
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
}

// ─── computeStreak ────────────────────────────────────────────────────────────

describe("computeStreak", () => {
  it("returns 0 for empty check-in list", () => {
    expect(computeStreak([], TODAY)).toBe(0);
  });

  it("returns 1 when only today is checked in", () => {
    expect(computeStreak([{ date: d(0) }], TODAY)).toBe(1);
  });

  it("returns 0 when most recent check-in was yesterday (no today entry)", () => {
    expect(computeStreak([{ date: d(-1) }], TODAY)).toBe(0);
  });

  it("returns 3 for three consecutive days ending today", () => {
    const checkins = [{ date: d(0) }, { date: d(-1) }, { date: d(-2) }];
    expect(computeStreak(checkins, TODAY)).toBe(3);
  });

  it("stops at a gap — does not count days before the gap", () => {
    // Today + 3 days ago (gap: yesterday and 2 days ago missing)
    const checkins = [{ date: d(0) }, { date: d(-3) }];
    expect(computeStreak(checkins, TODAY)).toBe(1);
  });

  it("handles unsorted input (sorts internally)", () => {
    const checkins = [{ date: d(-2) }, { date: d(0) }, { date: d(-1) }];
    expect(computeStreak(checkins, TODAY)).toBe(3);
  });

  it("returns 7 for a full week streak", () => {
    const checkins = Array.from({ length: 7 }, (_, i) => ({ date: d(-i) }));
    expect(computeStreak(checkins, TODAY)).toBe(7);
  });

  it("counts only from the most recent contiguous block", () => {
    // 3 days, gap, then 2 more — streak should be 3
    const checkins = [
      { date: d(0) }, { date: d(-1) }, { date: d(-2) },
      { date: d(-5) }, { date: d(-6) },
    ];
    expect(computeStreak(checkins, TODAY)).toBe(3);
  });

  it("ignores extra fields on check-in objects", () => {
    const checkins = [
      { date: d(0), sleep: 4, energy: 3, mood: 4, focus: 5, stress: 2 },
      { date: d(-1), sleep: 3, energy: 4, mood: 3, focus: 4, stress: 3 },
    ];
    expect(computeStreak(checkins, TODAY)).toBe(2);
  });

  it("does not mutate the input array", () => {
    const checkins = [{ date: d(-2) }, { date: d(0) }, { date: d(-1) }];
    const copy = [...checkins.map((c) => ({ ...c }))];
    computeStreak(checkins, TODAY);
    expect(checkins).toEqual(copy);
  });

  it("returns 30 for a 30-day streak", () => {
    const checkins = Array.from({ length: 30 }, (_, i) => ({ date: d(-i) }));
    expect(computeStreak(checkins, TODAY)).toBe(30);
  });
});

// ─── normalizeCheckinMetric ───────────────────────────────────────────────────

describe("normalizeCheckinMetric", () => {
  it("normalizes scale minimum (1) to 0", () => {
    expect(normalizeCheckinMetric(1)).toBe(0);
  });

  it("normalizes scale maximum (5) to 100", () => {
    expect(normalizeCheckinMetric(5)).toBe(100);
  });

  it("normalizes midpoint (3) to 50", () => {
    expect(normalizeCheckinMetric(3)).toBe(50);
  });

  it("normalizes 2 to 25", () => {
    expect(normalizeCheckinMetric(2)).toBe(25);
  });

  it("normalizes 4 to 75", () => {
    expect(normalizeCheckinMetric(4)).toBe(75);
  });

  it("returns an integer (Math.round applied)", () => {
    // 1.5 on a 1–5 scale → (0.5 / 4) * 100 = 12.5 → rounds to 13
    expect(normalizeCheckinMetric(1.5)).toBe(13);
  });
});

// ─── streakMessage ────────────────────────────────────────────────────────────

describe("streakMessage", () => {
  it("returns first-day message for streak of 1", () => {
    expect(streakMessage(1)).toContain("First data point");
  });

  it("returns first-day message for streak of 0", () => {
    expect(streakMessage(0)).toContain("First data point");
  });

  it("returns 2-day message for streak of 2", () => {
    expect(streakMessage(2)).toContain("2 days running");
  });

  it("returns pattern message for streaks 3–6", () => {
    expect(streakMessage(3)).toContain("3 days in a row");
    expect(streakMessage(6)).toContain("6 days in a row");
  });

  it("returns week message for streaks 7–13", () => {
    expect(streakMessage(7)).toContain("full week");
    expect(streakMessage(13)).toContain("13-day streak");
  });

  it("returns two-week message for streaks 14–29", () => {
    expect(streakMessage(14)).toContain("two weeks");
    expect(streakMessage(29)).toContain("29-day streak");
  });

  it("returns elite message for streaks ≥ 30", () => {
    expect(streakMessage(30)).toContain("elite");
    expect(streakMessage(100)).toContain("elite");
  });
});
