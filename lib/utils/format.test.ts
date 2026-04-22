/// <reference types="vitest/globals" />
import {
  HOUR_MS,
  DAY_MS,
  formatDateShort,
  formatDateLong,
  formatDateNumeric,
  formatDateTime,
  formatDateMonthDay,
  formatDateISO,
} from "./format";

// Fixed reference date: 2 April 2025, 10:05 UTC
// Using UTC-based construction so the test is timezone-independent for the ISO function.
// For locale-formatted functions we construct from a local date string.
const REF_DATE = new Date("2025-04-02T10:05:00");
const REF_DATE_STR = "2025-04-02T10:05:00";

// ─── Constants ────────────────────────────────────────────────────────────────

describe("time constants", () => {
  it("HOUR_MS is 3 600 000 ms", () => {
    expect(HOUR_MS).toBe(3_600_000);
  });

  it("DAY_MS is 24 × HOUR_MS", () => {
    expect(DAY_MS).toBe(24 * HOUR_MS);
  });
});

// ─── formatDateShort ──────────────────────────────────────────────────────────

describe("formatDateShort", () => {
  it("formats a Date object to 'D Mon YYYY'", () => {
    expect(formatDateShort(REF_DATE)).toMatch(/^2 Apr 2025$/);
  });

  it("accepts a date string and produces the same output as a Date", () => {
    expect(formatDateShort(REF_DATE_STR)).toBe(formatDateShort(REF_DATE));
  });

  it("handles single-digit day without zero-padding", () => {
    expect(formatDateShort(new Date("2025-04-01T12:00:00"))).toMatch(/^1 Apr 2025$/);
  });
});

// ─── formatDateLong ───────────────────────────────────────────────────────────

describe("formatDateLong", () => {
  it("formats a Date object to 'D Month YYYY' with full month name", () => {
    expect(formatDateLong(REF_DATE)).toMatch(/^2 April 2025$/);
  });

  it("accepts a date string and produces the same output as a Date", () => {
    expect(formatDateLong(REF_DATE_STR)).toBe(formatDateLong(REF_DATE));
  });

  it("produces a different output from formatDateShort (full vs abbreviated month)", () => {
    expect(formatDateLong(REF_DATE)).not.toBe(formatDateShort(REF_DATE));
  });
});

// ─── formatDateNumeric ────────────────────────────────────────────────────────

describe("formatDateNumeric", () => {
  it("formats a Date object as numeric locale date (DD/MM/YYYY for en-GB)", () => {
    expect(formatDateNumeric(REF_DATE)).toMatch(/^02\/04\/2025$/);
  });

  it("accepts a date string and produces the same output as a Date", () => {
    expect(formatDateNumeric(REF_DATE_STR)).toBe(formatDateNumeric(REF_DATE));
  });
});

// ─── formatDateTime ───────────────────────────────────────────────────────────

describe("formatDateTime", () => {
  it("includes day, abbreviated month, hour and minute", () => {
    const result = formatDateTime(REF_DATE);
    expect(result).toMatch(/2 Apr/);
    expect(result).toMatch(/10:05/);
  });

  it("accepts a date string and produces the same output as a Date", () => {
    expect(formatDateTime(REF_DATE_STR)).toBe(formatDateTime(REF_DATE));
  });

  it("zero-pads minutes (05, not 5)", () => {
    expect(formatDateTime(REF_DATE)).toContain("10:05");
  });
});

// ─── formatDateMonthDay ───────────────────────────────────────────────────────

describe("formatDateMonthDay", () => {
  it("formats to 'D Mon' without year", () => {
    expect(formatDateMonthDay(REF_DATE)).toMatch(/^2 Apr$/);
  });

  it("accepts a date string and produces the same output as a Date", () => {
    expect(formatDateMonthDay(REF_DATE_STR)).toBe(formatDateMonthDay(REF_DATE));
  });

  it("does not include the year", () => {
    expect(formatDateMonthDay(REF_DATE)).not.toContain("2025");
  });
});

// ─── formatDateISO ────────────────────────────────────────────────────────────

describe("formatDateISO", () => {
  it("returns YYYY-MM-DD string", () => {
    // Use UTC midnight to avoid timezone ambiguity in the ISO slice
    const d = new Date("2025-04-02T00:00:00.000Z");
    expect(formatDateISO(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("is exactly 10 characters", () => {
    expect(formatDateISO(new Date("2025-04-02T00:00:00.000Z"))).toHaveLength(10);
  });

  it("contains the correct year", () => {
    expect(formatDateISO(new Date("2025-04-02T00:00:00.000Z"))).toContain("2025");
  });
});
