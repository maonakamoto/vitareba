export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, documents, threads, threadMessages } from "@/lib/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;

  let patient;
  try {
    patient = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        profile: true,
        assessmentResults: { orderBy: [desc(assessmentResults.completedAt)] },
        bookings: { orderBy: [desc(bookings.createdAt)] },
        documents: { orderBy: [desc(documents.createdAt)] },
        threads: {
          orderBy: [desc(threads.lastMessageAt)],
          with: {
            messages: {
              orderBy: [desc(threadMessages.createdAt)],
              limit: 1,
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("[api/admin/patients/id] GET failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }

  if (!patient) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: patient });
}
