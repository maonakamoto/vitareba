export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { dailyCheckins } from "@/lib/db/schema";
import { CHECKIN_HISTORY_DAYS, CHECKIN_FETCH_MAX_DAYS } from "@/lib/config/portal";
import { formatDateISO } from "@/lib/utils/format";
import { checkinSchema } from "@/lib/domain/checkin";

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
  let allCheckins;
  try {
    allCheckins = await db.query.dailyCheckins.findMany({
      where: eq(dailyCheckins.userId, session.user.id),
      orderBy: [desc(dailyCheckins.date)],
      limit: days,
    });
  } catch (err) {
    console.error("[api/checkin] GET failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }

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

  // Upsert: check existence then update or insert — all inside one try-catch
  try {
    const existing = await db.query.dailyCheckins.findFirst({
      where: and(
        eq(dailyCheckins.userId, session.user.id),
        eq(dailyCheckins.date, date)
      ),
    });

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
