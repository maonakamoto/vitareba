/// <reference types="vitest/globals" />
import { buildAssessmentEmailRows, buildWelcomeEmailRows } from "./email-queue";
import { ASSESSMENT_EMAIL_SEQUENCE, WELCOME_EMAIL_SEQUENCE } from "@/lib/config/email-sequences";
import { HOUR_MS, DAY_MS } from "@/lib/utils/format";

const TRIGGERED_AT = new Date("2025-06-01T10:00:00.000Z");
const USER_ID = "user-abc-123";

// ─── buildAssessmentEmailRows ─────────────────────────────────────────────────

describe("buildAssessmentEmailRows", () => {
  const baseParams = {
    userId: USER_ID,
    overallScore: 72,
    scores: { arousal: 68, divergent: 75, hyperfocus: 80, volatility: 65, environment: 72 },
    triggeredAt: TRIGGERED_AT,
  };

  describe("first assessment (default)", () => {
    it("returns one row per step in the full sequence", () => {
      const rows = buildAssessmentEmailRows({ ...baseParams });
      expect(rows).toHaveLength(ASSESSMENT_EMAIL_SEQUENCE.length);
    });

    it("first row has templateKey 'assessmentResults' and sendAt = triggeredAt", () => {
      const rows = buildAssessmentEmailRows({ ...baseParams });
      expect(rows[0].templateKey).toBe("assessmentResults");
      expect(rows[0].sendAt.getTime()).toBe(TRIGGERED_AT.getTime());
    });

    it("second row is delayed by 48 hours", () => {
      const rows = buildAssessmentEmailRows({ ...baseParams });
      expect(rows[1].templateKey).toBe("assessmentMeaning");
      expect(rows[1].sendAt.getTime()).toBe(TRIGGERED_AT.getTime() + 48 * HOUR_MS);
    });

    it("third row is delayed by 5 days", () => {
      const rows = buildAssessmentEmailRows({ ...baseParams });
      expect(rows[2].templateKey).toBe("assessmentBooking");
      expect(rows[2].sendAt.getTime()).toBe(TRIGGERED_AT.getTime() + 5 * DAY_MS);
    });

    it("all rows carry the correct userId", () => {
      const rows = buildAssessmentEmailRows({ ...baseParams });
      expect(rows.every((r) => r.userId === USER_ID)).toBe(true);
    });

    it("all rows carry overallScore and scores in payload", () => {
      const rows = buildAssessmentEmailRows({ ...baseParams });
      for (const row of rows) {
        expect(row.payload.overallScore).toBe(72);
        expect(row.payload.scores).toEqual(baseParams.scores);
      }
    });
  });

  describe("retake assessment (isFirstAssessment = false)", () => {
    it("returns only the immediate step (delayMs === 0)", () => {
      const rows = buildAssessmentEmailRows({ ...baseParams, isFirstAssessment: false });
      expect(rows).toHaveLength(1);
    });

    it("the single row is the immediate results email", () => {
      const rows = buildAssessmentEmailRows({ ...baseParams, isFirstAssessment: false });
      expect(rows[0].templateKey).toBe("assessmentResults");
      expect(rows[0].sendAt.getTime()).toBe(TRIGGERED_AT.getTime());
    });

    it("does NOT include the nurture-sequence steps", () => {
      const rows = buildAssessmentEmailRows({ ...baseParams, isFirstAssessment: false });
      const keys = rows.map((r) => r.templateKey);
      expect(keys).not.toContain("assessmentMeaning");
      expect(keys).not.toContain("assessmentBooking");
    });
  });

  it("explicit isFirstAssessment = true behaves identically to the default", () => {
    const defaultRows = buildAssessmentEmailRows({ ...baseParams });
    const explicitRows = buildAssessmentEmailRows({ ...baseParams, isFirstAssessment: true });
    expect(defaultRows).toEqual(explicitRows);
  });
});

// ─── buildWelcomeEmailRows ────────────────────────────────────────────────────

describe("buildWelcomeEmailRows", () => {
  const baseParams = { userId: USER_ID, triggeredAt: TRIGGERED_AT };

  it("returns one row per step in the welcome sequence", () => {
    const rows = buildWelcomeEmailRows(baseParams);
    expect(rows).toHaveLength(WELCOME_EMAIL_SEQUENCE.length);
  });

  it("first row has templateKey 'welcomePatient' and sendAt = triggeredAt", () => {
    const rows = buildWelcomeEmailRows(baseParams);
    expect(rows[0].templateKey).toBe("welcomePatient");
    expect(rows[0].sendAt.getTime()).toBe(TRIGGERED_AT.getTime());
  });

  it("second row is delayed by 24 hours", () => {
    const rows = buildWelcomeEmailRows(baseParams);
    expect(rows[1].templateKey).toBe("profileCompletion");
    expect(rows[1].sendAt.getTime()).toBe(TRIGGERED_AT.getTime() + 24 * HOUR_MS);
  });

  it("third row is delayed by 72 hours", () => {
    const rows = buildWelcomeEmailRows(baseParams);
    expect(rows[2].templateKey).toBe("assessmentCta");
    expect(rows[2].sendAt.getTime()).toBe(TRIGGERED_AT.getTime() + 72 * HOUR_MS);
  });

  it("all rows carry the correct userId", () => {
    const rows = buildWelcomeEmailRows(baseParams);
    expect(rows.every((r) => r.userId === USER_ID)).toBe(true);
  });

  it("all rows have an empty payload object", () => {
    const rows = buildWelcomeEmailRows(baseParams);
    expect(rows.every((r) => Object.keys(r.payload).length === 0)).toBe(true);
  });
});
