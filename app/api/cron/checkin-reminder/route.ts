export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, assessmentResults, dailyCheckins } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import { checkinReminderEmail } from "@/lib/email/templates";
import { PORTAL_URL } from "@/lib/config/company";
import { formatDateISO } from "@/lib/utils/format";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const today = formatDateISO(new Date());

  const patients = await db.query.users.findMany({
    where: eq(users.role, "patient"),
    with: {
      profile: { columns: { digestOptOut: true } },
      assessmentResults: {
        orderBy: [desc(assessmentResults.completedAt)],
        limit: 1,
      },
      dailyCheckins: {
        where: eq(dailyCheckins.date, today),
        limit: 1,
      },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const patient of patients) {
    // Skip if opted out of digests
    if (patient.profile?.digestOptOut) { skipped++; continue; }
    // Skip pre-intake patients (no assessment yet)
    if (patient.assessmentResults.length === 0) { skipped++; continue; }
    // Skip if already checked in today
    if (patient.dailyCheckins.length > 0) { skipped++; continue; }

    const patientName = patient.name ?? patient.email?.split("@")[0] ?? "there";
    await sendEmail({
      to: patient.email ?? "",
      subject: "How are you doing today?",
      html: checkinReminderEmail({ patientName, portalUrl: PORTAL_URL }),
    }).catch(console.error);
    sent++;
  }

  return NextResponse.json({ success: true, sent, skipped });
}
