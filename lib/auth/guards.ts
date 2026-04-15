import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

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

export async function requireAdmin(): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
