export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { bookingRequestAdminEmail } from "@/lib/email/templates";

const createSchema = z.object({
  preferredDate: z.string().optional(),
  notes: z.string().optional(),
});

const APP_URL = process.env.AUTH_URL ?? "https://vitareba.ch";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const where = session.user.role === "admin"
    ? undefined
    : eq(bookings.userId, session.user.id);

  const results = await db.query.bookings.findMany({
    where,
    orderBy: [desc(bookings.createdAt)],
    with: { user: { columns: { id: true, name: true, email: true } } },
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

  const [booking] = await db
    .insert(bookings)
    .values({ userId: session.user.id, ...parsed.data })
    .returning();

  // Notify admin of new booking request (fire-and-forget — don't block the response)
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (adminEmails.length > 0) {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true, email: true },
    });
    sendEmail({
      to: adminEmails,
      subject: `New consultation request — ${patient?.name ?? session.user.email}`,
      html: bookingRequestAdminEmail({
        patientName: patient?.name ?? "Unknown",
        patientEmail: patient?.email ?? "",
        notes: parsed.data.notes,
        preferredDate: parsed.data.preferredDate,
        adminUrl: `${APP_URL}/admin/patients`,
      }),
    }).catch(console.error);
  }

  return NextResponse.json({ success: true, data: booking }, { status: 201 });
}
