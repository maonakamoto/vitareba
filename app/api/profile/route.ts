export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import {
  SLEEP_HOURS_MIN,
  SLEEP_HOURS_MAX,
  PROFILE_COMPLETION_THRESHOLD,
  EXERCISE_FREQUENCY_VALUES,
  PATIENT_NOTE_MAX_LENGTH,
  PROFILE_NAME_MAX_LENGTH,
  PROFILE_PHONE_MAX_LENGTH,
  PROFILE_DOB_MAX_LENGTH,
  PROFILE_CITY_MAX_LENGTH,
  PROFILE_OCCUPATION_MAX_LENGTH,
  PROFILE_REFERRAL_SOURCE_MAX_LENGTH,
} from "@/lib/config/portal";
import { computeProfileCompleteness } from "@/lib/domain/profile";
import { profileCompletedAdminEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email";
import { PORTAL_URL, getAdminEmails } from "@/lib/config/company";

const updateSchema = z.object({
  name: z.string().min(1).max(PROFILE_NAME_MAX_LENGTH).optional(),
  phone: z.string().max(PROFILE_PHONE_MAX_LENGTH).optional(),
  dateOfBirth: z.string().max(PROFILE_DOB_MAX_LENGTH).optional(),
  city: z.string().max(PROFILE_CITY_MAX_LENGTH).optional(),
  occupation: z.string().max(PROFILE_OCCUPATION_MAX_LENGTH).optional(),
  mainConcern: z.string().max(PATIENT_NOTE_MAX_LENGTH).optional(),
  goals: z.string().max(PATIENT_NOTE_MAX_LENGTH).optional(),
  diagnosisHistory: z.string().max(PATIENT_NOTE_MAX_LENGTH).optional(),
  currentMedications: z.string().max(PATIENT_NOTE_MAX_LENGTH).optional(),
  currentSupplements: z.string().max(PATIENT_NOTE_MAX_LENGTH).optional(),
  sleepHoursAvg: z
    .number()
    .int()
    .min(SLEEP_HOURS_MIN)
    .max(SLEEP_HOURS_MAX)
    .nullable()
    .optional(),
  exerciseFrequency: z.enum(EXERCISE_FREQUENCY_VALUES).nullable().optional(),
  referralSource: z.string().max(PROFILE_REFERRAL_SOURCE_MAX_LENGTH).optional(),
  notes: z.string().max(PATIENT_NOTE_MAX_LENGTH).optional(),
  digestOptOut: z.boolean().optional(),
});

export async function GET() {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  let profile;
  try {
    profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    });
  } catch (err) {
    console.error("[api/profile] GET failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }

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

  let existing: typeof profiles.$inferSelect | undefined;
  let updated: typeof profiles.$inferSelect;
  try {
    // Parallel: update name (if provided) + fetch existing profile for threshold check
    [, existing] = await Promise.all([
      name ? db.update(users).set({ name }).where(eq(users.id, session.user.id)) : Promise.resolve(),
      db.query.profiles.findFirst({ where: eq(profiles.userId, session.user.id) }),
    ]);

    // Upsert profile and return updated row in one query
    [updated] = await db
      .insert(profiles)
      .values({ userId: session.user.id, ...profileFields })
      .onConflictDoUpdate({ target: profiles.userId, set: { ...profileFields, updatedAt: new Date() } })
      .returning();
  } catch (err) {
    console.error("[api/profile] upsert failed:", err);
    return NextResponse.json({ success: false, error: "Failed to save profile — please try again" }, { status: 500 });
  }

  const oldPct = computeProfileCompleteness(existing as Record<string, unknown> | null);
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
