import { NextResponse } from "next/server";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { ActiveSleepEntryConflictError } from "@/modules/sleep/application/create-sleep-entry";
import { toggleSleepEntry } from "@/modules/sleep/application/toggle-sleep-entry";
import { isSleepKind } from "@/modules/sleep/domain/sleep-entry";
import { SupabaseSleepRepository } from "@/modules/sleep/infrastructure/supabase-sleep-repository";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const kind =
    payload && typeof payload === "object" && "kind" in payload && isSleepKind(payload.kind)
      ? payload.kind
      : "nap";

  try {
    const result = await toggleSleepEntry(
      new SupabaseSleepRepository(createServerSupabaseClient()),
      kind,
    );
    revalidateTag(CACHE_TAGS.sleepEntries, "max");
    revalidatePath("/sueno");

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ActiveSleepEntryConflictError || isUniqueActiveSleepViolation(error)) {
      return NextResponse.json({ error: "Active sleep conflict" }, { status: 409 });
    }

    return NextResponse.json({ error: "Sleep action failed" }, { status: 422 });
  }
}

function isUniqueActiveSleepViolation(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as { code?: string }).code === "23505";
}
