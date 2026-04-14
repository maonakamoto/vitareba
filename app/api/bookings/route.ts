export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";

const createSchema = z.object({
  preferredDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const where = session.user.role === "admin"
    ? undefined
    : eq(bookings.userId, session.user.id);

  const results = await db.query.bookings.findMany({
    where,
    orderBy: [desc(bookings.createdAt)],
    with: { user: { columns: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ success: true, data: results });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const [booking] = await db
    .insert(bookings)
    .values({ userId: session.user.id, ...parsed.data })
    .returning();

  return NextResponse.json({ success: true, data: booking }, { status: 201 });
}
