export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users, assessmentResults } from "@/lib/db/schema";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const patients = await db.query.users.findMany({
    where: eq(users.role, "patient"),
    orderBy: [desc(users.createdAt)],
    with: {
      profile: true,
      assessmentResults: {
        orderBy: [desc(assessmentResults.completedAt)],
        limit: 1,
      },
    },
  });

  return NextResponse.json({ success: true, data: patients });
}
