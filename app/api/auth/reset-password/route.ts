export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, EMAIL_MAX_LENGTH, PASSWORD_RESET_TOKEN_MAX_LENGTH, RESET_TOKEN_IDENTIFIER_PREFIX } from "@/lib/config/auth";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { hashPassword } from "@/lib/domain/auth";

const schema = z.object({
  token: z.string().min(1).max(PASSWORD_RESET_TOKEN_MAX_LENGTH),
  email: z.string().email().max(EMAIL_MAX_LENGTH),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const { token, email, password } = parsed.data;

  let record;
  try {
    record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, `${RESET_TOKEN_IDENTIFIER_PREFIX}${email}`),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date())
      ),
    });
  } catch (err) {
    console.error("[api/auth/reset-password] token lookup failed:", err);
    return NextResponse.json({ success: false, error: "Service unavailable — please try again" }, { status: 500 });
  }

  if (!record) {
    return NextResponse.json({ success: false, error: "Invalid or expired link" }, { status: 400 });
  }

  const hashed = await hashPassword(password);
  try {
    await db.update(users).set({ password: hashed }).where(eq(users.email, email));
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `${RESET_TOKEN_IDENTIFIER_PREFIX}${email}`));
  } catch (err) {
    console.error("[api/auth/reset-password] update failed:", err);
    return NextResponse.json({ success: false, error: "Failed to reset password — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
