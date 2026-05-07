export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth/guards";
import { runCronSignals } from "@/lib/workflows/cron-signals";

export async function GET(req: Request) {
  const cronError = requireCron(req);
  if (cronError) return cronError;

  const result = await runCronSignals();
  if (!result.success) {
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 500 });
  }
  return NextResponse.json(result);
}
