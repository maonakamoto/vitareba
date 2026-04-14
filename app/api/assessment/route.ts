export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessmentResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const saveSchema = z.object({
  scores: z.record(z.string(), z.number()),
  overallScore: z.number().int().min(0).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const [result] = await db
    .insert(assessmentResults)
    .values({
      userId: session.user.id,
      scores: parsed.data.scores,
      overallScore: parsed.data.overallScore,
    })
    .returning();

  return NextResponse.json({ success: true, data: result }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const results = await db.query.assessmentResults.findMany({
    where: eq(assessmentResults.userId, session.user.id),
    orderBy: [desc(assessmentResults.completedAt)],
  });

  return NextResponse.json({ success: true, data: results });
}
