export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { BCRYPT_SALT_ROUNDS } from "@/lib/config/auth";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";

const schema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const { token, email, password } = parsed.data;

  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, `reset:${email}`),
      eq(verificationTokens.token, token),
      gt(verificationTokens.expires, new Date())
    ),
  });

  if (!record) {
    return NextResponse.json({ success: false, error: "Invalid or expired link" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  await db.update(users).set({ password: hashed }).where(eq(users.email, email));
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `reset:${email}`));

  return NextResponse.json({ success: true });
}
