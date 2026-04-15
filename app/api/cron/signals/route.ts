export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, profiles, assessmentResults, bookings, dailyCheckins, clinicalGoals } from "@/lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import { criticalPatientAlertEmail } from "@/lib/email/templates";
import { computePatientSignal } from "@/lib/domain/signals";
import { SIGNAL_CHECKIN_WINDOW_DAYS } from "@/lib/config/admin";
import { PORTAL_URL } from "@/lib/config/company";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const admins = await db.query.users.findMany({
    where: eq(users.role, "admin"),
    columns: { email: true, name: true },
  });

  if (admins.length === 0) {
    return NextResponse.json({ success: true, alerts: 0, checked: 0 });
  }

  const patients = await db.query.users.findMany({
    where: eq(users.role, "patient"),
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

  let alerts = 0;

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
    if (signal === "critical" && previousSignal !== "critical") {
      const patientName = patient.name ?? patient.email.split("@")[0];
      const adminUrl = `${PORTAL_URL}/admin/patients/${patient.id}`;

      for (const admin of admins) {
        if (!admin.email) continue;
        try {
          await sendEmail({
            to: admin.email,
            subject: `⚠ Critical patient: ${patientName}`,
            html: criticalPatientAlertEmail({
              patientName,
              patientEmail: patient.email,
              reason,
              adminUrl,
            }),
          });
          alerts++;
        } catch (err) {
          console.error("[cron/signals] alert send failed for", patient.id, err);
        }
      }
    }

    // Auto-update goal current values from live data when metric is set
    const latestAssessment = patient.assessmentResults[0];
    const checkins = patient.dailyCheckins;
    for (const goal of patient.clinicalGoals ?? []) {
      if (!goal.metric) continue;

      let liveValue: number | null = null;

      if (goal.metric === "overallScore" && latestAssessment) {
        liveValue = latestAssessment.overallScore;
      } else if (["focus", "mood", "energy", "sleep", "stress"].includes(goal.metric) && checkins.length > 0) {
        // 7-day average of the metric (scale 1–5 → 0–100)
        const key = goal.metric as "focus" | "mood" | "energy" | "sleep" | "stress";
        const sum = checkins.reduce((acc, c) => acc + c[key], 0);
        const raw = sum / checkins.length; // 1–5
        liveValue = Math.round(((raw - 1) / 4) * 100); // normalize to 0–100
      }

      if (liveValue !== null && liveValue !== goal.current) {
        await db
          .update(clinicalGoals)
          .set({ current: liveValue, updatedAt: new Date() })
          .where(eq(clinicalGoals.id, goal.id));
      }
    }

    // Update lastKnownSignal if it changed
    if (signal !== previousSignal) {
      if (patient.profile) {
        await db
          .update(profiles)
          .set({ lastKnownSignal: signal })
          .where(eq(profiles.userId, patient.id));
      } else {
        await db
          .insert(profiles)
          .values({ userId: patient.id, lastKnownSignal: signal })
          .onConflictDoUpdate({
            target: profiles.userId,
            set: { lastKnownSignal: signal },
          });
      }
    }
  }

  return NextResponse.json({ success: true, alerts, checked: patients.length });
}
