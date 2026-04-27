export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, profiles, assessmentResults, bookings, dailyCheckins, clinicalGoals } from "@/lib/db/schema";
import { eq, desc, isNull } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import { criticalPatientAlertEmail, goalAchievedAdminEmail, goalAchievedPatientEmail } from "@/lib/email/templates";
import { computePatientSignal } from "@/lib/domain/signals";
import { normalizeCheckinMetric } from "@/lib/domain/checkin";
import { computeGoalProgress } from "@/lib/domain/goals";
import { PATIENT_SIGNAL, CHECKIN_GOAL_METRICS, SIGNAL_CHECKIN_WINDOW_DAYS, type CheckinGoalMetric } from "@/lib/config/admin";
import { ASSESSMENT_GOAL_METRIC_KEY, GOAL_PROGRESS_COMPLETE_PCT } from "@/lib/config/portal";
import { USER_ROLE } from "@/lib/config/auth";
import { PORTAL_URL, getAdminEmails } from "@/lib/config/company";
import { ADMIN_ROUTES } from "@/lib/config/routes";
import { requireCron } from "@/lib/auth/guards";
import { displayName } from "@/lib/utils/format";

export async function GET(req: Request) {
  const cronError = requireCron(req);
  if (cronError) return cronError;

  const now = new Date();

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    return NextResponse.json({ success: true, alerts: 0, checked: 0 });
  }

  let patients;
  try {
    patients = await db.query.users.findMany({
      where: eq(users.role, USER_ROLE.patient),
      with: {
        profile: { columns: { lastKnownSignal: true } },
        assessmentResults: {
          orderBy: [desc(assessmentResults.completedAt)],
          limit: 2,
        },
        bookings: {
          orderBy: [desc(bookings.createdAt)],
          limit: 1,
        },
        dailyCheckins: {
          orderBy: [desc(dailyCheckins.date)],
          limit: SIGNAL_CHECKIN_WINDOW_DAYS,
        },
        clinicalGoals: {
          where: isNull(clinicalGoals.completedAt),
        },
      },
    });
  } catch (err) {
    console.error("[cron/signals] DB read failed:", err);
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 500 });
  }

  let alerts = 0;
  let goalsCompleted = 0;
  const dbWrites: Promise<unknown>[] = [];

  for (const patient of patients) {
    const { signal, reason } = computePatientSignal({
      registeredAt: patient.createdAt,
      checkins: patient.dailyCheckins,
      assessments: patient.assessmentResults.map((a) => ({
        overallScore: a.overallScore,
        completedAt: a.completedAt,
      })),
      bookings: patient.bookings,
      now,
    });

    const previousSignal = patient.profile?.lastKnownSignal ?? null;

    // Alert only on first transition into critical
    if (signal === PATIENT_SIGNAL.critical && previousSignal !== PATIENT_SIGNAL.critical) {
      const patientName = displayName(patient.name, patient.email);
      const adminUrl = `${PORTAL_URL}${ADMIN_ROUTES.patients}/${patient.id}`;

      // Send to all admin emails in parallel — independent recipients
      const recentCheckins = patient.dailyCheckins.slice(0, 3).map((c) => ({
        date: c.date,
        sleep: c.sleep,
        energy: c.energy,
        mood: c.mood,
        focus: c.focus,
        stress: c.stress,
      }));

      const assessmentHistory = patient.assessmentResults.map((a) => ({
        score: a.overallScore,
        completedAt: a.completedAt instanceof Date
          ? a.completedAt.toISOString().slice(0, 10)
          : String(a.completedAt).slice(0, 10),
      }));

      const results = await Promise.allSettled(
        adminEmails.map((adminEmail) =>
          sendEmail({
            to: adminEmail,
            subject: `⚠ Critical patient: ${patientName}`,
            html: criticalPatientAlertEmail({
              patientName,
              patientEmail: patient.email,
              reason,
              adminUrl,
              recentCheckins,
              assessmentHistory,
            }),
          })
        )
      );
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error("[cron/signals] alert send failed for", patient.id, "to", adminEmails[i], r.reason);
        }
      });
      // Count alerts per patient-transition, NOT per admin recipient — otherwise
      // 1 patient going critical with 3 admins reports as alerts: 3, which
      // makes the cron's observability number meaningless.
      if (results.some((r) => r.status === "fulfilled")) {
        alerts++;
      }
    }

    // Collect goal current-value updates (batched below)
    const latestAssessment = patient.assessmentResults[0];
    const checkins = patient.dailyCheckins;
    for (const goal of patient.clinicalGoals ?? []) {
      if (!goal.metric) continue;

      let liveValue: number | null = null;

      if (goal.metric === ASSESSMENT_GOAL_METRIC_KEY && latestAssessment) {
        liveValue = latestAssessment.overallScore;
      } else if ((CHECKIN_GOAL_METRICS as readonly string[]).includes(goal.metric) && checkins.length > 0) {
        // 7-day average of the metric (scale 1–5 → 0–100)
        const key = goal.metric as CheckinGoalMetric;
        const sum = checkins.reduce((acc, c) => acc + c[key], 0);
        const raw = sum / checkins.length; // 1–5
        liveValue = normalizeCheckinMetric(raw); // normalize to 0–100
      }

      if (liveValue !== null && liveValue !== goal.current) {
        // Detect first-time goal achievement using computeGoalProgress so descending
        // goals (e.g. "reduce stress" with target < baseline) are evaluated correctly.
        // A naive `liveValue >= target` would falsely fire at baseline for descending goals.
        const progress = computeGoalProgress(goal.baseline, liveValue, goal.target);
        const isNewlyAchieved =
          progress !== null && progress >= GOAL_PROGRESS_COMPLETE_PCT && goal.completedAt === null;

        dbWrites.push(
          db.update(clinicalGoals)
            .set({
              current: liveValue,
              ...(isNewlyAchieved ? { completedAt: now } : {}),
              updatedAt: now,
            })
            .where(eq(clinicalGoals.id, goal.id))
        );

        if (isNewlyAchieved) {
          goalsCompleted++;
          const patientName = displayName(patient.name, patient.email);
          const adminUrl = `${PORTAL_URL}${ADMIN_ROUTES.patients}/${patient.id}`;
          // Notify all admin emails (fire-and-forget per recipient)
          for (const adminEmail of adminEmails) {
            sendEmail({
              to: adminEmail,
              subject: `Goal achieved: ${patientName} — ${goal.title}`,
              html: goalAchievedAdminEmail({ patientName, goalTitle: goal.title, adminUrl }),
            }).catch((err) =>
              console.error("[cron/signals] goal achievement admin email failed:", patient.id, err)
            );
          }
          // Notify the patient — positive reinforcement for their check-ins/assessments
          if (patient.email) {
            sendEmail({
              to: patient.email,
              subject: `Goal achieved: ${goal.title}`,
              html: goalAchievedPatientEmail({ patientName, goalTitle: goal.title, portalUrl: PORTAL_URL }),
            }).catch((err) =>
              console.error("[cron/signals] goal achievement patient email failed:", patient.id, err)
            );
          }
        }
      }
    }

    // Collect signal upsert if it changed
    if (signal !== previousSignal) {
      dbWrites.push(
        db.insert(profiles)
          .values({ userId: patient.id, lastKnownSignal: signal })
          .onConflictDoUpdate({ target: profiles.userId, set: { lastKnownSignal: signal } })
      );
    }
  }

  // Flush all goal and signal updates in parallel
  await Promise.all(dbWrites);

  return NextResponse.json({ success: true, alerts, goalsCompleted, checked: patients.length });
}
