export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { PATIENT_NOTE_MAX_LENGTH } from "@/lib/config/portal";
import { db } from "@/lib/db";
import { patientNotes, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;

  const notes = await db.query.patientNotes.findMany({
    where: eq(patientNotes.patientId, id),
    orderBy: [desc(patientNotes.createdAt)],
    with: { admin: { columns: { name: true } } },
  });

  return NextResponse.json({ success: true, data: notes });
}

const createSchema = z.object({
  body: z.string().min(1).max(PATIENT_NOTE_MAX_LENGTH),
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

  const [note] = await db
    .insert(patientNotes)
    .values({
      patientId: id,
      adminId: session.user.id,
      body: parsed.data.body,
    })
    .returning();

  const admin = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true },
  });

  return NextResponse.json(
    { success: true, data: { ...note, admin: { name: admin?.name ?? null } } },
    { status: 201 }
  );
}
