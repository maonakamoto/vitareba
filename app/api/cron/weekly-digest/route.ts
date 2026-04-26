export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, dailyCheckins, clinicalGoals } from "@/lib/db/schema";
import { eq, gte, and, desc, inArray, isNull } from "drizzle-orm";
import { computeGoalProgress } from "@/lib/domain/goals";
import { sendEmail } from "@/lib/email/index";
import { weeklyDigestEmail } from "@/lib/email/templates";
import { getVerdictName } from "@/lib/assessment/data";
import { PORTAL_URL, COMPANY } from "@/lib/config/company";
import { formatDateISO, displayName } from "@/lib/utils/format";
import { USER_ROLE } from "@/lib/config/auth";
import { requireCron } from "@/lib/auth/guards";
import { CHECKIN_METRICS, type MetricKey } from "@/lib/config/portal";
import { BOOKING_STATUS, BOOKING_STATUS_CONFIG } from "@/lib/config/booking-status";

function avgMetrics(checkins: Array<Record<MetricKey, number>>): Record<MetricKey, number> | null {
  if (checkins.length === 0) return null;
  const result = {} as Record<MetricKey, number>;
  for (const { key } of CHECKIN_METRICS) {
    result[key] = checkins.reduce((acc, c) => acc + c[key], 0) / checkins.length;
  }
  return result;
}

export async function GET(req: Request) {
  const cronError = requireCron(req);
  if (cronError) return cronError;

  const now = new Date();

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const prevWeekStart = new Date(now);
  prevWeekStart.setDate(prevWeekStart.getDate() - 14);

  const thisWeekISO = formatDateISO(thisWeekStart);
  const prevWeekISO = formatDateISO(prevWeekStart);

  // Fetch all patients with their profile, latest assessment, and latest booking
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
        // Only fetch pending/confirmed bookings — attended/cancelled are past and
        // must not appear as "your next consultation" in the weekly digest.
        bookings: {
          where: inArray(bookings.status, [BOOKING_STATUS.pending, BOOKING_STATUS.confirmed]),
          orderBy: [desc(bookings.createdAt)],
          limit: 1,
        },
        // Active goals only — completed goals have already been celebrated
        clinicalGoals: {
          where: isNull(clinicalGoals.completedAt),
        },
      },
    });
  } catch (err) {
    console.error("[cron/weekly-digest] DB read failed:", err);
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 500 });
  }

  // Batch-load last 14 days of check-ins for all patients in a single query
  const patientIds = patients.map((p) => p.id);
  let allCheckins: (typeof dailyCheckins.$inferSelect)[] = [];
  if (patientIds.length > 0) {
    try {
      allCheckins = await db
        .select()
        .from(dailyCheckins)
        .where(
          and(
            inArray(dailyCheckins.userId, patientIds),
            gte(dailyCheckins.date, prevWeekISO)
          )
        );
    } catch (err) {
      console.error("[cron/weekly-digest] checkins DB read failed:", err);
      return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 500 });
    }
  }

  // Group check-ins by userId for O(1) lookup
  const checkinsByPatient = new Map<string, typeof allCheckins>();
  for (const checkin of allCheckins) {
    const list = checkinsByPatient.get(checkin.userId) ?? [];
    list.push(checkin);
    checkinsByPatient.set(checkin.userId, list);
  }

  // Filter to patients who should receive a digest
  const sendable = patients.filter((p) => {
    if (!p.email) return false;
    if (p.profile?.digestOptOut) return false;
    const hasAssessment = p.assessmentResults.length > 0;
    const recentCheckins = checkinsByPatient.get(p.id) ?? [];
    return hasAssessment || recentCheckins.length > 0;
  });
  const skippedCount = patients.length - sendable.length;

  // Send all digests in parallel — independent per-patient, no ordering needed
  const results = await Promise.allSettled(
    sendable.map((patient) => {
      const recentCheckins = checkinsByPatient.get(patient.id) ?? [];
      const thisWeekCheckins = recentCheckins.filter((c) => c.date >= thisWeekISO);
      const prevWeekCheckins = recentCheckins.filter(
        (c) => c.date >= prevWeekISO && c.date < thisWeekISO
      );

      const latestAssessment = patient.assessmentResults[0];
      const latestScore = latestAssessment?.overallScore ?? null;

      // Build goal summaries — only goals with enough data to show progress
      const goalSummaries = (patient.clinicalGoals ?? [])
        .filter((g) => g.current != null && g.target != null)
        .map((g) => ({
          title: g.title,
          pct: computeGoalProgress(g.baseline, g.current, g.target),
          current: g.current as number,
          target: g.target as number,
        }))
        .filter((g) => g.pct !== null) as { title: string; pct: number; current: number; target: number }[];

      const html = weeklyDigestEmail({
        patientName: displayName(patient.name, patient.email),
        thisWeekAvgs: avgMetrics(thisWeekCheckins),
        prevWeekAvgs: avgMetrics(prevWeekCheckins),
        latestScore,
        verdictName: latestScore !== null ? getVerdictName(latestScore) : null,
        nextBookingStatus: patient.bookings[0]
          ? BOOKING_STATUS_CONFIG[patient.bookings[0].status].label
          : null,
        activeGoals: goalSummaries,
        portalUrl: PORTAL_URL,
      });

      return sendEmail({
        to: patient.email!,
        subject: `Your ${COMPANY.shortName} weekly summary`,
        html,
      });
    })
  );

  let sent = 0;
  let failed = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      sent++;
    } else {
      failed++;
      console.error("[cron/weekly-digest] send failed for", sendable[i].id, r.reason);
    }
  });

  return NextResponse.json({ success: true, sent, skipped: skippedCount + failed });
}
