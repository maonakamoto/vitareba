export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users, bookings } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { formatDateISO } from "@/lib/utils/format";
import { BOOKING_STATUS } from "@/lib/config/booking-status";
import { USER_ROLE } from "@/lib/config/auth";

// Calendly webhook signature verification
// Header: Calendly-Webhook-Signature → "t=<unix_ts>,v1=<hmac_sha256_hex>"
// HMAC is over "<timestamp>.<raw_body>" using CALENDLY_WEBHOOK_SIGNING_KEY
function verifySignature(rawBody: string, header: string | null): boolean {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return false; // skip verification if key not set (dev only)
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const expected = crypto
    .createHmac("sha256", signingKey)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  const sigHeader = req.headers.get("calendly-webhook-signature");
  if (process.env.CALENDLY_WEBHOOK_SIGNING_KEY && !verifySignature(rawBody, sigHeader)) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
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

  // Extract invitee email and scheduled time
  const inviteeEmail =
    (data.email as string | undefined) ??
    ((data.invitee as Record<string, unknown> | undefined)?.email as string | undefined);

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

    return NextResponse.json({ success: true, action: BOOKING_STATUS.confirmed });
  }

  if (event === "invitee.canceled") {
    // Cancel the most recent confirmed booking for this patient
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

    return NextResponse.json({ success: true, action: BOOKING_STATUS.cancelled });
  }

  return NextResponse.json({ success: true, note: "Event not handled" });
}
