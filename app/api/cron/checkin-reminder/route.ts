export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, assessmentResults, dailyCheckins } from "@/lib/db/schema";
import { eq, desc, gte } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import { checkinReminderEmail } from "@/lib/email/templates";
import { PORTAL_URL } from "@/lib/config/company";
import { formatDateISO, displayName } from "@/lib/utils/format";
import { USER_ROLE } from "@/lib/config/auth";
import { requireCron } from "@/lib/auth/guards";
import { computeStreak } from "@/lib/domain/checkin";
import { CHECKIN_HISTORY_DAYS } from "@/lib/config/portal";

export async function GET(req: Request) {
  const cronError = requireCron(req);
  if (cronError) return cronError;

  const now = new Date();
  const today = formatDateISO(now);
  // Fetch CHECKIN_HISTORY_DAYS so streak computation is accurate beyond the
  // 100-day milestone. A shorter window would cap the reported streak at the
  // window length, showing the wrong streak for long-tenured patients.
  const historyStart = new Date(now);
  historyStart.setDate(historyStart.getDate() - CHECKIN_HISTORY_DAYS);
  const historyStartISO = formatDateISO(historyStart);

  let patients;
  try {
    patients = await db.query.users.findMany({
      where: eq(users.role, USER_ROLE.patient),
      with: {
        profile: { columns: { reminderOptOut: true } },
        assessmentResults: {
          orderBy: [desc(assessmentResults.completedAt)],
          limit: 1,
        },
        dailyCheckins: {
          where: gte(dailyCheckins.date, historyStartISO),
          orderBy: [desc(dailyCheckins.date)],
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
      !p.profile?.reminderOptOut &&
      p.assessmentResults.length > 0 &&
      !p.dailyCheckins.some((c) => c.date === today)
  );
  const skipped = patients.length - sendable.length;

  // Streak at risk = consecutive days ending yesterday (today not yet logged)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Send all reminders in parallel — independent per-patient, no ordering needed
  await Promise.allSettled(
    sendable.map((patient) => {
      const patientName = displayName(patient.name, patient.email);
      const atRiskStreak = computeStreak(patient.dailyCheckins, yesterday);
      return sendEmail({
        to: patient.email!,
        subject: atRiskStreak >= 2
          ? `🔥 ${atRiskStreak}-day streak — log today to keep it alive`
          : "How are you doing today?",
        html: checkinReminderEmail({ patientName, portalUrl: PORTAL_URL, atRiskStreak }),
      }).catch((err) => console.error("[cron/checkin-reminder] send failed for", patient.id, err));
    })
  );

  return NextResponse.json({ success: true, sent: sendable.length, skipped });
}
