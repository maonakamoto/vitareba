export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, dailyCheckins, profiles } from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import { checkinDipAlertEmail } from "@/lib/email/templates";
import { PORTAL_URL, getAdminEmails } from "@/lib/config/company";
import {
  CHECKIN_DIP_ALERT_THRESHOLD,
  CHECKIN_DIP_ALERT_DAYS,
} from "@/lib/config/admin";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Fetch last N days of check-ins for all active patients
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CHECKIN_DIP_ALERT_DAYS);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const patients = await db.query.users.findMany({
    where: eq(users.role, "patient"),
    with: {
      profile: { columns: { digestOptOut: true, dipAlertSentAt: true } },
      dailyCheckins: {
        where: gte(dailyCheckins.date, cutoffDate),
        orderBy: [desc(dailyCheckins.date)],
      },
    },
  });

  const adminEmails = getAdminEmails();
  let alerted = 0;
  let skipped = 0;

  for (const patient of patients) {
    // Only alert for patients who have been logging (have at least N days of data)
    if ((patient.dailyCheckins?.length ?? 0) < CHECKIN_DIP_ALERT_DAYS) {
      skipped++;
      continue;
    }

    // Take the most recent N days
    const recent = patient.dailyCheckins.slice(0, CHECKIN_DIP_ALERT_DAYS);

    // Compute average of mood + energy + sleep per day, then overall average
    // Stress is inverted (high stress = bad) — we do NOT include it in the dip metric
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
      const sentDaysAgo =
        (Date.now() - new Date(profile.dipAlertSentAt).getTime()) /
        (24 * 60 * 60 * 1000);
      if (sentDaysAgo < CHECKIN_DIP_ALERT_DAYS) {
        skipped++;
        continue;
      }
    }

    const patientName = patient.name ?? patient.email?.split("@")[0] ?? "Unknown";
    const adminUrl = `${PORTAL_URL}/admin/patients/${patient.id}`;

    for (const adminEmail of adminEmails) {
      await sendEmail({
        to: adminEmail,
        subject: `⚠️ Check-in dip alert — ${patientName}`,
        html: checkinDipAlertEmail({
          patientName,
          patientEmail: patient.email ?? "",
          avgScore: overallAvg,
          days: CHECKIN_DIP_ALERT_DAYS,
          adminUrl,
        }),
      }).catch(console.error);
    }

    await db
      .update(profiles)
      .set({ dipAlertSentAt: new Date() })
      .where(eq(profiles.userId, patient.id));

    alerted++;
  }

  return NextResponse.json({ success: true, alerted, skipped });
}
