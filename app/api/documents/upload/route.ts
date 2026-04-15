export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

// Max file size: 20 MB
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { session } = guard;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string | null;
  const patientId = formData.get("patientId") as string | null;

  if (!file || !title?.trim() || !patientId) {
    return NextResponse.json({ success: false, error: "file, title, and patientId required" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: "File exceeds 20 MB limit" }, { status: 413 });
  }

  // Sanitize filename — no path traversal, keep extension
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, "_");
  const blobPath = `documents/${patientId}/${Date.now()}_${safeName}`;

  const blob = await put(blobPath, file, {
    access: "public",
    contentType: file.type || "application/octet-stream",
  });

  const [doc] = await db
    .insert(documents)
    .values({
      userId: patientId,
      uploadedBy: session.user.id,
      title: title.trim(),
      fileUrl: blob.url,
      mimeType: file.type || null,
    })
    .returning();

  return NextResponse.json({ success: true, data: doc }, { status: 201 });
}
