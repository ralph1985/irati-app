import { NextResponse } from "next/server";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import {
  createTravelChecklistItem,
  isTravelChecklistCategory,
  updateTravelChecklistItemInput,
} from "@/modules/travel/domain/travel-checklist-item";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import type { PendingTravelMutation } from "@/shared/infrastructure/offline/irati-offline-db";

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mutation = await request.json().catch(() => null);

  if (!isPendingTravelMutation(mutation)) {
    return NextResponse.json({ error: "Invalid mutation" }, { status: 400 });
  }

  try {
    await applyTravelMutation(mutation);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mutation rejected" }, { status: 422 });
  }
}

async function applyTravelMutation(mutation: PendingTravelMutation): Promise<void> {
  const supabase = createServerSupabaseClient();

  if (mutation.operation === "reset") {
    const { error } = await supabase
      .from("travel_checklist_items")
      .update({ is_packed: false, updated_at: new Date().toISOString() })
      .eq("is_packed", true);

    if (error) {
      throw error;
    }

    return;
  }

  if (mutation.operation === "delete") {
    if (!("id" in mutation.payload)) {
      throw new Error("Invalid delete payload");
    }

    const { error } = await supabase
      .from("travel_checklist_items")
      .delete()
      .eq("id", mutation.payload.id);

    if (error) {
      throw error;
    }

    return;
  }

  if (mutation.operation === "setPacked") {
    if (!("isPacked" in mutation.payload) || typeof mutation.payload.isPacked !== "boolean") {
      throw new Error("Invalid packed payload");
    }

    const { error } = await supabase
      .from("travel_checklist_items")
      .update({ is_packed: mutation.payload.isPacked, updated_at: new Date().toISOString() })
      .eq("id", mutation.payload.id);

    if (error) {
      throw error;
    }

    return;
  }

  if (!isTravelItemPayload(mutation.payload)) {
    throw new Error("Invalid travel payload");
  }

  const item =
    mutation.operation === "create"
      ? createTravelChecklistItem(mutation.payload)
      : updateTravelChecklistItemInput(mutation.payload);

  if (mutation.operation === "create") {
    const { error } = await supabase.from("travel_checklist_items").upsert({
      id: mutation.payload.id,
      category: item.category,
      is_packed: item.isPacked ?? false,
      label: item.label,
      notes: item.notes ?? null,
      sort_order: item.sortOrder,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("travel_checklist_items")
    .update({
      category: item.category,
      is_packed: item.isPacked ?? false,
      label: item.label,
      notes: item.notes ?? null,
      sort_order: item.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mutation.payload.id);

  if (error) {
    throw error;
  }
}

function isPendingTravelMutation(value: unknown): value is PendingTravelMutation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const mutation = value as PendingTravelMutation;

  return (
    mutation.entity === "travel" &&
    ["create", "update", "setPacked", "delete", "reset"].includes(mutation.operation) &&
    typeof mutation.id === "string" &&
    typeof mutation.createdAt === "string" &&
    typeof mutation.payload === "object" &&
    mutation.payload !== null
  );
}

function isTravelItemPayload(
  value: PendingTravelMutation["payload"],
): value is Extract<PendingTravelMutation["payload"], { label: string }> {
  return (
    "label" in value &&
    "category" in value &&
    "sortOrder" in value &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.category === "string" &&
    isTravelChecklistCategory(value.category) &&
    typeof value.sortOrder === "number"
  );
}
