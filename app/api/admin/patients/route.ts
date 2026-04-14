export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, assessmentResults } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

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
