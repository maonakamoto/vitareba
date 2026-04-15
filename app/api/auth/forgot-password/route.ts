export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";
import { PORTAL_URL } from "@/lib/config/company";
import { PASSWORD_RESET_TOKEN_EXPIRY_MS } from "@/lib/config/auth";

const schema = z.object({ email: z.string().email() });
// Always return the same response to prevent email enumeration
const OK = NextResponse.json({ success: true });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return OK;

  const { email } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, name: true, email: true, password: true },
  });

  // No account or OAuth-only account (no password set) → silently do nothing
  if (!user?.password) return OK;

  // Invalidate any existing reset token for this email
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `reset:${email}`));

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);

  await db.insert(verificationTokens).values({
    identifier: `reset:${email}`,
    token,
    expires,
  });

  const resetUrl = `${PORTAL_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  await sendEmail({
    to: email,
    subject: "Reset your VitaReBa password",
    html: passwordResetEmail({ resetUrl }),
  });

  return OK;
}
