export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, asc, and, isNull, ne } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { threads, threadMessages, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { newMessageEmail } from "@/lib/email/templates";
import { COMPANY, PORTAL_URL, getAdminEmails } from "@/lib/config/company";
import { MESSAGE_BODY_MAX_LENGTH } from "@/lib/config/portal";
import { USER_ROLE } from "@/lib/config/auth";

const replySchema = z.object({
  body: z.string().min(1).max(MESSAGE_BODY_MAX_LENGTH),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const { threadId } = await params;
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      patient: { columns: { id: true, name: true, email: true } },
      messages: {
        orderBy: [asc(threadMessages.createdAt)],
        with: { sender: { columns: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!thread) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (session.user.role !== USER_ROLE.admin && thread.patientId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Mark messages from the other party as read
  await db
    .update(threadMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(threadMessages.threadId, threadId),
        ne(threadMessages.senderId, session.user.id),
        isNull(threadMessages.readAt)
      )
    );

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
  const thread = await db.query.threads.findFirst({ where: eq(threads.id, threadId) });
  if (!thread) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (session.user.role !== USER_ROLE.admin && thread.patientId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const parsed = replySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid message body" }, { status: 400 });
  }

  const [message] = await db
    .insert(threadMessages)
    .values({ threadId, senderId: session.user.id, body: parsed.data.body })
    .returning();

  await db
    .update(threads)
    .set({ lastMessageAt: new Date() })
    .where(eq(threads.id, threadId));

  // Notify the other party (fire-and-forget)
  const adminEmails = getAdminEmails();

  if (session.user.role === USER_ROLE.admin) {
    // Admin sent → notify patient
    const [patient, sender] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, thread.patientId), columns: { name: true, email: true } }),
      db.query.users.findFirst({ where: eq(users.id, session.user.id), columns: { name: true } }),
    ]);
    if (patient?.email) {
      sendEmail({
        to: patient.email,
        subject: `New message: ${thread.subject} — ${COMPANY.shortName}`,
        html: newMessageEmail({
          recipientName: patient.name ?? "there",
          senderName: sender?.name ?? COMPANY.shortName,
          subject: thread.subject,
          portalUrl: `${PORTAL_URL}/messages/${threadId}`,
        }),
      }).catch(console.error);
    }
  } else if (adminEmails.length > 0) {
    // Patient sent → notify admin(s)
    const patient = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true, email: true },
    });
    sendEmail({
      to: adminEmails,
      subject: `New message from ${patient?.name ?? "patient"}: ${thread.subject}`,
      html: newMessageEmail({
        recipientName: COMPANY.clinicianName,
        senderName: patient?.name ?? "Patient",
        subject: thread.subject,
        portalUrl: `${PORTAL_URL}/admin/messages/${threadId}`,
      }),
    }).catch(console.error);
  }

  return NextResponse.json({ success: true, data: message }, { status: 201 });
}
