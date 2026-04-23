export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { requireSession, requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { USER_ROLE } from "@/lib/config/auth";
import { DOCUMENT_TITLE_MAX_LENGTH } from "@/lib/config/portal";

const createSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(DOCUMENT_TITLE_MAX_LENGTH),
  fileUrl: z.string().url(),
  mimeType: z.string().max(100).optional(),
});

export async function GET(req: Request) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (patientId && !UUID_RE.test(patientId)) {
    return NextResponse.json({ success: false, error: "Invalid patientId" }, { status: 400 });
  }

  try {
    // Admin with no patientId filter → return all documents with user info
    if (session.user.role === USER_ROLE.admin && !patientId) {
      const results = await db.query.documents.findMany({
        orderBy: [desc(documents.createdAt)],
        with: { user: { columns: { id: true, name: true, email: true } } },
      });
      return NextResponse.json({ success: true, data: results });
    }

    const targetId =
      session.user.role === USER_ROLE.admin && patientId ? patientId : session.user.id;

    const results = await db.query.documents.findMany({
      where: eq(documents.userId, targetId),
      orderBy: [desc(documents.createdAt)],
    });
    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error("[api/documents] GET failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { session } = guard;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  let doc: typeof documents.$inferSelect;
  try {
    [doc] = await db
      .insert(documents)
      .values({ ...parsed.data, uploadedBy: session.user.id })
      .returning();
  } catch (err) {
    console.error("[api/documents] insert failed:", err);
    return NextResponse.json({ success: false, error: "Failed to save document — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: doc }, { status: 201 });
}
