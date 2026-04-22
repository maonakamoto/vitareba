export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { SLEEP_HOURS_MIN, SLEEP_HOURS_MAX, PROFILE_COMPLETION_THRESHOLD } from "@/lib/config/portal";
import { computeProfileCompleteness } from "@/lib/domain/profile";
import { profileCompletedAdminEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email";
import { PORTAL_URL, getAdminEmails } from "@/lib/config/company";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  city: z.string().optional(),
  occupation: z.string().optional(),
  mainConcern: z.string().optional(),
  goals: z.string().optional(),
  diagnosisHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  currentSupplements: z.string().optional(),
  sleepHoursAvg: z
    .number()
    .int()
    .min(SLEEP_HOURS_MIN)
    .max(SLEEP_HOURS_MAX)
    .nullable()
    .optional(),
  exerciseFrequency: z
    .enum(["none", "light", "moderate", "regular", "intense"])
    .nullable()
    .optional(),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
  digestOptOut: z.boolean().optional(),
});

export async function GET() {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  return NextResponse.json({ success: true, data: profile ?? null });
}

export async function PATCH(req: Request) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const { name, ...profileFields } = parsed.data;

  if (name) {
    await db.update(users).set({ name }).where(eq(users.id, session.user.id));
  }

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  const oldPct = computeProfileCompleteness(existing as Record<string, unknown> | null);

  if (existing) {
    await db
      .update(profiles)
      .set({ ...profileFields, updatedAt: new Date() })
      .where(eq(profiles.userId, session.user.id));
  } else {
    await db.insert(profiles).values({ userId: session.user.id, ...profileFields });
  }

  const updated = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
  const newPct = computeProfileCompleteness(updated as Record<string, unknown> | null);
  const threshold = PROFILE_COMPLETION_THRESHOLD * 100;

  if (oldPct < threshold && newPct >= threshold) {
    const adminEmails = getAdminEmails();
    const patient = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true, email: true },
    });
    if (adminEmails.length > 0 && patient) {
      sendEmail({
        to: adminEmails,
        subject: `Profile ready: ${patient.name ?? patient.email}`,
        html: profileCompletedAdminEmail({
          patientName: patient.name ?? patient.email ?? "",
          patientEmail: patient.email ?? "",
          completionPct: newPct,
          adminUrl: `${PORTAL_URL}/admin/patients/${session.user.id}`,
        }),
      }).catch(console.error);
    }
  }

  return NextResponse.json({ success: true });
}
