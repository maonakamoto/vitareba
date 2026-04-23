export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { registerSchema, hashPassword } from "@/lib/domain/auth";
import { enqueueWelcomeEmails } from "@/lib/domain/email-queue";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: { email: ["Email already registered"] } },
      { status: 409 }
    );
  }

  const hashed = await hashPassword(password);

  let newUser: { id: string };
  try {
    [newUser] = await db
      .insert(users)
      .values({ email, password: hashed })
      .returning({ id: users.id });
    // Create empty profile row so profile-dependent features work immediately
    await db.insert(profiles).values({ userId: newUser.id });
  } catch (err) {
    console.error("[api/account] registration failed:", err);
    return NextResponse.json({ success: false, error: "Registration failed — please try again" }, { status: 500 });
  }

  enqueueWelcomeEmails({ userId: newUser.id, triggeredAt: new Date() })
    .catch((err) => console.error("[email-queue] welcome enqueue failed:", err));

  return NextResponse.json({ success: true }, { status: 201 });
}
