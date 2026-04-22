/// <reference types="vitest/globals" />
import { scoreColor, getVerdict, getVerdictName, getInterpretation, VERDICT_TIERS, DIMENSIONS } from "./data";

// ─── scoreColor ───────────────────────────────────────────────────────────────

describe("scoreColor", () => {
  it("returns teal at score 60 (lower boundary)", () => {
    expect(scoreColor(60)).toBe("var(--teal)");
  });

  it("returns teal above 60", () => {
    expect(scoreColor(100)).toBe("var(--teal)");
    expect(scoreColor(75)).toBe("var(--teal)");
  });

  it("returns warn at score 40 (lower boundary)", () => {
    expect(scoreColor(40)).toBe("var(--warn)");
  });

  it("returns warn between 40 and 59", () => {
    expect(scoreColor(59)).toBe("var(--warn)");
    expect(scoreColor(50)).toBe("var(--warn)");
  });

  it("returns danger below 40", () => {
    expect(scoreColor(0)).toBe("var(--danger)");
    expect(scoreColor(39)).toBe("var(--danger)");
  });
});

// ─── getVerdict ───────────────────────────────────────────────────────────────

describe("getVerdict", () => {
  it("returns Deep Friction for score 0", () => {
    expect(getVerdict(0).name).toBe("Deep Friction");
  });

  it("returns Deep Friction at score 35 (upper boundary)", () => {
    expect(getVerdict(35).name).toBe("Deep Friction");
  });

  it("returns Managed Tension at score 36 (lower boundary)", () => {
    expect(getVerdict(36).name).toBe("Managed Tension");
  });

  it("returns Managed Tension at score 55 (upper boundary)", () => {
    expect(getVerdict(55).name).toBe("Managed Tension");
  });

  it("returns Asymmetric Performance at score 56 (lower boundary)", () => {
    expect(getVerdict(56).name).toBe("Asymmetric Performance");
  });

  it("returns Asymmetric Performance at score 75 (upper boundary)", () => {
    expect(getVerdict(75).name).toBe("Asymmetric Performance");
  });

  it("returns Optimised Neurotype at score 76 (lower boundary)", () => {
    expect(getVerdict(76).name).toBe("Optimised Neurotype");
  });

  it("returns Optimised Neurotype at score 100", () => {
    expect(getVerdict(100).name).toBe("Optimised Neurotype");
  });

  it("falls back to lowest tier for out-of-range score", () => {
    // VERDICT_TIERS[0] is Deep Friction
    expect(getVerdict(999).name).toBe(VERDICT_TIERS[0].name);
  });

  it("covers all four tiers (no gaps between tiers)", () => {
    const names = new Set(Array.from({ length: 101 }, (_, i) => getVerdict(i).name));
    expect(names.size).toBe(4);
  });
});

// ─── getVerdictName ───────────────────────────────────────────────────────────

describe("getVerdictName", () => {
  it("returns a string matching the tier name", () => {
    expect(getVerdictName(20)).toBe("Deep Friction");
    expect(getVerdictName(45)).toBe("Managed Tension");
    expect(getVerdictName(65)).toBe("Asymmetric Performance");
    expect(getVerdictName(90)).toBe("Optimised Neurotype");
  });
});

// ─── getInterpretation ────────────────────────────────────────────────────────

describe("getInterpretation", () => {
  it("returns a non-empty string for every dimension at score 0", () => {
    for (const dim of DIMENSIONS) {
      const text = getInterpretation(dim.id, 0);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("returns a non-empty string for every dimension at score 100", () => {
    for (const dim of DIMENSIONS) {
      const text = getInterpretation(dim.id, 100);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("returns a non-empty string for every dimension at midpoint (50)", () => {
    for (const dim of DIMENSIONS) {
      const text = getInterpretation(dim.id, 50);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("returns empty string for unknown dimension id", () => {
    expect(getInterpretation("nonexistent", 50)).toBe("");
  });
});
