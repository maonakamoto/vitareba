export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clinicalGoals } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

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

const createSchema = z.object({
  title: z.string().min(1).max(300),
  metric: z.string().max(50).optional().nullable(),
  baseline: z.number().int().min(0).max(100).optional().nullable(),
  target: z.number().int().min(0).max(100).optional().nullable(),
  current: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { session } = guard;

  const { id } = await params;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
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
