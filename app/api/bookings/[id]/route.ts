export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { bookings, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { bookingConfirmedEmail, bookingCancelledEmail } from "@/lib/email/templates";
import { PORTAL_URL } from "@/lib/config/company";
import { BOOKING_STATUS_VALUES } from "@/lib/config/booking-status";

const patchSchema = z.object({
  status: z.enum(BOOKING_STATUS_VALUES),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

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
        ? bookingConfirmedEmail({ patientName: patient.name ?? "there", portalUrl: `${PORTAL_URL}/bookings` })
        : bookingCancelledEmail({ patientName: patient.name ?? "there", portalUrl: `${PORTAL_URL}/bookings` });
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
