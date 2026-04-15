export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { assessmentResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { enqueueAssessmentEmails } from "@/lib/domain/email-queue";

const saveSchema = z.object({
  scores: z.record(z.string(), z.number()),
  overallScore: z.number().int().min(0).max(100),
});

export async function POST(req: Request) {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

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

  enqueueAssessmentEmails({
    userId: session.user.id,
    overallScore: parsed.data.overallScore,
    scores: parsed.data.scores,
    triggeredAt: result.completedAt,
  }).catch((err) => console.error("[email-queue] enqueue failed:", err));

  return NextResponse.json({ success: true, data: result }, { status: 201 });
}

export async function GET() {
  const guard = await requireSession();
  if (guard.error) return guard.error;
  const { session } = guard;

  const results = await db.query.assessmentResults.findMany({
    where: eq(assessmentResults.userId, session.user.id),
    orderBy: [desc(assessmentResults.completedAt)],
  });

  return NextResponse.json({ success: true, data: results });
}
