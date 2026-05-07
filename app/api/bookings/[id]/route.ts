export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAdmin, requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { bookings, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { bookingConfirmedEmail, bookingCancelledEmail, bookingCancelledAdminEmail } from "@/lib/email/templates";
import { PORTAL_URL, COMPANY, getAdminEmails } from "@/lib/config/company";
import { PORTAL_ROUTES, ADMIN_ROUTES } from "@/lib/config/routes";
import { BOOKING_STATUS, BOOKING_STATUS_VALUES, BOOKING_TYPE_CONFIG, MACHINE_TYPE_CONFIG } from "@/lib/config/booking-status";
import { runAfterResponse } from "@/lib/utils/post-response";

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

  let updated: typeof bookings.$inferSelect | undefined;
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

  // Drizzle .returning() yields [] when the WHERE matched nothing.
  // Without this guard the email-notification block below would crash on
  // `updated.userId` and surface as a 500 instead of an honest 404.
  if (!updated) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (parsed.data.status === BOOKING_STATUS.confirmed || parsed.data.status === BOOKING_STATUS.cancelled) {
    runAfterResponse(async () => {
      const patient = await db.query.users.findFirst({
        where: eq(users.id, updated.userId),
        columns: { name: true, email: true },
      });
      if (!patient?.email) return;
      const bookingTypeLabel = BOOKING_TYPE_CONFIG[updated.bookingType]?.label ?? "Booking";
      const machineLabel = updated.machineType ? MACHINE_TYPE_CONFIG[updated.machineType]?.label : null;
      const sessionLabel = machineLabel ? `${bookingTypeLabel} — ${machineLabel}` : bookingTypeLabel;
      const html = parsed.data.status === BOOKING_STATUS.confirmed
        ? bookingConfirmedEmail({ patientName: patient.name ?? "there", sessionLabel, portalUrl: `${PORTAL_URL}${PORTAL_ROUTES.bookings}` })
        : bookingCancelledEmail({ patientName: patient.name ?? "there", sessionLabel, portalUrl: `${PORTAL_URL}${PORTAL_ROUTES.bookings}` });
      await sendEmail({
        to: patient.email,
        subject: parsed.data.status === BOOKING_STATUS.confirmed
          ? `Your ${sessionLabel.toLowerCase()} has been confirmed — ${COMPANY.shortName}`
          : `Your ${sessionLabel.toLowerCase()} request has been cancelled — ${COMPANY.shortName}`,
        html,
      });
    }, "[api/bookings/id] patient status email failed:");
  }

  return NextResponse.json({ success: true, data: updated });
}

// Patient self-cancellation — only own pending bookings
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession();
  if (guard.error) return guard.error;

  const { id } = await params;

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, id) });
  if (!booking) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (booking.userId !== guard.session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (booking.status !== BOOKING_STATUS.pending) {
    return NextResponse.json({ success: false, error: "Only pending bookings can be cancelled" }, { status: 400 });
  }

  try {
    await db.update(bookings).set({ status: BOOKING_STATUS.cancelled }).where(eq(bookings.id, id));
  } catch (err) {
    console.error("[api/bookings/id] patient cancel failed:", err);
    return NextResponse.json({ success: false, error: "Failed to cancel booking — please try again" }, { status: 500 });
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.length > 0) {
    const bookingTypeLabel = BOOKING_TYPE_CONFIG[booking.bookingType]?.label ?? booking.bookingType;
    const machineTypeLabel = booking.machineType ? MACHINE_TYPE_CONFIG[booking.machineType]?.label : null;
    runAfterResponse(async () => {
      const patient = await db.query.users.findFirst({
        where: eq(users.id, booking.userId),
        columns: { name: true, email: true },
      });
      await sendEmail({
        to: adminEmails,
        subject: `Booking cancelled by patient — ${patient?.name ?? patient?.email ?? "Unknown"}`,
        html: bookingCancelledAdminEmail({
          patientName: patient?.name ?? "Unknown",
          patientEmail: patient?.email ?? "",
          bookingTypeLabel,
          machineTypeLabel,
          adminUrl: `${PORTAL_URL}${ADMIN_ROUTES.patients}/${booking.userId}`,
        }),
      });
    }, "[api/bookings/id] admin cancellation email failed:");
  }

  return NextResponse.json({ success: true });
}
