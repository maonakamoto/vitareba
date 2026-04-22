import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { USER_ROLE } from "@/lib/config/auth";

export async function requireSession(): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await auth();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/**
 * Verifies the request carries a valid CRON_SECRET bearer token.
 * Returns a 401 NextResponse if the check fails, null if authorized.
 * Usage: const cronError = requireCron(req); if (cronError) return cronError;
 */
export function requireCron(req: Request): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function requireAdmin(): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await auth();
  if (!session || session.user.role !== USER_ROLE.admin) {
    return {
      session: null,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
