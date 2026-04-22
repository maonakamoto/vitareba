export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clinicalGoals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { goalUpdateSchema } from "@/lib/domain/goals";

type RouteContext = { params: Promise<{ goalId: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { goalId } = await params;

  const body = await req.json();
  const parsed = goalUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const { completed, ...rest } = parsed.data;

  const [updated] = await db
    .update(clinicalGoals)
    .set({
      ...rest,
      ...(completed !== undefined
        ? { completedAt: completed ? new Date() : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(clinicalGoals.id, goalId))
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { goalId } = await params;

  await db.delete(clinicalGoals).where(eq(clinicalGoals.id, goalId));

  return NextResponse.json({ success: true });
}
