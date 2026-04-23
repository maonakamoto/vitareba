import { describe, it, expect } from "vitest";
import {
  PROGRAMME_ENUM_VALUES,
  PHASE_ENUM_VALUES,
  PROGRAMME_CONFIG,
  PHASE_CONFIG,
  type ProgrammeKey,
  type PhaseKey,
} from "./programmes";

describe("PROGRAMME_CONFIG integrity", () => {
  it("has an entry for every PROGRAMME_ENUM_VALUES item", () => {
    for (const key of PROGRAMME_ENUM_VALUES) {
      expect(PROGRAMME_CONFIG).toHaveProperty(key);
    }
  });

  it("has no extra entries beyond PROGRAMME_ENUM_VALUES", () => {
    const configKeys = Object.keys(PROGRAMME_CONFIG) as ProgrammeKey[];
    for (const key of configKeys) {
      expect(PROGRAMME_ENUM_VALUES).toContain(key);
    }
    expect(configKeys.length).toBe(PROGRAMME_ENUM_VALUES.length);
  });

  it("every entry has all required fields", () => {
    for (const key of PROGRAMME_ENUM_VALUES) {
      const entry = PROGRAMME_CONFIG[key];
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe("string");
      expect(entry.description.length).toBeGreaterThan(0);
      expect(typeof entry.duration).toBe("string");
      expect(typeof entry.price).toBe("string");
      expect(typeof entry.featured).toBe("boolean");
      expect(["primary", "outline"]).toContain(entry.btnStyle);
    }
  });

  it("exactly one programme is featured", () => {
    const featured = PROGRAMME_ENUM_VALUES.filter((k) => PROGRAMME_CONFIG[k].featured);
    expect(featured.length).toBe(1);
  });
});

describe("PHASE_CONFIG integrity", () => {
  it("has an entry for every PHASE_ENUM_VALUES item", () => {
    for (const key of PHASE_ENUM_VALUES) {
      expect(PHASE_CONFIG).toHaveProperty(key);
    }
  });

  it("has no extra entries beyond PHASE_ENUM_VALUES", () => {
    const configKeys = Object.keys(PHASE_CONFIG) as PhaseKey[];
    for (const key of configKeys) {
      expect(PHASE_ENUM_VALUES).toContain(key);
    }
    expect(configKeys.length).toBe(PHASE_ENUM_VALUES.length);
  });

  it("every entry has label and description", () => {
    for (const key of PHASE_ENUM_VALUES) {
      const entry = PHASE_CONFIG[key];
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe("string");
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it("covers all 6 lifecycle phases", () => {
    expect(PHASE_ENUM_VALUES).toContain("intake");
    expect(PHASE_ENUM_VALUES).toContain("assessment");
    expect(PHASE_ENUM_VALUES).toContain("planning");
    expect(PHASE_ENUM_VALUES).toContain("active");
    expect(PHASE_ENUM_VALUES).toContain("review");
    expect(PHASE_ENUM_VALUES).toContain("completed");
  });
});
