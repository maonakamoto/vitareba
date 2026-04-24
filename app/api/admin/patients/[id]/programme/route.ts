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

      // Notify patient on first assignment — fire-and-forget, never block the response
      const programme = parsed.data.programme;
      const phase = parsed.data.phase;
      db.query.users
        .findFirst({ where: eq(users.id, id), columns: { name: true, email: true } })
        .then((patient) => {
          if (!patient?.email) return;
          return sendEmail({
            to: patient.email,
            subject: `You've been enrolled in ${PROGRAMME_CONFIG[programme].label}`,
            html: programmeAssignedEmail({
              patientName: patient.name ?? patient.email,
              programmeLabel: PROGRAMME_CONFIG[programme].label,
              phaseLabel: PHASE_CONFIG[phase].label,
              phaseDescription: PHASE_CONFIG[phase].description,
              portalUrl: PORTAL_URL,
            }),
          });
        })
        .catch((err) => console.error("[api/admin/programme] notification failed:", err));
    }
  } catch (err) {
    console.error("[api/admin/programme] upsert failed:", err);
    return NextResponse.json({ success: false, error: "Failed to save assignment — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result });
}
