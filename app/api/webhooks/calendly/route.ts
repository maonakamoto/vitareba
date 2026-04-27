export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, bookings } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { formatDateISO } from "@/lib/utils/format";
import { BOOKING_STATUS } from "@/lib/config/booking-status";
import { USER_ROLE } from "@/lib/config/auth";
import { verifyCalendlySignature } from "@/lib/webhooks/calendly-signature";

export async function POST(req: Request) {
  const rawBody = await req.text();

  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (signingKey) {
    const ok = verifyCalendlySignature({
      rawBody,
      header: req.headers.get("calendly-webhook-signature"),
      signingKey,
    });
    if (!ok) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Signing key absent in production means a misconfigured deployment — reject
    // rather than silently accept unauthenticated payloads.
    console.error("[webhooks/calendly] CALENDLY_WEBHOOK_SIGNING_KEY not set — rejecting request");
    return NextResponse.json({ success: false, error: "Webhook not configured" }, { status: 500 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event as string | undefined;
  const data = payload.payload as Record<string, unknown> | undefined;

  if (!event || !data) {
    return NextResponse.json({ success: false, error: "Malformed payload" }, { status: 400 });
  }

  // Extract invitee email and scheduled time. Lowercase before lookup so a
  // patient registered as "alice@x.com" still matches a Calendly booking
  // submitted as "Alice@x.com" (users.email rows are stored lowercase by the
  // emailField() Zod transform on registration).
  const rawEmail =
    (data.email as string | undefined) ??
    ((data.invitee as Record<string, unknown> | undefined)?.email as string | undefined);
  const inviteeEmail = rawEmail?.toLowerCase();

  const scheduledEvent = data.scheduled_event as Record<string, unknown> | undefined;
  const startTime = scheduledEvent?.start_time as string | undefined;

  if (!inviteeEmail) {
    return NextResponse.json({ success: true, note: "No invitee email — skipped" });
  }

  // Find patient by email
  const patient = await db.query.users.findFirst({
    where: and(eq(users.email, inviteeEmail), eq(users.role, USER_ROLE.patient)),
    columns: { id: true },
  });

  if (!patient) {
    // Patient not in the system — Calendly booking from external source, ignore
    return NextResponse.json({ success: true, note: "Patient not found — skipped" });
  }

  if (event === "invitee.created") {
    // Check if there's an existing pending booking to upgrade; otherwise create one
    try {
      const existingPending = await db.query.bookings.findFirst({
        where: and(eq(bookings.userId, patient.id), eq(bookings.status, BOOKING_STATUS.pending)),
        orderBy: [desc(bookings.createdAt)],
      });

      if (existingPending) {
        await db
          .update(bookings)
          .set({
            status: BOOKING_STATUS.confirmed,
            preferredDate: startTime ? formatDateISO(new Date(startTime)) : existingPending.preferredDate,
          })
          .where(eq(bookings.id, existingPending.id));
      } else {
        await db.insert(bookings).values({
          userId: patient.id,
          status: BOOKING_STATUS.confirmed,
          preferredDate: startTime ? formatDateISO(new Date(startTime)) : null,
          notes: "Booked directly via Calendly",
        });
      }
    } catch (err) {
      console.error("[webhooks/calendly] invitee.created db failed:", err);
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: BOOKING_STATUS.confirmed });
  }

  if (event === "invitee.canceled") {
    // Cancel the most recent confirmed booking for this patient
    try {
      const existing = await db.query.bookings.findFirst({
        where: and(eq(bookings.userId, patient.id), eq(bookings.status, BOOKING_STATUS.confirmed)),
        orderBy: [desc(bookings.createdAt)],
      });

      if (existing) {
        await db
          .update(bookings)
          .set({ status: BOOKING_STATUS.cancelled })
          .where(eq(bookings.id, existing.id));
      }
    } catch (err) {
      console.error("[webhooks/calendly] invitee.canceled db failed:", err);
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: BOOKING_STATUS.cancelled });
  }

  return NextResponse.json({ success: true, note: "Event not handled" });
}
