import { NextResponse } from "next/server";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import {
  createHeadCircumferenceEntry,
  createHeightEntry,
  isMeasurementPlace,
  type HeadCircumferenceEntry,
  type HeightEntry,
} from "@/modules/growth/domain/growth-entry";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import type { PendingGrowthMutation } from "@/shared/infrastructure/offline/irati-offline-db";

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mutation = await request.json().catch(() => null);

  if (!isPendingGrowthMutation(mutation)) {
    return NextResponse.json({ error: "Invalid mutation" }, { status: 400 });
  }

  try {
    await applyGrowthMutation(mutation);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mutation rejected" }, { status: 422 });
  }
}

async function applyGrowthMutation(mutation: PendingGrowthMutation): Promise<void> {
  const supabase = createServerSupabaseClient();

  if (mutation.operation === "delete") {
    const table = mutation.entity === "height" ? "height_entries" : "head_circumference_entries";
    const { error } = await supabase.from(table).delete().eq("id", mutation.payload.id);
    if (error) throw error;
    return;
  }

  if (mutation.entity === "height" && isHeightPayload(mutation.payload)) {
    const entry = createHeightEntry({
      measuredOn: mutation.payload.measuredOn,
      heightCm: mutation.payload.heightCm,
      notes: mutation.payload.notes,
      place: mutation.payload.place,
    });
    const values = {
      id: mutation.payload.id,
      measured_on: entry.measuredOn,
      height_cm: entry.heightCm,
      notes: entry.notes ?? null,
      place: entry.place,
      updated_at: new Date().toISOString(),
    };

    const { error } =
      mutation.operation === "create"
        ? await supabase.from("height_entries").upsert(values)
        : await supabase.from("height_entries").update(values).eq("id", mutation.payload.id);
    if (error) throw error;
    return;
  }

  if (mutation.entity === "headCircumference" && isHeadCircumferencePayload(mutation.payload)) {
    const entry = createHeadCircumferenceEntry({
      measuredOn: mutation.payload.measuredOn,
      headCircumferenceCm: mutation.payload.headCircumferenceCm,
      notes: mutation.payload.notes,
      place: mutation.payload.place,
    });
    const values = {
      id: mutation.payload.id,
      measured_on: entry.measuredOn,
      head_circumference_cm: entry.headCircumferenceCm,
      notes: entry.notes ?? null,
      place: entry.place,
      updated_at: new Date().toISOString(),
    };

    const { error } =
      mutation.operation === "create"
        ? await supabase.from("head_circumference_entries").upsert(values)
        : await supabase
            .from("head_circumference_entries")
            .update(values)
            .eq("id", mutation.payload.id);
    if (error) throw error;
    return;
  }

  throw new Error("Invalid growth payload");
}

function isPendingGrowthMutation(value: unknown): value is PendingGrowthMutation {
  if (!value || typeof value !== "object") return false;

  const mutation = value as PendingGrowthMutation;
  return (
    (mutation.entity === "height" || mutation.entity === "headCircumference") &&
    ["create", "update", "delete"].includes(mutation.operation) &&
    typeof mutation.id === "string" &&
    typeof mutation.createdAt === "string" &&
    typeof mutation.payload === "object" &&
    mutation.payload !== null
  );
}

function isHeightPayload(value: PendingGrowthMutation["payload"]): value is HeightEntry {
  return (
    "measuredOn" in value &&
    "heightCm" in value &&
    typeof value.id === "string" &&
    typeof value.measuredOn === "string" &&
    typeof value.heightCm === "number" &&
    typeof value.place === "string" &&
    isMeasurementPlace(value.place)
  );
}

function isHeadCircumferencePayload(
  value: PendingGrowthMutation["payload"],
): value is HeadCircumferenceEntry {
  return (
    "measuredOn" in value &&
    "headCircumferenceCm" in value &&
    typeof value.id === "string" &&
    typeof value.measuredOn === "string" &&
    typeof value.headCircumferenceCm === "number" &&
    typeof value.place === "string" &&
    isMeasurementPlace(value.place)
  );
}
