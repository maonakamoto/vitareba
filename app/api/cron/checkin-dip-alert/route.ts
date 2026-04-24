export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, dailyCheckins, profiles } from "@/lib/db/schema";
import { eq, desc, gte } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import { checkinDipAlertEmail } from "@/lib/email/templates";
import { PORTAL_URL, getAdminEmails } from "@/lib/config/company";
import {
  CHECKIN_DIP_ALERT_THRESHOLD,
  CHECKIN_DIP_ALERT_DAYS,
} from "@/lib/config/admin";
import { DAY_MS, formatDateISO, displayName } from "@/lib/utils/format";
import { USER_ROLE } from "@/lib/config/auth";
import { ADMIN_ROUTES } from "@/lib/config/routes";
import { requireCron } from "@/lib/auth/guards";

export async function GET(req: Request) {
  const cronError = requireCron(req);
  if (cronError) return cronError;

  // Fetch last N days of check-ins for all active patients
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CHECKIN_DIP_ALERT_DAYS);
  const cutoffDate = formatDateISO(cutoff);

  let patients;
  try {
    patients = await db.query.users.findMany({
      where: eq(users.role, USER_ROLE.patient),
      with: {
        profile: { columns: { dipAlertSentAt: true } },
        dailyCheckins: {
          where: gte(dailyCheckins.date, cutoffDate),
          orderBy: [desc(dailyCheckins.date)],
        },
      },
    });
  } catch (err) {
    console.error("[cron/checkin-dip-alert] DB read failed:", err);
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 500 });
  }

  const adminEmails = getAdminEmails();

  // Collect alert tasks for patients in genuine dip — filter loop is CPU-bound (no I/O)
  type AlertTask = { patientId: string; html: string; patientName: string };
  const alertTasks: AlertTask[] = [];
  let skipped = 0;

  for (const patient of patients) {
    // Only alert for patients who have been logging consistently
    if ((patient.dailyCheckins?.length ?? 0) < CHECKIN_DIP_ALERT_DAYS) {
      skipped++;
      continue;
    }

    // Take the most recent N days
    const recent = patient.dailyCheckins.slice(0, CHECKIN_DIP_ALERT_DAYS);

    // Compute average of mood + energy + sleep per day
    // Stress is inverted (high stress = bad) — excluded from dip metric
    const dayAvgs = recent.map((c) => (c.mood + c.energy + c.sleep) / 3);
    const allDip = dayAvgs.every((avg) => avg <= CHECKIN_DIP_ALERT_THRESHOLD);

    if (!allDip) {
      skipped++;
      continue;
    }

    const overallAvg = dayAvgs.reduce((a, b) => a + b, 0) / dayAvgs.length;

    // Don't re-alert within the same dip window (avoid spam)
    const profile = patient.profile;
    if (profile?.dipAlertSentAt) {
      const sentDaysAgo = (Date.now() - new Date(profile.dipAlertSentAt).getTime()) / DAY_MS;
      if (sentDaysAgo < CHECKIN_DIP_ALERT_DAYS) {
        skipped++;
        continue;
      }
    }

    const patientName = displayName(patient.name, patient.email, "Unknown");
    const adminUrl = `${PORTAL_URL}${ADMIN_ROUTES.patients}/${patient.id}`;

    alertTasks.push({
      patientId: patient.id,
      patientName,
      html: checkinDipAlertEmail({
        patientName,
        patientEmail: patient.email ?? "",
        avgScore: overallAvg,
        days: CHECKIN_DIP_ALERT_DAYS,
        adminUrl,
      }),
    });
  }

  // Fan out all patient alerts in parallel — sends + DB updates are independent across patients
  const results = await Promise.allSettled(
    alertTasks.map(({ patientId, patientName, html }) =>
      Promise.all([
        ...adminEmails.map((adminEmail) =>
          sendEmail({
            to: adminEmail,
            subject: `⚠️ Check-in dip alert — ${patientName}`,
            html,
          }).catch((err) => console.error("[cron/checkin-dip-alert] send failed for", patientId, err))
        ),
        db.update(profiles)
          .set({ dipAlertSentAt: new Date() })
          .where(eq(profiles.userId, patientId)),
      ])
    )
  );

  const alerted = results.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({ success: true, alerted, skipped });
}
