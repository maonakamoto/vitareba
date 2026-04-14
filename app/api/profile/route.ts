export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  mainConcern: z.string().optional(),
  referralSource: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  return NextResponse.json({ success: true, data: profile ?? null });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

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

  if (existing) {
    await db
      .update(profiles)
      .set({ ...profileFields, updatedAt: new Date() })
      .where(eq(profiles.userId, session.user.id));
  } else {
    await db.insert(profiles).values({ userId: session.user.id, ...profileFields });
  }

  return NextResponse.json({ success: true });
}
