import { NextResponse } from "next/server";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { createWeightEntry, isWeightPlace } from "@/modules/weight/domain/weight-entry";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import type { PendingWeightMutation } from "@/shared/infrastructure/offline/irati-offline-db";

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mutation = await request.json().catch(() => null);

  if (!isPendingWeightMutation(mutation)) {
    return NextResponse.json({ error: "Invalid mutation" }, { status: 400 });
  }

  try {
    await applyWeightMutation(mutation);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mutation rejected" }, { status: 422 });
  }
}

async function applyWeightMutation(mutation: PendingWeightMutation): Promise<void> {
  const supabase = createServerSupabaseClient();

  if (mutation.operation === "delete") {
    const { error } = await supabase.from("weight_entries").delete().eq("id", mutation.payload.id);

    if (error) {
      throw error;
    }

    return;
  }

  if (!isWeightPayload(mutation.payload)) {
    throw new Error("Invalid weight payload");
  }

  const entry = createWeightEntry({
    measuredOn: mutation.payload.measuredOn,
    notes: mutation.payload.notes,
    place: mutation.payload.place,
    weightGrams: mutation.payload.weightGrams,
  });

  if (mutation.operation === "create") {
    const { error } = await supabase.from("weight_entries").upsert({
      id: mutation.payload.id,
      measured_on: entry.measuredOn,
      notes: entry.notes ?? null,
      place: entry.place,
      weight_grams: entry.weightGrams,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("weight_entries")
    .update({
      measured_on: entry.measuredOn,
      notes: entry.notes ?? null,
      place: entry.place,
      weight_grams: entry.weightGrams,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mutation.payload.id);

  if (error) {
    throw error;
  }
}

function isPendingWeightMutation(value: unknown): value is PendingWeightMutation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const mutation = value as PendingWeightMutation;

  return (
    mutation.entity === "weight" &&
    ["create", "update", "delete"].includes(mutation.operation) &&
    typeof mutation.id === "string" &&
    typeof mutation.createdAt === "string" &&
    typeof mutation.payload === "object" &&
    mutation.payload !== null
  );
}

function isWeightPayload(
  value: PendingWeightMutation["payload"],
): value is Extract<PendingWeightMutation["payload"], { measuredOn: string }> {
  return (
    "measuredOn" in value &&
    "weightGrams" in value &&
    "place" in value &&
    typeof value.id === "string" &&
    typeof value.measuredOn === "string" &&
    typeof value.weightGrams === "number" &&
    typeof value.place === "string" &&
    isWeightPlace(value.place)
  );
}
