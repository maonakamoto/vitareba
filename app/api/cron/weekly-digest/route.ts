export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, dailyCheckins } from "@/lib/db/schema";
import { eq, gte, and, desc, inArray } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import { weeklyDigestEmail } from "@/lib/email/templates";
import { getVerdictName } from "@/lib/assessment/data";
import { PORTAL_URL } from "@/lib/config/company";
import { formatDateISO } from "@/lib/utils/format";

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

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const prevWeekStart = new Date(now);
  prevWeekStart.setDate(prevWeekStart.getDate() - 14);

  const thisWeekISO = formatDateISO(thisWeekStart);
  const prevWeekISO = formatDateISO(prevWeekStart);

  // Fetch all patients with their profile, latest assessment, and latest booking
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

  // Batch-load last 14 days of check-ins for all patients in a single query
  const patientIds = patients.map((p) => p.id);
  const allCheckins = patientIds.length > 0
    ? await db
        .select()
        .from(dailyCheckins)
        .where(
          and(
            inArray(dailyCheckins.userId, patientIds),
            gte(dailyCheckins.date, prevWeekISO)
          )
        )
    : [];

  // Group check-ins by userId for O(1) lookup in the loop
  const checkinsByPatient = new Map<string, typeof allCheckins>();
  for (const checkin of allCheckins) {
    const list = checkinsByPatient.get(checkin.userId) ?? [];
    list.push(checkin);
    checkinsByPatient.set(checkin.userId, list);
  }

  let sent = 0;
  let skipped = 0;

  for (const patient of patients) {
    if (!patient.email) { skipped++; continue; }

    // Skip opted-out patients
    if (patient.profile?.digestOptOut) { skipped++; continue; }

    // Skip patients with no assessments and no recent activity
    const hasAssessment = patient.assessmentResults.length > 0;

    const recentCheckins = checkinsByPatient.get(patient.id) ?? [];

    // Skip if no assessments AND no recent activity
    if (!hasAssessment && recentCheckins.length === 0) { skipped++; continue; }

    // Compute week averages
    const thisWeekCheckins = recentCheckins.filter((c) => c.date >= thisWeekISO);
    const prevWeekCheckins = recentCheckins.filter(
      (c) => c.date >= prevWeekISO && c.date < thisWeekISO
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
