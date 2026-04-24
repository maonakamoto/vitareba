export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { bookings, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { bookingConfirmedEmail, bookingCancelledEmail } from "@/lib/email/templates";
import { PORTAL_URL, COMPANY } from "@/lib/config/company";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { BOOKING_STATUS, BOOKING_STATUS_VALUES, BOOKING_TYPE_CONFIG, MACHINE_TYPE_CONFIG } from "@/lib/config/booking-status";

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

  let updated: typeof bookings.$inferSelect;
  try {
    [updated] = await db
      .update(bookings)
      .set({ status: parsed.data.status })
      .where(eq(bookings.id, id))
      .returning();
  } catch (err) {
    console.error("[api/bookings/id] update failed:", err);
    return NextResponse.json({ success: false, error: "Failed to update booking — please try again" }, { status: 500 });
  }

  // Notify patient of status change (fire-and-forget)
  if (parsed.data.status === BOOKING_STATUS.confirmed || parsed.data.status === BOOKING_STATUS.cancelled) {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, updated.userId),
      columns: { name: true, email: true },
    }).catch(() => null);
    if (patient?.email) {
      const bookingTypeLabel = BOOKING_TYPE_CONFIG[updated.bookingType]?.label ?? "Booking";
      const machineLabel = updated.machineType ? MACHINE_TYPE_CONFIG[updated.machineType]?.label : null;
      const sessionLabel = machineLabel ? `${bookingTypeLabel} — ${machineLabel}` : bookingTypeLabel;
      const html = parsed.data.status === BOOKING_STATUS.confirmed
        ? bookingConfirmedEmail({ patientName: patient.name ?? "there", portalUrl: `${PORTAL_URL}${PORTAL_ROUTES.bookings}` })
        : bookingCancelledEmail({ patientName: patient.name ?? "there", portalUrl: `${PORTAL_URL}${PORTAL_ROUTES.bookings}` });
      sendEmail({
        to: patient.email,
        subject: parsed.data.status === BOOKING_STATUS.confirmed
          ? `Your ${sessionLabel.toLowerCase()} has been confirmed — ${COMPANY.shortName}`
          : `Your ${sessionLabel.toLowerCase()} request — ${COMPANY.shortName}`,
        html,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ success: true, data: updated });
}
