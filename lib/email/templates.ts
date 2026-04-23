// ─── Shared layout ────────────────────────────────────────────────────────────

import { PORTAL_URL, COMPANY } from "@/lib/config/company";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { type MetricKey } from "@/lib/config/portal";
import { PASSWORD_RESET_TOKEN_EXPIRY_MS } from "@/lib/config/auth";

function layout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin: 0; padding: 0; background: #f8f7f4; font-family: 'DM Sans', Arial, sans-serif; color: #1a1a22; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; border: 1px solid #e5e0d8; overflow: hidden; }
  .header { background: #1a1a22; padding: 28px 32px; }
  .header h1 { margin: 0; font-size: 18px; font-weight: 400; letter-spacing: 0.12em; color: #fff; text-transform: uppercase; }
  .header span { color: #2a7a8a; }
  .body { padding: 32px; }
  .body p { margin: 0 0 16px; line-height: 1.6; font-size: 15px; color: #3a3a4a; }
  .body p:last-child { margin-bottom: 0; }
  .btn { display: inline-block; margin: 8px 0; padding: 12px 24px; background: #2a7a8a; color: #fff !important; text-decoration: none; border-radius: 4px; font-size: 14px; letter-spacing: 0.08em; }
  .divider { height: 1px; background: #e5e0d8; margin: 24px 0; }
  .meta { font-size: 13px; color: #888a96; }
  .footer { padding: 20px 32px; border-top: 1px solid #e5e0d8; font-size: 12px; color: #888a96; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>Vita<span>Re</span>Ba</h1></div>
  <div class="body">${body}</div>
  <div class="footer">${COMPANY.name} · ${COMPANY.address.city} · <a href="${PORTAL_URL}" style="color:#2a7a8a">${PORTAL_URL.replace(/^https?:\/\//, "")}</a></div>
</div>
</body>
</html>`;
}

// ─── Booking: notification to admin ───────────────────────────────────────────

export function bookingRequestAdminEmail({
  patientName,
  patientEmail,
  bookingTypeLabel,
  machineTypeLabel,
  notes,
  preferredDate,
  adminUrl,
}: {
  patientName: string;
  patientEmail: string;
  bookingTypeLabel: string;
  machineTypeLabel?: string | null;
  notes?: string | null;
  preferredDate?: string | null;
  adminUrl: string;
}) {
  return layout(`
    <p>A new booking request has been submitted.</p>
    <div class="divider"></div>
    <p class="meta"><strong>Patient:</strong> ${patientName} (${patientEmail})</p>
    <p class="meta"><strong>Type:</strong> ${bookingTypeLabel}${machineTypeLabel ? ` — ${machineTypeLabel}` : ""}</p>
    ${preferredDate ? `<p class="meta"><strong>Preferred date:</strong> ${preferredDate}</p>` : ""}
    ${notes ? `<p class="meta"><strong>Notes:</strong> ${notes}</p>` : ""}
    <div class="divider"></div>
    <p><a class="btn" href="${adminUrl}">Review in Admin Portal</a></p>
  `);
}

// ─── Booking: confirmation to patient ─────────────────────────────────────────

export function bookingConfirmedEmail({
  patientName,
  portalUrl,
}: {
  patientName: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${patientName},</p>
    <p>Your consultation request has been <strong>confirmed</strong>. We will be in touch shortly with the details.</p>
    <p>In the meantime, you can view all your bookings in your patient portal.</p>
    <p><a class="btn" href="${portalUrl}">View your bookings</a></p>
  `);
}

// ─── Booking: cancellation to patient ─────────────────────────────────────────

export function bookingCancelledEmail({
  patientName,
  portalUrl,
}: {
  patientName: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${patientName},</p>
    <p>Your consultation request has been cancelled. If you have any questions, please reply to this email or send us a message through the portal.</p>
    <p><a class="btn" href="${portalUrl}">Open patient portal</a></p>
  `);
}

// ─── Password reset ────────────────────────────────────────────────────────────

export function passwordResetEmail({
  resetUrl,
}: {
  resetUrl: string;
}) {
  return layout(`
    <p>You requested a password reset for your ${COMPANY.shortName} account.</p>
    <p>Click the button below to set a new password. This link expires in <strong>${PASSWORD_RESET_TOKEN_EXPIRY_MS / 3_600_000} hour</strong>.</p>
    <p><a class="btn" href="${resetUrl}">Reset password</a></p>
    <div class="divider"></div>
    <p class="meta">If you did not request this, you can safely ignore this email.</p>
  `);
}

// ─── New message notification ─────────────────────────────────────────────────

export function newMessageEmail({
  recipientName,
  senderName,
  subject,
  portalUrl,
}: {
  recipientName: string;
  senderName: string;
  subject: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${recipientName},</p>
    <p>You have a new message from <strong>${senderName}</strong> regarding: <em>${subject}</em></p>
    <p><a class="btn" href="${portalUrl}">Read message</a></p>
  `);
}

// ─── Welcome sequence: immediate welcome ─────────────────────────────────────

export function welcomePatientEmail({
  patientName,
  portalUrl,
}: {
  patientName: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${patientName},</p>
    <p>Welcome to ${COMPANY.shortName}. Your patient portal is ready.</p>
    <p>${COMPANY.clinicianName} works with a small number of patients at a time — which means your programme will be built around your specific biology, not a template. To make that possible, ${COMPANY.clinicianName} needs your data.</p>
    <div class="divider"></div>
    <p><strong>Here is what to do first:</strong></p>
    <p>1. <strong>Complete your profile</strong> — your clinical history, current medications, and lifestyle baseline give ${COMPANY.clinicianName} the context needed before your first consultation.</p>
    <p>2. <strong>Take the Inflection Edge</strong> — 30 questions, 5 minutes. Your results map your ADHD profile across five dimensions and unlock ${COMPANY.clinicianName}'s ability to personalise your protocol.</p>
    <p>3. <strong>Check in daily</strong> — takes 30 seconds. Sleep, energy, mood, focus, stress. Over time this becomes your most valuable clinical dataset.</p>
    <div class="divider"></div>
    <p><a class="btn" href="${portalUrl}${PORTAL_ROUTES.dashboard}">Open your portal</a></p>
    <p class="meta">If you have any questions before your first consultation, reply to this email.</p>
  `);
}

// ─── Welcome sequence: profile completion nudge (+24h) ───────────────────────

export function profileCompletionEmail({
  patientName,
  portalUrl,
}: {
  patientName: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${patientName},</p>
    <p>One quick thing before your first consultation: your profile.</p>
    <p>${COMPANY.clinicianName} reviews every patient's profile before meeting them. Your clinical history, current medications, and lifestyle baseline allow for your first session to already be built around your situation — not spending the first 20 minutes gathering basics.</p>
    <p>It takes about 5 minutes and makes a measurable difference to the quality of your first consultation.</p>
    <p><a class="btn" href="${portalUrl}${PORTAL_ROUTES.profile}">Complete your profile</a></p>
    <p class="meta">Already done? Ignore this email.</p>
  `);
}

// ─── Welcome sequence: assessment CTA (+72h) ─────────────────────────────────

export function assessmentCtaEmail({
  patientName,
  portalUrl,
}: {
  patientName: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${patientName},</p>
    <p>The Inflection Edge is the foundation of everything ${COMPANY.clinicianName} does with you.</p>
    <p>It maps your ADHD profile across five dimensions — Arousal, Divergent Output, Hyperfocus, Volatility, and Environment Design. Each dimension produces a 0–100 score that tells ${COMPANY.clinicianName} where your highest-leverage intervention points are.</p>
    <p>Without it, ${COMPANY.clinicianName} is working blind. With it, your protocol can be designed before you even sit down together.</p>
    <p>It takes 5 minutes.</p>
    <p><a class="btn" href="${portalUrl}${PORTAL_ROUTES.assessment}">Take the Inflection Edge →</a></p>
  `);
}

// ─── Critical patient alert (to Manuel) ──────────────────────────────────────

export function criticalPatientAlertEmail({
  patientName,
  patientEmail,
  reason,
  adminUrl,
}: {
  patientName: string;
  patientEmail: string;
  reason: string;
  adminUrl: string;
}) {
  return layout(`
    <p>A patient has been flagged as <strong style="color:#e05a5a">Critical</strong>.</p>
    <div class="divider"></div>
    <p class="meta"><strong>Patient:</strong> ${patientName} (${patientEmail})</p>
    <p class="meta"><strong>Reason:</strong> ${reason}</p>
    <div class="divider"></div>
    <p><a class="btn" href="${adminUrl}">View patient →</a></p>
    <p class="meta">This alert fires once per critical episode. It will not repeat until the patient returns to active or attention and becomes critical again.</p>
  `);
}

// ─── Assessment: immediate results ────────────────────────────────────────────

export function assessmentResultsEmail({
  patientName,
  overallScore,
  verdictName,
  verdictText,
  dimensions,
  portalUrl,
}: {
  patientName: string;
  overallScore: number;
  verdictName: string;
  verdictText: string;
  dimensions: Array<{ icon: string; name: string; score: number; interpretation: string }>;
  portalUrl: string;
}) {
  const dimRows = dimensions
    .map(
      (d) => `
    <tr>
      <td style="padding:0.6rem 0;border-bottom:1px solid #e5e0d8;vertical-align:top;width:28px;font-size:1.1rem">${d.icon}</td>
      <td style="padding:0.6rem 0.5rem;border-bottom:1px solid #e5e0d8;vertical-align:top;font-size:0.78rem;color:#888a96;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;width:40px">${d.score}</td>
      <td style="padding:0.6rem 0;border-bottom:1px solid #e5e0d8;vertical-align:top;">
        <div style="font-size:0.8rem;font-weight:500;color:#1a1a22;margin-bottom:0.25rem">${d.name}</div>
        <div style="font-size:0.76rem;color:#3a3a4a;line-height:1.6">${d.interpretation}</div>
      </td>
    </tr>`
    )
    .join("");

  return layout(`
    <p>Hi ${patientName},</p>
    <p>Your Inflection Edge results are in. Here is what your profile looks like:</p>
    <div style="text-align:center;padding:1.5rem 0">
      <div style="font-size:3.5rem;font-weight:300;color:#2a7a8a;line-height:1">${overallScore}</div>
      <div style="font-size:0.85rem;font-weight:500;color:#1a1a22;margin-top:0.25rem">${verdictName}</div>
    </div>
    <p style="font-size:0.82rem;color:#3a3a4a;line-height:1.65">${verdictText}</p>
    <div class="divider"></div>
    <table style="width:100%;border-collapse:collapse">
      <tbody>${dimRows}</tbody>
    </table>
    <div class="divider"></div>
    <p><a class="btn" href="${portalUrl}">View full results in portal</a></p>
    <p class="meta">${COMPANY.clinicianName} will review your profile and be in touch about next steps.</p>
  `);
}

// ─── Assessment: clinical meaning (+48h) ──────────────────────────────────────

export function assessmentMeaningEmail({
  patientName,
  portalUrl,
}: {
  patientName: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${patientName},</p>
    <p>You took the Inflection Edge two days ago. This email explains what the five dimensions actually measure — and why they matter clinically.</p>
    <div class="divider"></div>
    <p><strong>⚡ Arousal &amp; Activation</strong><br/>
    This is your ability to initiate. Most ADHD interventions start here because without reliable activation, nothing else works. ${COMPANY.clinicianName} looks at whether the barrier to starting is biological (dopamine regulation), structural (environment), or habitual.</p>
    <p><strong>💥 Divergent Output</strong><br/>
    Raw creative capacity. ADHD brains often generate more ideas than neurotypical ones — the clinical question is whether that output is captured, developed, and deployed, or scattered. ${COMPANY.clinicianName} tracks the gap between ideation and execution.</p>
    <p><strong>🎯 Hyperfocus</strong><br/>
    Your ability to enter deep, extended flow states. When managed well, hyperfocus is an asymmetric advantage. When uncontrolled, it burns time and relationships. ${COMPANY.clinicianName} maps how deliberate versus reactive your hyperfocus currently is.</p>
    <p><strong>🌊 Volatility &amp; Cost</strong><br/>
    Emotional and performance variance. The real-world cost of ADHD is often paid here — in decisions made in the wrong state, relationships affected by unpredictability, and energy spent on recovery. This is where biological stabilisation has the most direct impact.</p>
    <p><strong>🏗️ Environment Design</strong><br/>
    How well your workspace, schedule, and relationships are engineered around your neurotype. Environmental design compounds everything else — even perfect biological intervention underperforms in the wrong environment.</p>
    <div class="divider"></div>
    <p><a class="btn" href="${portalUrl}">Review your scores</a></p>
  `);
}

// ─── Assessment: booking CTA (+5 days) ────────────────────────────────────────

export function assessmentBookingEmail({
  patientName,
  overallScore,
  portalUrl,
}: {
  patientName: string;
  overallScore: number;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${patientName},</p>
    <p>${COMPANY.clinicianName} has had time to review your Inflection Edge profile (overall score: <strong>${overallScore}/100</strong>).</p>
    <p>If you would like to discuss what your results mean for your specific situation — and what interventions are most relevant for your neurotype — you can book a consultation directly.</p>
    <p><a class="btn" href="${portalUrl}${PORTAL_ROUTES.bookings}">Book a consultation</a></p>
    <div class="divider"></div>
    <p class="meta">If you have already booked, you can safely ignore this email.</p>
  `);
}

// ─── Weekly digest ────────────────────────────────────────────────────────────

type WeekAvgs = Record<MetricKey, number> | null;

function deltaArrow(curr: number, prev: number): string {
  if (curr > prev + 0.1) return "↑";
  if (curr < prev - 0.1) return "↓";
  return "→";
}

function metricRow(label: string, curr: number | undefined, prev: number | undefined, invert = false): string {
  if (curr == null || prev == null) return "";
  const displayCurr = invert ? 6 - curr : curr;
  const displayPrev = invert ? 6 - prev : prev;
  const arrow = deltaArrow(displayCurr, displayPrev);
  const color = arrow === "↑" ? "#2a7a8a" : arrow === "↓" ? "#e05a5a" : "#888a96";
  return `<tr>
    <td style="padding:0.35rem 0;font-size:0.8rem;color:#888a96;width:120px">${label}</td>
    <td style="padding:0.35rem 0;font-size:0.8rem;color:#1a1a22">${displayCurr.toFixed(1)}</td>
    <td style="padding:0.35rem 0;font-size:0.9rem;color:${color};font-weight:600">${arrow}</td>
    <td style="padding:0.35rem 0;font-size:0.8rem;color:#888a96">${displayPrev.toFixed(1)}</td>
  </tr>`;
}

export function weeklyDigestEmail({
  patientName,
  thisWeekAvgs,
  prevWeekAvgs,
  latestScore,
  verdictName,
  nextBookingStatus,
  portalUrl,
}: {
  patientName: string;
  thisWeekAvgs: WeekAvgs;
  prevWeekAvgs: WeekAvgs;
  latestScore: number | null;
  verdictName: string | null;
  nextBookingStatus: string | null;
  portalUrl: string;
}) {
  const hasCheckins = thisWeekAvgs !== null;

  const checkinSection = hasCheckins ? `
    <p><strong>This week's check-in averages</strong></p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:0.5rem">
      <thead>
        <tr>
          <th style="text-align:left;font-size:0.7rem;color:#888a96;padding:0.2rem 0">Metric</th>
          <th style="text-align:left;font-size:0.7rem;color:#888a96;padding:0.2rem 0">This week</th>
          <th style="text-align:left;font-size:0.7rem;color:#888a96;padding:0.2rem 0">Δ</th>
          <th style="text-align:left;font-size:0.7rem;color:#888a96;padding:0.2rem 0">Last week</th>
        </tr>
      </thead>
      <tbody>
        ${metricRow("Sleep", thisWeekAvgs!.sleep, prevWeekAvgs?.sleep)}
        ${metricRow("Energy", thisWeekAvgs!.energy, prevWeekAvgs?.energy)}
        ${metricRow("Mood", thisWeekAvgs!.mood, prevWeekAvgs?.mood)}
        ${metricRow("Focus", thisWeekAvgs!.focus, prevWeekAvgs?.focus)}
        ${metricRow("Stress (low=good)", thisWeekAvgs!.stress, prevWeekAvgs?.stress, true)}
      </tbody>
    </table>
    <div class="divider"></div>` : `
    <p class="meta">No check-ins this week. Consistent tracking helps ${COMPANY.clinicianName} see your patterns clearly.</p>
    <div class="divider"></div>`;

  const assessmentSection = latestScore !== null ? `
    <p><strong>Latest Inflection Edge score:</strong> ${latestScore}/100 — ${verdictName ?? ""}</p>` : "";

  const bookingSection = nextBookingStatus ? `
    <p class="meta">Your next consultation is <strong>${nextBookingStatus}</strong>.</p>` : "";

  return layout(`
    <p>Hi ${patientName},</p>
    <p>Here is your weekly summary from ${COMPANY.shortName}.</p>
    ${checkinSection}
    ${assessmentSection}
    ${bookingSection}
    <p><a class="btn" href="${portalUrl}${PORTAL_ROUTES.checkin}">Log today's check-in</a></p>
    <div class="divider"></div>
    <p class="meta">To stop receiving weekly summaries, visit your <a href="${portalUrl}${PORTAL_ROUTES.profile}#digest-optout" style="color:#2a7a8a">profile settings</a>.</p>
  `);
}

// ─── Daily check-in reminder ──────────────────────────────────────────────────

export function checkinReminderEmail({
  patientName,
  portalUrl,
}: {
  patientName: string;
  portalUrl: string;
}) {
  return layout(`
    <p>How are you doing today, <strong>${patientName}</strong>?</p>
    <p>Logging your daily check-in takes 30 seconds and helps ${COMPANY.clinicianName} track your progress across sleep, energy, mood, focus, and stress.</p>
    <p><a class="btn" href="${portalUrl}${PORTAL_ROUTES.checkin}">Log today's check-in →</a></p>
    <div class="divider"></div>
    <p class="meta">You receive this reminder on weekdays while enrolled in a ${COMPANY.shortName} programme. To stop, visit your <a href="${portalUrl}${PORTAL_ROUTES.profile}#digest-optout" style="color:#2a7a8a">profile settings</a>.</p>
  `);
}

// ─── Check-in dip alert (to Manuel) ──────────────────────────────────────────

export function checkinDipAlertEmail({
  patientName,
  patientEmail,
  avgScore,
  days,
  adminUrl,
}: {
  patientName: string;
  patientEmail: string;
  avgScore: number;
  days: number;
  adminUrl: string;
}) {
  return layout(`
    <p>A patient has had consistently low wellbeing scores for the past <strong>${days} days</strong>.</p>
    <div class="divider"></div>
    <p class="meta"><strong>Patient:</strong> ${patientName} (${patientEmail})</p>
    <p class="meta"><strong>Average score (mood + energy + sleep):</strong> ${avgScore.toFixed(1)} / 5 over ${days} days</p>
    <div class="divider"></div>
    <p><a class="btn" href="${adminUrl}">View patient →</a></p>
    <p class="meta">This alert fires once per dip episode and resets when the patient returns above the threshold.</p>
  `);
}

// ─── Profile completion alert (to Manuel) ────────────────────────────────────

export function profileCompletedAdminEmail({
  patientName,
  patientEmail,
  completionPct,
  adminUrl,
}: {
  patientName: string;
  patientEmail: string;
  completionPct: number;
  adminUrl: string;
}) {
  return layout(`
    <p>A patient has completed their intake profile — <strong style="color:#2a7a8a">ready for review</strong>.</p>
    <div class="divider"></div>
    <p class="meta"><strong>Patient:</strong> ${patientName} (${patientEmail})</p>
    <p class="meta"><strong>Profile completeness:</strong> ${completionPct}%</p>
    <div class="divider"></div>
    <p><a class="btn" href="${adminUrl}">Review profile →</a></p>
    <p class="meta">This notification fires once when the patient first crosses 70% completion.</p>
  `);
}
