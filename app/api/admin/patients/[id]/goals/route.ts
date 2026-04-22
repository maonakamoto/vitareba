export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clinicalGoals } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { goalCreateSchema } from "@/lib/domain/goals";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;

  const goals = await db.query.clinicalGoals.findMany({
    where: eq(clinicalGoals.patientId, id),
    orderBy: [asc(clinicalGoals.createdAt)],
  });

  return NextResponse.json({ success: true, data: goals });
}

export async function POST(req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { session } = guard;

  const { id } = await params;

  const body = await req.json();
  const parsed = goalCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const [goal] = await db
    .insert(clinicalGoals)
    .values({
      patientId: id,
      setByAdminId: session.user.id,
      title: parsed.data.title,
      metric: parsed.data.metric ?? null,
      baseline: parsed.data.baseline ?? null,
      target: parsed.data.target ?? null,
      current: parsed.data.current ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  return NextResponse.json({ success: true, data: goal }, { status: 201 });
}
