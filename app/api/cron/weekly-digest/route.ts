export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, profiles, assessmentResults, bookings, dailyCheckins } from "@/lib/db/schema";
import { eq, gte, and, desc } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import { weeklyDigestEmail } from "@/lib/email/templates";
import { VERDICT_TIERS } from "@/lib/assessment/data";
import { PORTAL_URL } from "@/lib/config/company";
const ACTIVE_CHECKIN_DAYS = 30;

function getVerdictName(score: number): string {
  return VERDICT_TIERS.find((t) => score >= t.minScore && score <= t.maxScore)?.name ?? "";
}

function avgMetrics(checkins: Array<{ sleep: number; energy: number; mood: number; focus: number; stress: number }>) {
  if (checkins.length === 0) return null;
  const sum = checkins.reduce(
    (acc, c) => ({
      sleep: acc.sleep + c.sleep,
      energy: acc.energy + c.energy,
      mood: acc.mood + c.mood,
      focus: acc.focus + c.focus,
      stress: acc.stress + c.stress,
    }),
    { sleep: 0, energy: 0, mood: 0, focus: 0, stress: 0 }
  );
  const n = checkins.length;
  return {
    sleep: sum.sleep / n,
    energy: sum.energy / n,
    mood: sum.mood / n,
    focus: sum.focus / n,
    stress: sum.stress / n,
  };
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - ACTIVE_CHECKIN_DAYS);

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const prevWeekStart = new Date(now);
  prevWeekStart.setDate(prevWeekStart.getDate() - 14);

  // Fetch all patients with their profile, latest assessment, latest booking, and last 14 days of check-ins
  const patients = await db.query.users.findMany({
    where: eq(users.role, "patient"),
    with: {
      profile: { columns: { digestOptOut: true } },
      assessmentResults: {
        orderBy: [desc(assessmentResults.completedAt)],
        limit: 1,
      },
      bookings: {
        orderBy: [desc(bookings.createdAt)],
        limit: 1,
      },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const patient of patients) {
    if (!patient.email) { skipped++; continue; }

    // Skip opted-out patients
    if (patient.profile?.digestOptOut) { skipped++; continue; }

    // Skip patients with no assessments and no recent activity
    const hasAssessment = patient.assessmentResults.length > 0;

    // Fetch last 14 days of check-ins for this patient
    const recentCheckins = await db.query.dailyCheckins.findMany({
      where: and(
        eq(dailyCheckins.userId, patient.id),
        gte(dailyCheckins.date, dateStr(cutoffDate))
      ),
    });

    const hasRecentActivity = recentCheckins.some(
      (c) => c.date >= dateStr(thisWeekStart)
    );

    // Skip if no assessments AND no recent activity
    if (!hasAssessment && recentCheckins.length === 0) { skipped++; continue; }

    // Compute week averages
    const thisWeekCheckins = recentCheckins.filter((c) => c.date >= dateStr(thisWeekStart));
    const prevWeekCheckins = recentCheckins.filter(
      (c) => c.date >= dateStr(prevWeekStart) && c.date < dateStr(thisWeekStart)
    );

    const thisWeekAvgs = avgMetrics(thisWeekCheckins);
    const prevWeekAvgs = avgMetrics(prevWeekCheckins);

    const latestAssessment = patient.assessmentResults[0];
    const latestScore = latestAssessment?.overallScore ?? null;
    const verdictName = latestScore !== null ? getVerdictName(latestScore) : null;
    const nextBookingStatus = patient.bookings[0]?.status ?? null;

    const patientName = patient.name ?? patient.email.split("@")[0];

    try {
      const html = weeklyDigestEmail({
        patientName,
        thisWeekAvgs,
        prevWeekAvgs,
        latestScore,
        verdictName,
        nextBookingStatus,
        portalUrl: PORTAL_URL,
      });

      await sendEmail({
        to: patient.email,
        subject: "Your VitaReBa weekly summary",
        html,
      });

      sent++;
    } catch (err) {
      console.error("[cron/weekly-digest] send failed for", patient.id, err);
      skipped++;
    }
  }

  return NextResponse.json({ success: true, sent, skipped });
}
