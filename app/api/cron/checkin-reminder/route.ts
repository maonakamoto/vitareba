export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, assessmentResults, dailyCheckins } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import { checkinReminderEmail } from "@/lib/email/templates";
import { PORTAL_URL } from "@/lib/config/company";
import { formatDateISO, displayName } from "@/lib/utils/format";
import { USER_ROLE } from "@/lib/config/auth";
import { requireCron } from "@/lib/auth/guards";

export async function GET(req: Request) {
  const cronError = requireCron(req);
  if (cronError) return cronError;

  const today = formatDateISO(new Date());

  let patients;
  try {
    patients = await db.query.users.findMany({
      where: eq(users.role, USER_ROLE.patient),
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
  } catch (err) {
    console.error("[cron/checkin-reminder] DB read failed:", err);
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 500 });
  }

  // Filter to patients who should receive a reminder (email required, not opted out,
  // has completed at least one assessment, and hasn't checked in today)
  const sendable = patients.filter(
    (p) =>
      p.email &&
      !p.profile?.digestOptOut &&
      p.assessmentResults.length > 0 &&
      p.dailyCheckins.length === 0
  );
  const skipped = patients.length - sendable.length;

  // Send all reminders in parallel — independent per-patient, no ordering needed
  await Promise.allSettled(
    sendable.map((patient) => {
      const patientName = displayName(patient.name, patient.email);
      return sendEmail({
        to: patient.email!,
        subject: "How are you doing today?",
        html: checkinReminderEmail({ patientName, portalUrl: PORTAL_URL }),
      }).catch((err) => console.error("[cron/checkin-reminder] send failed for", patient.id, err));
    })
  );

  return NextResponse.json({ success: true, sent: sendable.length, skipped });
}
