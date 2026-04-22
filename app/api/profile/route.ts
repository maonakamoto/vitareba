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
} from "@/lib/config/portal";
import { computeProfileCompleteness } from "@/lib/domain/profile";
import { profileCompletedAdminEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email";
import { PORTAL_URL, getAdminEmails } from "@/lib/config/company";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  dateOfBirth: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  occupation: z.string().max(150).optional(),
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
  referralSource: z.string().max(500).optional(),
  notes: z.string().max(PATIENT_NOTE_MAX_LENGTH).optional(),
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

  // Parallel: update name (if provided) + fetch existing profile for threshold check
  const [, existing] = await Promise.all([
    name ? db.update(users).set({ name }).where(eq(users.id, session.user.id)) : Promise.resolve(),
    db.query.profiles.findFirst({ where: eq(profiles.userId, session.user.id) }),
  ]);

  const oldPct = computeProfileCompleteness(existing as Record<string, unknown> | null);

  // Upsert profile and return updated row in one query
  const [updated] = await db
    .insert(profiles)
    .values({ userId: session.user.id, ...profileFields })
    .onConflictDoUpdate({ target: profiles.userId, set: { ...profileFields, updatedAt: new Date() } })
    .returning();

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
