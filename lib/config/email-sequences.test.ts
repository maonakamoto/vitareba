/// <reference types="vitest/globals" />
import { describe, it, expect } from "vitest";
import {
  ASSESSMENT_EMAIL_SEQUENCE,
  WELCOME_EMAIL_SEQUENCE,
  EMAIL_TEMPLATE,
} from "./email-sequences";

describe("ASSESSMENT_EMAIL_SEQUENCE", () => {
  it("first step is assessmentResults with delayMs=0 (immediate)", () => {
    const first = ASSESSMENT_EMAIL_SEQUENCE[0];
    expect(first.templateKey).toBe("assessmentResults");
    expect(first.delayMs).toBe(0);
  });

  it("subsequent steps have non-zero delay (nurture sequence)", () => {
    const nurture = ASSESSMENT_EMAIL_SEQUENCE.slice(1);
    for (const step of nurture) {
      expect(step.delayMs).toBeGreaterThan(0);
    }
  });

  it("filtering by delayMs===0 yields only the immediate results email (retake logic)", () => {
    const retakeSequence = ASSESSMENT_EMAIL_SEQUENCE.filter((s) => s.delayMs === 0);
    expect(retakeSequence).toHaveLength(1);
    expect(retakeSequence[0].templateKey).toBe("assessmentResults");
  });

  it("full sequence has 3 steps (results + meaning + booking)", () => {
    expect(ASSESSMENT_EMAIL_SEQUENCE).toHaveLength(3);
  });

  it("template keys are unique", () => {
    const keys = ASSESSMENT_EMAIL_SEQUENCE.map((s) => s.templateKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("steps are ordered by ascending delay", () => {
    const delays = ASSESSMENT_EMAIL_SEQUENCE.map((s) => s.delayMs);
    const sorted = [...delays].sort((a, b) => a - b);
    expect(delays).toEqual(sorted);
  });
});

describe("WELCOME_EMAIL_SEQUENCE", () => {
  it("first step is welcomePatient with delayMs=0 (immediate)", () => {
    const first = WELCOME_EMAIL_SEQUENCE[0];
    expect(first.templateKey).toBe("welcomePatient");
    expect(first.delayMs).toBe(0);
  });

  it("has 3 steps (welcome + profileCompletion + assessmentCta)", () => {
    expect(WELCOME_EMAIL_SEQUENCE).toHaveLength(3);
  });

  it("template keys are unique", () => {
    const keys = WELCOME_EMAIL_SEQUENCE.map((s) => s.templateKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("steps are ordered by ascending delay", () => {
    const delays = WELCOME_EMAIL_SEQUENCE.map((s) => s.delayMs);
    const sorted = [...delays].sort((a, b) => a - b);
    expect(delays).toEqual(sorted);
  });
});

describe("EMAIL_TEMPLATE constants", () => {
  it("all assessment template keys are present", () => {
    expect(EMAIL_TEMPLATE.assessmentResults).toBe("assessmentResults");
    expect(EMAIL_TEMPLATE.assessmentMeaning).toBe("assessmentMeaning");
    expect(EMAIL_TEMPLATE.assessmentBooking).toBe("assessmentBooking");
  });

  it("all welcome template keys are present", () => {
    expect(EMAIL_TEMPLATE.welcomePatient).toBe("welcomePatient");
    expect(EMAIL_TEMPLATE.profileCompletion).toBe("profileCompletion");
    expect(EMAIL_TEMPLATE.assessmentCta).toBe("assessmentCta");
  });

  it("key values match their key names (self-referential for typo safety)", () => {
    for (const [key, value] of Object.entries(EMAIL_TEMPLATE)) {
      expect(value).toBe(key);
    }
  });
});
