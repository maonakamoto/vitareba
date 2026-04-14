export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, documents, threads, threadMessages } from "@/lib/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const patient = await db.query.users.findFirst({
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

  if (!patient) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: patient });
}
