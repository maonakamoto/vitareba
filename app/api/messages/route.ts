export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { threads, threadMessages } from "@/lib/db/schema";

const createSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  patientId: z.string().uuid().optional(), // admin can open thread on behalf of patient
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const where =
    session.user.role === "admin"
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
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const patientId =
    session.user.role === "admin" && parsed.data.patientId
      ? parsed.data.patientId
      : session.user.id;

  const [thread] = await db
    .insert(threads)
    .values({ patientId, subject: parsed.data.subject })
    .returning();

  await db.insert(threadMessages).values({
    threadId: thread.id,
    senderId: session.user.id,
    body: parsed.data.body,
  });

  return NextResponse.json({ success: true, data: thread }, { status: 201 });
}
