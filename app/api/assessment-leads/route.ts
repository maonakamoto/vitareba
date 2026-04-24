export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assessmentLeads } from "@/lib/db/schema";

const createSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
});

// Public endpoint — no auth required. Records anonymous overlay completions
// for conversion funnel tracking. No PII stored.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  let lead: typeof assessmentLeads.$inferSelect;
  try {
    [lead] = await db
      .insert(assessmentLeads)
      .values({ overallScore: parsed.data.overallScore })
      .returning();
  } catch (err) {
    console.error("[api/assessment-leads] insert failed:", err);
    return NextResponse.json(
      { success: false, error: "Service unavailable — please try again" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { id: lead.id } }, { status: 201 });
}
