export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { bookingConfirmedEmail, bookingCancelledEmail } from "@/lib/email/templates";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

const APP_URL = process.env.AUTH_URL ?? "https://vitareba.ch";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: parsed.data.status })
    .where(eq(bookings.id, id))
    .returning();

  // Notify patient of status change (fire-and-forget)
  if (parsed.data.status === "confirmed" || parsed.data.status === "cancelled") {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, updated.userId),
      columns: { name: true, email: true },
    });
    if (patient?.email) {
      const html = parsed.data.status === "confirmed"
        ? bookingConfirmedEmail({ patientName: patient.name ?? "there", portalUrl: `${APP_URL}/bookings` })
        : bookingCancelledEmail({ patientName: patient.name ?? "there", portalUrl: `${APP_URL}/bookings` });
      sendEmail({
        to: patient.email,
        subject: parsed.data.status === "confirmed"
          ? "Your consultation has been confirmed — VitaReBa"
          : "Your consultation request — VitaReBa",
        html,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ success: true, data: updated });
}
