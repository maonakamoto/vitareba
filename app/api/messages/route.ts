export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { threads, threadMessages } from "@/lib/db/schema";
import { MESSAGE_SUBJECT_MAX_LENGTH, MESSAGE_BODY_MAX_LENGTH } from "@/lib/config/portal";
import { USER_ROLE } from "@/lib/config/auth";

const createSchema = z.object({
  subject: z.string().min(1).max(MESSAGE_SUBJECT_MAX_LENGTH),
  body: z.string().min(1).max(MESSAGE_BODY_MAX_LENGTH),
  patientId: z.string().uuid().optional(), // admin can open thread on behalf of patient
});

export async function GET() {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const where =
    session.user.role === USER_ROLE.admin
      ? undefined
      : eq(threads.patientId, session.user.id);

  const results = await db.query.threads.findMany({
    where,
    orderBy: [desc(threads.lastMessageAt)],
    with: {
      patient: { columns: { id: true, name: true, email: true } },
      messages: { orderBy: [desc(threadMessages.createdAt)], limit: 1 },
    },
  });

  return NextResponse.json({ success: true, data: results });
}

export async function POST(req: Request) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const patientId =
    session.user.role === USER_ROLE.admin && parsed.data.patientId
      ? parsed.data.patientId
      : session.user.id;

  let thread: typeof threads.$inferSelect;
  try {
    [thread] = await db
      .insert(threads)
      .values({ patientId, subject: parsed.data.subject })
      .returning();
    await db.insert(threadMessages).values({
      threadId: thread.id,
      senderId: session.user.id,
      body: parsed.data.body,
    });
  } catch (err) {
    console.error("[api/messages] thread creation failed:", err);
    return NextResponse.json({ success: false, error: "Failed to send message — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: thread }, { status: 201 });
}
