export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { threads, threadMessages } from "@/lib/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { threadId } = await params;
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      messages: {
        orderBy: [asc(threadMessages.createdAt)],
        with: { sender: { columns: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!thread) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (session.user.role !== "admin" && thread.patientId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: thread });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { threadId } = await params;
  const thread = await db.query.threads.findFirst({ where: eq(threads.id, threadId) });
  if (!thread) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (session.user.role !== "admin" && thread.patientId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ success: false, error: "Message body required" }, { status: 400 });
  }

  const [message] = await db
    .insert(threadMessages)
    .values({ threadId, senderId: session.user.id, body })
    .returning();

  await db
    .update(threads)
    .set({ lastMessageAt: new Date() })
    .where(eq(threads.id, threadId));

  return NextResponse.json({ success: true, data: message }, { status: 201 });
}
