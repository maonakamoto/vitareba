import { describe, it, expect } from "vitest";
import {
  bookingRequestAdminEmail,
  bookingConfirmedEmail,
  bookingCancelledEmail,
  passwordResetEmail,
  newMessageEmail,
  welcomePatientEmail,
  profileCompletionEmail,
  assessmentCtaEmail,
  criticalPatientAlertEmail,
  assessmentResultsEmail,
  assessmentMeaningEmail,
  assessmentBookingEmail,
  weeklyDigestEmail,
  checkinReminderEmail,
  checkinDipAlertEmail,
  profileCompletedAdminEmail,
  checkinStreakMilestoneEmail,
} from "./templates";

// All templates return valid HTML wrapping the VitaReBa layout
function isHtml(s: string) {
  return s.startsWith("<!DOCTYPE html>") && s.includes("</html>");
}

describe("email templates — structure", () => {
  it("bookingRequestAdminEmail returns html", () => {
    const html = bookingRequestAdminEmail({
      patientName: "Anna Müller",
      patientEmail: "anna@example.com",
      bookingTypeLabel: "Consultation",
      notes: "Prefer mornings",
      preferredDate: "2026-05-01",
      adminUrl: "https://vitareba.ch/admin/patients/1",
    });
    expect(isHtml(html)).toBe(true);
  });

  it("bookingConfirmedEmail returns html", () => {
    expect(isHtml(bookingConfirmedEmail({ patientName: "Anna", portalUrl: "https://p.example.com" }))).toBe(true);
  });

  it("bookingCancelledEmail returns html", () => {
    expect(isHtml(bookingCancelledEmail({ patientName: "Anna", portalUrl: "https://p.example.com" }))).toBe(true);
  });

  it("passwordResetEmail returns html", () => {
    expect(isHtml(passwordResetEmail({ resetUrl: "https://p.example.com/reset?token=abc" }))).toBe(true);
  });

  it("newMessageEmail returns html", () => {
    expect(isHtml(newMessageEmail({ recipientName: "Anna", senderName: "Manuel", subject: "Intake", portalUrl: "https://p.example.com" }))).toBe(true);
  });

  it("welcomePatientEmail returns html", () => {
    expect(isHtml(welcomePatientEmail({ patientName: "Anna", portalUrl: "https://p.example.com" }))).toBe(true);
  });

  it("assessmentResultsEmail returns html", () => {
    const html = assessmentResultsEmail({
      patientName: "Anna",
      overallScore: 72,
      verdictName: "Asymmetric Performance",
      verdictText: "Your profile shows...",
      dimensions: [{ icon: "⚡", name: "Arousal", score: 65, interpretation: "Moderate activation barrier." }],
      portalUrl: "https://p.example.com",
    });
    expect(isHtml(html)).toBe(true);
  });

  it("weeklyDigestEmail returns html", () => {
    expect(isHtml(weeklyDigestEmail({
      patientName: "Anna",
      thisWeekAvgs: null,
      prevWeekAvgs: null,
      latestScore: null,
      verdictName: null,
      nextBookingStatus: null,
      portalUrl: "https://p.example.com",
    }))).toBe(true);
  });

  it("profileCompletionEmail returns html", () => {
    expect(isHtml(profileCompletionEmail({ patientName: "Anna", portalUrl: "https://p.example.com" }))).toBe(true);
  });

  it("assessmentCtaEmail returns html", () => {
    expect(isHtml(assessmentCtaEmail({ patientName: "Anna", portalUrl: "https://p.example.com" }))).toBe(true);
  });

  it("assessmentMeaningEmail returns html", () => {
    expect(isHtml(assessmentMeaningEmail({ patientName: "Anna", portalUrl: "https://p.example.com" }))).toBe(true);
  });
});

describe("email templates — personalisation", () => {
  it("bookingRequestAdminEmail includes patient name and email", () => {
    const html = bookingRequestAdminEmail({
      patientName: "Anna Müller",
      patientEmail: "anna@example.com",
      bookingTypeLabel: "Consultation",
      adminUrl: "https://vitareba.ch/admin",
    });
    expect(html).toContain("Anna Müller");
    expect(html).toContain("anna@example.com");
  });

  it("bookingRequestAdminEmail includes optional preferredDate when provided", () => {
    const html = bookingRequestAdminEmail({
      patientName: "Anna",
      patientEmail: "anna@example.com",
      bookingTypeLabel: "Consultation",
      preferredDate: "2026-05-10",
      adminUrl: "https://vitareba.ch/admin",
    });
    expect(html).toContain("2026-05-10");
  });

  it("bookingRequestAdminEmail omits preferredDate section when not provided", () => {
    const html = bookingRequestAdminEmail({
      patientName: "Anna",
      patientEmail: "anna@example.com",
      bookingTypeLabel: "Consultation",
      adminUrl: "https://vitareba.ch/admin",
    });
    expect(html).not.toContain("Preferred date");
  });

  it("bookingRequestAdminEmail includes adminUrl as link href", () => {
    const adminUrl = "https://vitareba.ch/admin/patients/42";
    const html = bookingRequestAdminEmail({ patientName: "Anna", patientEmail: "anna@example.com", bookingTypeLabel: "Consultation", adminUrl });
    expect(html).toContain(adminUrl);
  });

  it("bookingConfirmedEmail includes patient name", () => {
    const html = bookingConfirmedEmail({ patientName: "Jakob", portalUrl: "https://p.example.com" });
    expect(html).toContain("Jakob");
  });

  it("bookingCancelledEmail includes patient name", () => {
    const html = bookingCancelledEmail({ patientName: "Lisa", portalUrl: "https://p.example.com" });
    expect(html).toContain("Lisa");
  });

  it("passwordResetEmail includes the reset URL", () => {
    const resetUrl = "https://vitareba.ch/reset?token=xyz123";
    const html = passwordResetEmail({ resetUrl });
    expect(html).toContain(resetUrl);
  });

  it("passwordResetEmail includes expiry hours from config (1 hour)", () => {
    const html = passwordResetEmail({ resetUrl: "https://vitareba.ch/reset?token=abc" });
    // PASSWORD_RESET_TOKEN_EXPIRY_MS = 3_600_000 → 1 hour
    expect(html).toContain("1 hour");
  });

  it("newMessageEmail includes recipient name, sender name, and subject", () => {
    const html = newMessageEmail({
      recipientName: "Anna",
      senderName: "Dr. Montagna",
      subject: "Lab results",
      portalUrl: "https://p.example.com",
    });
    expect(html).toContain("Anna");
    expect(html).toContain("Dr. Montagna");
    expect(html).toContain("Lab results");
  });

  it("criticalPatientAlertEmail includes patient name, email, and reason", () => {
    const html = criticalPatientAlertEmail({
      patientName: "Max Hager",
      patientEmail: "max@example.com",
      reason: "No check-in for 6 days",
      adminUrl: "https://vitareba.ch/admin/patients/5",
    });
    expect(html).toContain("Max Hager");
    expect(html).toContain("max@example.com");
    expect(html).toContain("No check-in for 6 days");
  });

  it("assessmentResultsEmail includes score and verdict", () => {
    const html = assessmentResultsEmail({
      patientName: "Anna",
      overallScore: 55,
      verdictName: "Managed Tension",
      verdictText: "Some friction present.",
      dimensions: [],
      portalUrl: "https://p.example.com",
    });
    expect(html).toContain("55");
    expect(html).toContain("Managed Tension");
  });

  it("assessmentResultsEmail renders each dimension row", () => {
    const html = assessmentResultsEmail({
      patientName: "Anna",
      overallScore: 60,
      verdictName: "Managed Tension",
      verdictText: "Fine.",
      dimensions: [
        { icon: "⚡", name: "Arousal", score: 50, interpretation: "Moderate." },
        { icon: "🎯", name: "Hyperfocus", score: 80, interpretation: "Strong." },
      ],
      portalUrl: "https://p.example.com",
    });
    expect(html).toContain("Arousal");
    expect(html).toContain("Hyperfocus");
    expect(html).toContain("Moderate.");
    expect(html).toContain("Strong.");
  });

  it("assessmentBookingEmail includes the overall score", () => {
    const html = assessmentBookingEmail({
      patientName: "Anna",
      overallScore: 78,
      portalUrl: "https://p.example.com",
    });
    expect(html).toContain("78/100");
  });

  it("checkinDipAlertEmail includes days count and avg score", () => {
    const html = checkinDipAlertEmail({
      patientName: "Lisa",
      patientEmail: "lisa@example.com",
      avgScore: 2.3,
      days: 4,
      adminUrl: "https://vitareba.ch/admin/patients/7",
    });
    expect(html).toContain("4 days");
    expect(html).toContain("2.3");
  });

  it("profileCompletedAdminEmail includes completionPct", () => {
    const html = profileCompletedAdminEmail({
      patientName: "Max",
      patientEmail: "max@example.com",
      completionPct: 85,
      adminUrl: "https://vitareba.ch/admin/patients/3",
    });
    expect(html).toContain("85%");
  });

  it("profileCompletionEmail includes patient name and profile link", () => {
    const html = profileCompletionEmail({ patientName: "Sophie", portalUrl: "https://p.example.com" });
    expect(html).toContain("Sophie");
    expect(html).toContain("https://p.example.com/profile");
  });

  it("assessmentCtaEmail includes patient name and assessment link", () => {
    const html = assessmentCtaEmail({ patientName: "Luca", portalUrl: "https://p.example.com" });
    expect(html).toContain("Luca");
    expect(html).toContain("https://p.example.com/assessment");
  });

  it("assessmentMeaningEmail includes patient name and all five dimension names", () => {
    const html = assessmentMeaningEmail({ patientName: "Maria", portalUrl: "https://p.example.com" });
    expect(html).toContain("Maria");
    expect(html).toContain("Arousal");
    expect(html).toContain("Divergent");
    expect(html).toContain("Hyperfocus");
    expect(html).toContain("Volatility");
    expect(html).toContain("Environment");
  });
});

describe("weeklyDigestEmail — conditional sections", () => {
  const base = {
    patientName: "Anna",
    thisWeekAvgs: null,
    prevWeekAvgs: null,
    latestScore: null,
    verdictName: null,
    nextBookingStatus: null,
    portalUrl: "https://p.example.com",
  };

  it("shows no-checkin nudge when thisWeekAvgs is null", () => {
    const html = weeklyDigestEmail(base);
    expect(html).toContain("No check-ins this week");
  });

  it("shows checkin table when thisWeekAvgs provided", () => {
    const html = weeklyDigestEmail({
      ...base,
      thisWeekAvgs: { sleep: 4, energy: 3, mood: 4, focus: 3, stress: 2 },
      prevWeekAvgs: { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 3 },
    });
    expect(html).toContain("This week");
    expect(html).toContain("Sleep");
    expect(html).toContain("Stress (low=good)");
  });

  it("includes assessment score and verdict when provided", () => {
    const html = weeklyDigestEmail({ ...base, latestScore: 70, verdictName: "Asymmetric Performance" });
    expect(html).toContain("70/100");
    expect(html).toContain("Asymmetric Performance");
  });

  it("omits assessment section when latestScore is null", () => {
    const html = weeklyDigestEmail(base);
    expect(html).not.toContain("Inflection Edge score");
  });

  it("includes next booking status when provided", () => {
    const html = weeklyDigestEmail({ ...base, nextBookingStatus: "confirmed" });
    expect(html).toContain("confirmed");
  });

  it("omits booking section when nextBookingStatus is null", () => {
    const html = weeklyDigestEmail(base);
    expect(html).not.toContain("Your next consultation");
  });

  it("stress up-arrow when stress decreases (invert logic)", () => {
    // stress went from 4 → 2 (improvement, should show ↑ in teal)
    const html = weeklyDigestEmail({
      ...base,
      thisWeekAvgs: { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 2 },
      prevWeekAvgs: { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 4 },
    });
    // displayCurr = 6-2 = 4, displayPrev = 6-4 = 2 → 4 > 2+0.1 → "↑"
    expect(html).toContain("↑");
  });

  it("stress down-arrow when stress increases (invert logic)", () => {
    // stress went from 1 → 4 (worsening, should show ↓ in red)
    const html = weeklyDigestEmail({
      ...base,
      thisWeekAvgs: { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 4 },
      prevWeekAvgs: { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 1 },
    });
    // displayCurr = 6-4 = 2, displayPrev = 6-1 = 5 → 2 < 5-0.1 → "↓"
    expect(html).toContain("↓");
  });
});

describe("checkinReminderEmail", () => {
  const base = { patientName: "Anna", portalUrl: "https://p.example.com" };

  it("returns valid html", () => {
    expect(isHtml(checkinReminderEmail(base))).toBe(true);
  });

  it("includes patient name", () => {
    const html = checkinReminderEmail({ patientName: "Tobias", portalUrl: "https://p.example.com" });
    expect(html).toContain("Tobias");
  });

  it("opt-out link includes #email-preferences anchor", () => {
    const html = checkinReminderEmail(base);
    expect(html).toContain("#email-preferences");
  });

  it("copy says haven't logged a check-in yet (accurate condition)", () => {
    const html = checkinReminderEmail(base);
    expect(html).toContain("haven");
    expect(html).toContain("logged a check-in yet");
  });

  it("includes link to checkin route", () => {
    const html = checkinReminderEmail({ patientName: "Anna", portalUrl: "https://p.example.com" });
    expect(html).toContain("https://p.example.com/checkin");
  });

  it("no streak: shows generic body, no streak copy", () => {
    const html = checkinReminderEmail({ patientName: "Anna", portalUrl: "https://p.example.com", atRiskStreak: 0 });
    expect(html).toContain("30 seconds");
    expect(html).not.toContain("streak");
  });

  it("streak of 1: treated as no streak (threshold is 2)", () => {
    const html = checkinReminderEmail({ patientName: "Anna", portalUrl: "https://p.example.com", atRiskStreak: 1 });
    expect(html).not.toContain("streak");
  });

  it("streak of 2: shows streak count in copy", () => {
    const html = checkinReminderEmail({ patientName: "Anna", portalUrl: "https://p.example.com", atRiskStreak: 2 });
    expect(html).toContain("2");
    expect(html).toContain("streak");
  });

  it("streak of 14: shows exact count prominently", () => {
    const html = checkinReminderEmail({ patientName: "Anna", portalUrl: "https://p.example.com", atRiskStreak: 14 });
    expect(html).toContain("14");
    expect(html).toContain("streak");
  });

  it("streak path: still includes opt-out link", () => {
    const html = checkinReminderEmail({ patientName: "Anna", portalUrl: "https://p.example.com", atRiskStreak: 7 });
    expect(html).toContain("#email-preferences");
  });
});

describe("weeklyDigestEmail — weekly insight synthesis", () => {
  const base = {
    patientName: "Anna",
    latestScore: null,
    verdictName: null,
    nextBookingStatus: null,
    portalUrl: "https://p.example.com",
  };

  const flat = { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 3 };

  it("shows no insight when thisWeekAvgs is null (no check-ins)", () => {
    const html = weeklyDigestEmail({ ...base, thisWeekAvgs: null, prevWeekAvgs: null });
    // The insight paragraph should not appear — no data, no synthesis
    expect(html).not.toContain("Steady week");
    expect(html).not.toContain("Strong week");
    expect(html).not.toContain("First week");
  });

  it("shows first-week message when prevWeekAvgs is null but thisWeekAvgs exists", () => {
    const html = weeklyDigestEmail({ ...base, thisWeekAvgs: flat, prevWeekAvgs: null });
    expect(html).toContain("First week");
  });

  it("shows steady message when all metrics change < threshold", () => {
    // All deltas = 0.1, below the 0.3 threshold
    const curr = { sleep: 3.1, energy: 3.1, mood: 3.1, focus: 3.1, stress: 3.1 };
    const html = weeklyDigestEmail({ ...base, thisWeekAvgs: curr, prevWeekAvgs: flat });
    expect(html).toContain("Steady week");
  });

  it("shows 'Strong week' when metrics improve with no declines", () => {
    // sleep +1.0, energy +1.0, stress -1.0 (improvement) — all above threshold
    const curr = { sleep: 4, energy: 4, mood: 3, focus: 3, stress: 2 };
    const prev = { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 3 };
    const html = weeklyDigestEmail({ ...base, thisWeekAvgs: curr, prevWeekAvgs: prev });
    expect(html).toContain("Strong week");
  });

  it("shows decline message when metrics drop with no improvements", () => {
    // sleep -1.0, energy -1.0 — both below threshold
    const curr = { sleep: 2, energy: 2, mood: 3, focus: 3, stress: 3 };
    const prev = { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 3 };
    const html = weeklyDigestEmail({ ...base, thisWeekAvgs: curr, prevWeekAvgs: prev });
    expect(html).toContain("dipped this week");
  });

  it("shows mixed insight naming the biggest mover in each direction", () => {
    // focus +1.0 (big improvement), sleep -1.0 (big decline)
    const curr = { sleep: 2, energy: 3, mood: 3, focus: 4, stress: 3 };
    const prev = { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 3 };
    const html = weeklyDigestEmail({ ...base, thisWeekAvgs: curr, prevWeekAvgs: prev });
    expect(html).toContain("focus improved");
    expect(html).toContain("sleep dipped");
  });

  it("stress improvement (lower raw stress) counts as positive in insight", () => {
    // stress 4 → 2: delta for insight = -(2-4) = +2, above threshold → improved
    const curr = { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 2 };
    const prev = { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 4 };
    const html = weeklyDigestEmail({ ...base, thisWeekAvgs: curr, prevWeekAvgs: prev });
    expect(html).toContain("Strong week");
    expect(html).toContain("stress improved");
  });

  it("stress worsening (higher raw stress) counts as decline in insight", () => {
    // stress 2 → 4: delta for insight = -(4-2) = -2, below -threshold → declined
    const curr = { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 4 };
    const prev = { sleep: 3, energy: 3, mood: 3, focus: 3, stress: 2 };
    const html = weeklyDigestEmail({ ...base, thisWeekAvgs: curr, prevWeekAvgs: prev });
    expect(html).toContain("stress");
    expect(html).toContain("dipped");
  });
});

describe("checkinStreakMilestoneEmail", () => {
  const base = { patientName: "Anna", portalUrl: "https://p.example.com" };

  it("returns valid html", () => {
    expect(isHtml(checkinStreakMilestoneEmail({ ...base, streak: 7 }))).toBe(true);
  });

  it("includes patient name", () => {
    const html = checkinStreakMilestoneEmail({ ...base, streak: 7 });
    expect(html).toContain("Anna");
  });

  it("streak 7: shows 7-day heading and one-week copy", () => {
    const html = checkinStreakMilestoneEmail({ ...base, streak: 7 });
    expect(html).toContain("7-day streak");
    expect(html).toContain("One full week");
  });

  it("streak 30: shows 30-day heading and month copy", () => {
    const html = checkinStreakMilestoneEmail({ ...base, streak: 30 });
    expect(html).toContain("30-day streak");
    expect(html).toContain("full month");
  });

  it("streak 100: shows 100-day heading and dataset copy", () => {
    const html = checkinStreakMilestoneEmail({ ...base, streak: 100 });
    expect(html).toContain("100-day streak");
    expect(html).toContain("dataset");
  });

  it("streak 150: falls into 100+ branch (shows dataset copy)", () => {
    const html = checkinStreakMilestoneEmail({ ...base, streak: 150 });
    expect(html).toContain("dataset");
  });

  it("includes checkin route link", () => {
    const html = checkinStreakMilestoneEmail({ ...base, streak: 7 });
    expect(html).toContain("https://p.example.com/checkin");
  });
});
