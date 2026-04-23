export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clinicalGoals } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  let goals;
  try {
    goals = await db.query.clinicalGoals.findMany({
      where: eq(clinicalGoals.patientId, session.user.id),
      orderBy: [asc(clinicalGoals.createdAt)],
    });
  } catch (err) {
    console.error("[api/goals] GET failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: goals });
}
