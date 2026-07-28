import { NextResponse } from "next/server";
import { loadCalendarFeed } from "@/modules/calendar/application/calendar-feed";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";

export async function GET() {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await loadCalendarFeed();

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
    status: result.error ? 503 : 200,
  });
}
