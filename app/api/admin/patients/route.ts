export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { serviceUnavailable } from "@/lib/utils/api-response";
import { db } from "@/lib/db";
import { users, assessmentResults } from "@/lib/db/schema";
import { USER_ROLE } from "@/lib/config/auth";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  let patients;
  try {
    patients = await db.query.users.findMany({
      where: eq(users.role, USER_ROLE.patient),
      orderBy: [desc(users.createdAt)],
      with: {
        profile: true,
        assessmentResults: {
          orderBy: [desc(assessmentResults.completedAt)],
          limit: 1,
        },
      },
    });
  } catch (err) {
    console.error("[api/admin/patients] GET failed:", err);
    return serviceUnavailable();
  }

  return NextResponse.json({ success: true, data: patients });
}
