export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { programmeAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PROGRAMME_ENUM_VALUES, PHASE_ENUM_VALUES } from "@/lib/config/programmes";
import { PATIENT_NOTE_MAX_LENGTH } from "@/lib/config/portal";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;

  let assignment;
  try {
    assignment = await db.query.programmeAssignments.findFirst({
      where: eq(programmeAssignments.patientId, id),
    });
  } catch (err) {
    console.error("[api/admin/programme] GET failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: assignment ?? null });
}

const updateSchema = z.object({
  programme: z.enum(PROGRAMME_ENUM_VALUES),
  phase: z.enum(PHASE_ENUM_VALUES),
  startDate: z.string().max(10).nullable().optional(),
  notes: z.string().max(PATIENT_NOTE_MAX_LENGTH).nullable().optional(),
});

export async function PATCH(req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { session } = guard;

  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  let result: typeof programmeAssignments.$inferSelect;
  try {
    const existing = await db.query.programmeAssignments.findFirst({
      where: eq(programmeAssignments.patientId, id),
    });
    if (existing) {
      [result] = await db
        .update(programmeAssignments)
        .set({
          programme: parsed.data.programme,
          phase: parsed.data.phase,
          startDate: parsed.data.startDate ?? null,
          notes: parsed.data.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(programmeAssignments.patientId, id))
        .returning();
    } else {
      [result] = await db
        .insert(programmeAssignments)
        .values({
          patientId: id,
          programme: parsed.data.programme,
          phase: parsed.data.phase,
          startDate: parsed.data.startDate ?? null,
          notes: parsed.data.notes ?? null,
          assignedBy: session.user.id,
        })
        .returning();
    }
  } catch (err) {
    console.error("[api/admin/programme] upsert failed:", err);
    return NextResponse.json({ success: false, error: "Failed to save assignment — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result });
}
