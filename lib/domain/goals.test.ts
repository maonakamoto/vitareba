/// <reference types="vitest/globals" />
import { goalCreateSchema, goalUpdateSchema } from "./goals";

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
