/// <reference types="vitest/globals" />
import { computeStreak } from "./checkin";

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
