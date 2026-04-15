export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clinicalGoals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ goalId: string }> };

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  metric: z.string().max(50).optional().nullable(),
  baseline: z.number().int().min(0).max(100).optional().nullable(),
  target: z.number().int().min(0).max(100).optional().nullable(),
  current: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  completed: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { goalId } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
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
