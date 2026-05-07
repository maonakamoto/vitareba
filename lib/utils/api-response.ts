import { NextResponse } from "next/server";

/** Standard 500 response for DB-read failures at the top of a route handler. */
export function serviceUnavailable(): NextResponse {
  return NextResponse.json(
    { success: false, error: "Service unavailable — please try again" },
    { status: 500 }
  );
}
