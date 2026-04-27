export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { bookings, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { bookingRequestAdminEmail } from "@/lib/email/templates";
import { PORTAL_URL, COMPANY, getAdminEmails } from "@/lib/config/company";
import { ADMIN_ROUTES } from "@/lib/config/routes";
import { USER_ROLE } from "@/lib/config/auth";
import { bookingCreateSchema, adminBookingCreateSchema } from "@/lib/domain/bookings";
import { bookingConfirmedEmail } from "@/lib/email/templates";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { BOOKING_STATUS } from "@/lib/config/booking-status";
import { BOOKING_TYPE_CONFIG, MACHINE_TYPE_CONFIG } from "@/lib/config/booking-status";

export async function GET() {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const where = session.user.role === USER_ROLE.admin
    ? undefined
    : eq(bookings.userId, session.user.id);

  let results;
  try {
    results = await db.query.bookings.findMany({
      where,
      orderBy: [desc(bookings.createdAt)],
      with: { user: { columns: { id: true, name: true, email: true } } },
    });
  } catch (err) {
    console.error("[api/bookings] GET failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: results });
}

export async function POST(req: Request) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const body = await req.json();

  // ── Admin-initiated booking (for a specific patient) ───────────────────────
  if (session.user.role === USER_ROLE.admin) {
    const parsed = adminBookingCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }
    const { patientId, status, ...fields } = parsed.data;

    let booking: typeof bookings.$inferSelect;
    try {
      [booking] = await db
        .insert(bookings)
        .values({ userId: patientId, status: status ?? BOOKING_STATUS.confirmed, ...fields })
        .returning();
    } catch (err) {
      console.error("[api/bookings] admin insert failed:", err);
      return NextResponse.json({ success: false, error: "Failed to create booking — please try again" }, { status: 500 });
    }

    // Notify patient (fire-and-forget)
    const patient = await db.query.users
      .findFirst({ where: eq(users.id, patientId), columns: { name: true, email: true } })
      .catch(() => null);
    if (patient?.email) {
      const bookingTypeLabel = BOOKING_TYPE_CONFIG[fields.bookingType ?? "consultation"].label;
      const machineLabel = fields.machineType ? MACHINE_TYPE_CONFIG[fields.machineType].label : null;
      const sessionLabel = machineLabel ? `${bookingTypeLabel} — ${machineLabel}` : bookingTypeLabel;
      sendEmail({
        to: patient.email,
        subject: `Your ${sessionLabel.toLowerCase()} has been confirmed — ${COMPANY.shortName}`,
        html: bookingConfirmedEmail({
          patientName: patient.name ?? "there",
          sessionLabel,
          portalUrl: `${PORTAL_URL}${PORTAL_ROUTES.bookings}`,
        }),
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  }

  // ── Patient booking request ────────────────────────────────────────────────
  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  let booking: typeof bookings.$inferSelect;
  try {
    [booking] = await db
      .insert(bookings)
      .values({ userId: session.user.id, ...parsed.data })
      .returning();
  } catch (err) {
    console.error("[api/bookings] insert failed:", err);
    return NextResponse.json({ success: false, error: "Failed to create booking — please try again" }, { status: 500 });
  }

  // Notify admin of new booking request (fire-and-forget — don't block the response)
  const adminEmails = getAdminEmails();
  if (adminEmails.length > 0) {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true, email: true },
    }).catch(() => null);
    const bookingTypeLabel = BOOKING_TYPE_CONFIG[parsed.data.bookingType].label;
    const machineTypeLabel = parsed.data.machineType
      ? MACHINE_TYPE_CONFIG[parsed.data.machineType].label
      : null;
    sendEmail({
      to: adminEmails,
      subject: `New ${bookingTypeLabel.toLowerCase()} request — ${patient?.name ?? session.user.email}`,
      html: bookingRequestAdminEmail({
        patientName: patient?.name ?? "Unknown",
        patientEmail: patient?.email ?? "",
        bookingTypeLabel,
        machineTypeLabel,
        notes: parsed.data.notes,
        preferredDate: parsed.data.preferredDate,
        adminUrl: `${PORTAL_URL}${ADMIN_ROUTES.patients}/${session.user.id}`,
      }),
    }).catch(console.error);
  }

  return NextResponse.json({ success: true, data: booking }, { status: 201 });
}
