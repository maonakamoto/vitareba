export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, asc, and, isNull, ne } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { threads, threadMessages, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { newMessageEmail } from "@/lib/email/templates";
import { COMPANY, PORTAL_URL, getAdminEmails } from "@/lib/config/company";
import { ADMIN_ROUTES, PORTAL_ROUTES } from "@/lib/config/routes";
import { USER_ROLE } from "@/lib/config/auth";
import { replySchema } from "@/lib/domain/messages";
import { runAfterResponse } from "@/lib/utils/post-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const { threadId } = await params;
  let thread;
  try {
    thread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
      with: {
        patient: { columns: { id: true, name: true, email: true } },
        messages: {
          orderBy: [asc(threadMessages.createdAt)],
          with: { sender: { columns: { id: true, name: true, role: true } } },
        },
      },
    });
  } catch (err) {
    console.error("[api/messages/threadId] GET failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }

  if (!thread) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (session.user.role !== USER_ROLE.admin && thread.patientId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Mark messages as read after returning the thread payload.
  runAfterResponse(async () => {
    await db.update(threadMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(threadMessages.threadId, threadId),
          ne(threadMessages.senderId, session.user.id),
          isNull(threadMessages.readAt)
        )
      );
  }, "[api/messages/threadId] mark-read failed:");

  return NextResponse.json({ success: true, data: thread });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const { threadId } = await params;
  let thread;
  try {
    thread = await db.query.threads.findFirst({ where: eq(threads.id, threadId) });
  } catch (err) {
    console.error("[api/messages/threadId] POST thread lookup failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }
  if (!thread) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (session.user.role !== USER_ROLE.admin && thread.patientId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const parsed = replySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid message body" }, { status: 400 });
  }

  let message: typeof threadMessages.$inferSelect;
  try {
    [message] = await db
      .insert(threadMessages)
      .values({ threadId, senderId: session.user.id, body: parsed.data.body })
      .returning();
    await db
      .update(threads)
      .set({ lastMessageAt: new Date() })
      .where(eq(threads.id, threadId));
  } catch (err) {
    console.error("[api/messages/threadId] send failed:", err);
    return NextResponse.json({ success: false, error: "Failed to send message — please try again" }, { status: 500 });
  }

  // Schedule notification work after the response so it is not dropped when the
  // request lifecycle ends.
  const adminEmails = getAdminEmails();

  if (session.user.role === USER_ROLE.admin) {
    runAfterResponse(async () => {
      const [patient, sender] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, thread.patientId), columns: { name: true, email: true } }),
        db.query.users.findFirst({ where: eq(users.id, session.user.id), columns: { name: true } }),
      ]);
      if (!patient?.email) return;
      await sendEmail({
        to: patient.email,
        subject: `New message: ${thread.subject} — ${COMPANY.shortName}`,
        html: newMessageEmail({
          recipientName: patient.name ?? "there",
          senderName: sender?.name ?? COMPANY.shortName,
          subject: thread.subject,
          portalUrl: `${PORTAL_URL}${PORTAL_ROUTES.messages}/${threadId}`,
        }),
      });
    }, "[api/messages/threadId] patient notification failed:");
  } else if (adminEmails.length > 0) {
    runAfterResponse(async () => {
      const patient = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { name: true, email: true },
      });
      await sendEmail({
        to: adminEmails,
        subject: `New message from ${patient?.name ?? "patient"}: ${thread.subject}`,
        html: newMessageEmail({
          recipientName: COMPANY.clinicianName,
          senderName: patient?.name ?? "Patient",
          subject: thread.subject,
          portalUrl: `${PORTAL_URL}${ADMIN_ROUTES.messages}/${threadId}`,
        }),
      });
    }, "[api/messages/threadId] admin notification failed:");
  }

  return NextResponse.json({ success: true, data: message }, { status: 201 });
}
