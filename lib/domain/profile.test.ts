/// <reference types="vitest/globals" />
import { computeProfileCompleteness, profileCompletenessColor } from "./profile";

// ─── computeProfileCompleteness ───────────────────────────────────────────────

describe("computeProfileCompleteness", () => {
  it("returns 0 for null profile", () => {
    expect(computeProfileCompleteness(null)).toBe(0);
  });

  it("returns 0 for undefined profile", () => {
    expect(computeProfileCompleteness(undefined)).toBe(0);
  });

  it("returns 0 for empty profile object", () => {
    expect(computeProfileCompleteness({})).toBe(0);
  });

  it("returns 100 when all 10 clinical fields are filled", () => {
    const full = {
      dateOfBirth: "1990-01-01",
      city: "Zürich",
      occupation: "Engineer",
      mainConcern: "Focus issues",
      goals: "Improve productivity",
      diagnosisHistory: "ADHD diagnosis at 25",
      currentMedications: "None",
      currentSupplements: "Magnesium",
      sleepHoursAvg: 7,
      exerciseFrequency: "moderate",
    };
    expect(computeProfileCompleteness(full)).toBe(100);
  });

  it("returns 50 when exactly 5 of 10 fields are filled", () => {
    const half = {
      dateOfBirth: "1990-01-01",
      city: "Zürich",
      occupation: "Engineer",
      mainConcern: "Focus",
      goals: "Improve",
      // remaining 5 absent
    };
    expect(computeProfileCompleteness(half)).toBe(50);
  });

  it("does not count null field values", () => {
    const profile = {
      dateOfBirth: null,
      city: "Zürich",
    };
    expect(computeProfileCompleteness(profile)).toBe(10); // 1/10
  });

  it("does not count empty-string field values", () => {
    const profile = {
      dateOfBirth: "",
      city: "Zürich",
    };
    expect(computeProfileCompleteness(profile)).toBe(10); // 1/10
  });

  it("ignores extra fields not in the clinical field list", () => {
    const profile = {
      city: "Zürich",
      irrelevantField: "some value",
      anotherExtra: 42,
    };
    expect(computeProfileCompleteness(profile)).toBe(10); // only city counts
  });

  it("returns 10 for a single filled field", () => {
    expect(computeProfileCompleteness({ dateOfBirth: "1985-05-20" })).toBe(10);
  });

  it("treats numeric zero as a filled value (0 is valid for sleepHoursAvg)", () => {
    // 0 is not null/undefined/"" — it should count as filled
    expect(computeProfileCompleteness({ sleepHoursAvg: 0 })).toBe(10);
  });
});

// ─── profileCompletenessColor ─────────────────────────────────────────────────

describe("profileCompletenessColor", () => {
  it("returns teal at 70% (at the high threshold)", () => {
    expect(profileCompletenessColor(70)).toBe("var(--teal)");
  });

  it("returns teal above 70%", () => {
    expect(profileCompletenessColor(100)).toBe("var(--teal)");
    expect(profileCompletenessColor(80)).toBe("var(--teal)");
  });

  it("returns warn at 30% (at the lower threshold)", () => {
    expect(profileCompletenessColor(30)).toBe("var(--warn)");
  });

  it("returns warn between 30% and 70%", () => {
    expect(profileCompletenessColor(50)).toBe("var(--warn)");
    expect(profileCompletenessColor(69)).toBe("var(--warn)");
  });

  it("returns danger below 30%", () => {
    expect(profileCompletenessColor(0)).toBe("var(--danger)");
    expect(profileCompletenessColor(29)).toBe("var(--danger)");
  });
});
