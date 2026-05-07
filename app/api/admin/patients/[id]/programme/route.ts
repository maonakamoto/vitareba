export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { programmeAssignments, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { programmeUpdateSchema } from "@/lib/domain/programmes";
import { sendEmail } from "@/lib/email";
import { programmeAssignedEmail } from "@/lib/email/templates";
import { PORTAL_URL } from "@/lib/config/company";
import { PROGRAMME_CONFIG, PHASE_CONFIG } from "@/lib/config/programmes";
import { runAfterResponse } from "@/lib/utils/post-response";
import { serviceUnavailable } from "@/lib/utils/api-response";
import { displayName } from "@/lib/utils/format";

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
    return serviceUnavailable();
  }

  return NextResponse.json({ success: true, data: assignment ?? null });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { session } = guard;

  const { id } = await params;

  const body = await req.json();
  const parsed = programmeUpdateSchema.safeParse(body);
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

      const programme = parsed.data.programme;
      const phase = parsed.data.phase;
      runAfterResponse(async () => {
        const patient = await db.query.users.findFirst({
          where: eq(users.id, id),
          columns: { name: true, email: true },
        });
        if (!patient?.email) return;
        await sendEmail({
          to: patient.email,
          subject: `You've been enrolled in ${PROGRAMME_CONFIG[programme].label}`,
          html: programmeAssignedEmail({
            patientName: displayName(patient.name, patient.email),
            programmeLabel: PROGRAMME_CONFIG[programme].label,
            phaseLabel: PHASE_CONFIG[phase].label,
            phaseDescription: PHASE_CONFIG[phase].description,
            portalUrl: PORTAL_URL,
          }),
        });
      }, "[api/admin/programme] notification failed:");
    }
  } catch (err) {
    console.error("[api/admin/programme] upsert failed:", err);
    return NextResponse.json({ success: false, error: "Failed to save assignment — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result });
}
