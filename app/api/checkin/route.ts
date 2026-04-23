export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { dailyCheckins } from "@/lib/db/schema";
import { CHECKIN_SCALE_MIN, CHECKIN_SCALE_MAX, CHECKIN_HISTORY_DAYS, CHECKIN_FETCH_MAX_DAYS, CHECKIN_NOTES_MAX_LENGTH } from "@/lib/config/portal";
import { formatDateISO } from "@/lib/utils/format";

const metricSchema = z
  .number()
  .int()
  .min(CHECKIN_SCALE_MIN)
  .max(CHECKIN_SCALE_MAX);

const checkinSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleep: metricSchema,
  energy: metricSchema,
  mood: metricSchema,
  focus: metricSchema,
  stress: metricSchema,
  notes: z.string().max(CHECKIN_NOTES_MAX_LENGTH).optional(),
});

export async function GET(req: Request) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("days");
  const parsedDays = limitParam ? parseInt(limitParam, 10) : NaN;
  const days = !isNaN(parsedDays) && parsedDays > 0
    ? Math.min(parsedDays, CHECKIN_FETCH_MAX_DAYS)
    : CHECKIN_HISTORY_DAYS;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = formatDateISO(cutoff);

  // Fetch recent check-ins ordered ascending for chart rendering
  const allCheckins = await db.query.dailyCheckins.findMany({
    where: eq(dailyCheckins.userId, session.user.id),
    orderBy: [desc(dailyCheckins.date)],
    limit: days,
  });

  // Today's check-in
  const today = formatDateISO(new Date());
  const todayCheckin = allCheckins.find((c) => c.date === today) ?? null;

  return NextResponse.json({
    success: true,
    data: {
      checkins: allCheckins.reverse(), // ascending for chart
      todayCheckin,
      cutoffDate: cutoffStr,
    },
  });
}

export async function POST(req: Request) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const body = await req.json();
  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { date, ...metrics } = parsed.data;

  // Upsert: update if exists for this date, else insert
  const existing = await db.query.dailyCheckins.findFirst({
    where: and(
      eq(dailyCheckins.userId, session.user.id),
      eq(dailyCheckins.date, date)
    ),
  });

  try {
    if (existing) {
      await db
        .update(dailyCheckins)
        .set(metrics)
        .where(and(
          eq(dailyCheckins.userId, session.user.id),
          eq(dailyCheckins.date, date)
        ));
    } else {
      await db.insert(dailyCheckins).values({
        userId: session.user.id,
        date,
        ...metrics,
      });
    }
  } catch (err) {
    console.error("[api/checkin] save failed:", err);
    return NextResponse.json({ success: false, error: "Failed to save check-in — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
