export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

const createSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1),
  fileUrl: z.string().url(),
  mimeType: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  const targetId =
    session.user.role === "admin" && patientId ? patientId : session.user.id;

  const results = await db.query.documents.findMany({
    where: eq(documents.userId, targetId),
    orderBy: [desc(documents.createdAt)],
  });

  return NextResponse.json({ success: true, data: results });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
  }

  const [doc] = await db
    .insert(documents)
    .values({ ...parsed.data, uploadedBy: session.user.id })
    .returning();

  return NextResponse.json({ success: true, data: doc }, { status: 201 });
}
