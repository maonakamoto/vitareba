/// <reference types="vitest/globals" />
import { goalCreateSchema, goalUpdateSchema, computeGoalProgress, goalProgressLabel } from "./goals";

// ─── goalCreateSchema ──────────────────────────────────────────────────────────

describe("goalCreateSchema", () => {
  it("accepts a minimal valid goal (title only)", () => {
    const result = goalCreateSchema.safeParse({ title: "Improve focus" });
    expect(result.success).toBe(true);
  });

  it("accepts a fully populated valid goal", () => {
    const result = goalCreateSchema.safeParse({
      title: "Improve focus",
      metric: "focus",
      baseline: 30,
      target: 75,
      current: 45,
      notes: "Track via weekly check-ins",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = goalCreateSchema.safeParse({ baseline: 10, target: 80 });
    expect(result.success).toBe(false);
  });

  it("rejects empty string title", () => {
    const result = goalCreateSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 300 characters", () => {
    const result = goalCreateSchema.safeParse({ title: "a".repeat(301) });
    expect(result.success).toBe(false);
  });

  it("accepts title at exactly 300 characters", () => {
    const result = goalCreateSchema.safeParse({ title: "a".repeat(300) });
    expect(result.success).toBe(true);
  });

  it("rejects metric over 50 characters", () => {
    const result = goalCreateSchema.safeParse({ title: "Goal", metric: "x".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("rejects numeric field above 100", () => {
    const result = goalCreateSchema.safeParse({ title: "Goal", target: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects numeric field below 0", () => {
    const result = goalCreateSchema.safeParse({ title: "Goal", baseline: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer numeric field", () => {
    const result = goalCreateSchema.safeParse({ title: "Goal", current: 45.5 });
    expect(result.success).toBe(false);
  });

  it("accepts 0 and 100 as boundary values for numeric fields", () => {
    const result = goalCreateSchema.safeParse({
      title: "Goal",
      baseline: 0,
      current: 0,
      target: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects notes over 2000 characters", () => {
    const result = goalCreateSchema.safeParse({ title: "Goal", notes: "n".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("accepts null for all optional nullable fields", () => {
    const result = goalCreateSchema.safeParse({
      title: "Goal",
      metric: null,
      baseline: null,
      target: null,
      current: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});

// ─── goalUpdateSchema ──────────────────────────────────────────────────────────

describe("goalUpdateSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = goalUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts a partial update (title only)", () => {
    const result = goalUpdateSchema.safeParse({ title: "New title" });
    expect(result.success).toBe(true);
  });

  it("accepts completed: true", () => {
    const result = goalUpdateSchema.safeParse({ completed: true });
    expect(result.success).toBe(true);
  });

  it("accepts completed: false", () => {
    const result = goalUpdateSchema.safeParse({ completed: false });
    expect(result.success).toBe(true);
  });

  it("accepts current score update only", () => {
    const result = goalUpdateSchema.safeParse({ current: 62 });
    expect(result.success).toBe(true);
  });

  it("rejects empty string title (still enforces min(1) when provided)", () => {
    const result = goalUpdateSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects numeric field out of range when provided", () => {
    const result = goalUpdateSchema.safeParse({ current: 150 });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean completed", () => {
    const result = goalUpdateSchema.safeParse({ completed: "yes" });
    expect(result.success).toBe(false);
  });

  it("accepts a full update with all fields", () => {
    const result = goalUpdateSchema.safeParse({
      title: "Updated goal",
      metric: "sleep",
      baseline: 20,
      target: 80,
      current: 50,
      notes: "Progress noted",
      completed: false,
    });
    expect(result.success).toBe(true);
  });
});

// ─── computeGoalProgress ──────────────────────────────────────────────────────

describe("computeGoalProgress", () => {
  // Core formula: ((current - baseline) / (target - baseline)) * 100

  it("returns 0% when current equals baseline", () => {
    expect(computeGoalProgress(20, 20, 80)).toBe(0);
  });

  it("returns 100% when current equals target", () => {
    expect(computeGoalProgress(20, 80, 80)).toBe(100);
  });

  it("returns 50% at the midpoint of the range", () => {
    expect(computeGoalProgress(20, 50, 80)).toBe(50);
  });

  it("returns 25% at a quarter of the range", () => {
    expect(computeGoalProgress(20, 35, 80)).toBe(25);
  });

  it("treats null baseline as 0 (default offset)", () => {
    expect(computeGoalProgress(null, 40, 80)).toBe(50);
  });

  it("treats undefined baseline as 0", () => {
    expect(computeGoalProgress(undefined, 40, 80)).toBe(50);
  });

  it("returns null when current is null (no data yet)", () => {
    expect(computeGoalProgress(20, null, 80)).toBeNull();
  });

  it("returns null when target is null (goal not fully defined)", () => {
    expect(computeGoalProgress(20, 50, null)).toBeNull();
  });

  it("returns null when range is zero (baseline equals target)", () => {
    expect(computeGoalProgress(50, 50, 50)).toBeNull();
  });

  it("clamps to 0 when current is below baseline (regression)", () => {
    expect(computeGoalProgress(30, 10, 80)).toBe(0);
  });

  it("clamps to 100 when current exceeds target (overachievement)", () => {
    expect(computeGoalProgress(20, 100, 80)).toBe(100);
  });

  it("is NOT current/target — baseline offset matters", () => {
    // Without baseline: 45/75 * 100 = 60%
    // With baseline 30: (45-30)/(75-30) * 100 = 15/45 * 100 ≈ 33%
    expect(computeGoalProgress(30, 45, 75)).toBe(33);
    expect(computeGoalProgress(30, 45, 75)).not.toBe(60);
  });

  it("rounds to the nearest integer", () => {
    // 1/3 * 100 = 33.33... → 33
    expect(computeGoalProgress(0, 1, 3)).toBe(33);
    // 2/3 * 100 = 66.66... → 67
    expect(computeGoalProgress(0, 2, 3)).toBe(67);
  });

  it("handles zero-based goals with no explicit baseline", () => {
    expect(computeGoalProgress(0, 40, 100)).toBe(40);
  });

  // ─── Descending goals (target < baseline) — e.g. "reduce stress 70 → 30" ────
  // Important: cron/signals uses computeGoalProgress to detect achievement;
  // any regression here would fire false "Goal achieved" emails.

  describe("descending goals (target < baseline)", () => {
    it("returns 0% at the (high) baseline", () => {
      expect(computeGoalProgress(70, 70, 30)).toBe(0);
    });

    it("returns 50% at the midpoint", () => {
      expect(computeGoalProgress(70, 50, 30)).toBe(50);
    });

    it("returns 100% when current reaches the (low) target", () => {
      expect(computeGoalProgress(70, 30, 30)).toBe(100);
    });

    it("clamps to 100% when current overshoots below the target", () => {
      expect(computeGoalProgress(70, 20, 30)).toBe(100);
    });

    it("clamps to 0% when current is above the baseline (worsened)", () => {
      expect(computeGoalProgress(70, 80, 30)).toBe(0);
    });
  });
});

// ─── goalProgressLabel ────────────────────────────────────────────────────────

describe("goalProgressLabel", () => {
  it("returns completion message at 100%", () => {
    expect(goalProgressLabel(100)).toBe("Goal reached — ready for review");
  });

  it("returns high-stretch message at 75% (threshold)", () => {
    expect(goalProgressLabel(75)).toBe("75% — in the final stretch");
  });

  it("returns high-stretch message above 75%", () => {
    expect(goalProgressLabel(90)).toBe("90% — in the final stretch");
  });

  it("returns momentum message at 40% (threshold)", () => {
    expect(goalProgressLabel(40)).toBe("40% — building momentum");
  });

  it("returns momentum message between 40% and 74%", () => {
    expect(goalProgressLabel(60)).toBe("60% — building momentum");
  });

  it("returns getting-started message below 40%", () => {
    expect(goalProgressLabel(20)).toBe("20% — just getting started");
  });

  it("returns getting-started message at 0%", () => {
    expect(goalProgressLabel(0)).toBe("0% — just getting started");
  });
});
