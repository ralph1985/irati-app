import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import {
  applyOfflineSleepMutation,
  OfflineSleepMutationConflictError,
  type OfflineSleepMutationRepository,
} from "@/modules/sleep/application/apply-offline-sleep-mutation";
import { createSleepEntry, isSleepKind, type SleepEntry } from "@/modules/sleep/domain/sleep-entry";
import type { Database } from "@/shared/infrastructure/supabase/database.types";
import { readJsonBody, toJsonBodyError } from "@/shared/infrastructure/http/read-json-body";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import type { PendingSleepMutation } from "@/shared/infrastructure/offline/irati-offline-db";

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let mutation: unknown;

  try {
    mutation = await readJsonBody(request);
  } catch (error) {
    const bodyError = toJsonBodyError(error);
    return NextResponse.json({ error: bodyError.message }, { status: bodyError.status });
  }
  if (!isPendingSleepMutation(mutation)) {
    return NextResponse.json({ error: "Invalid mutation" }, { status: 400 });
  }

  try {
    await applyOfflineSleepMutation(
      new SupabaseOfflineSleepMutationRepository(createServerSupabaseClient()),
      mutation,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OfflineSleepMutationConflictError) {
      return NextResponse.json(
        {
          activeEntry: error.activeEntry,
          conflict: "active_sleep_entry",
          error: "Manual conflict",
        },
        { status: 409 },
      );
    }

    if (isUniqueActiveSleepViolation(error)) {
      const activeEntry = await new SupabaseOfflineSleepMutationRepository(
        createServerSupabaseClient(),
      ).getActiveSleepEntry();
      return NextResponse.json(
        { activeEntry, conflict: "active_sleep_entry", error: "Manual conflict" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Mutation rejected" }, { status: 422 });
  }
}

class SupabaseOfflineSleepMutationRepository implements OfflineSleepMutationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getActiveSleepEntry(): Promise<SleepEntry | null> {
    const { data, error } = await this.supabase
      .from("sleep_entries")
      .select("id,kind,started_at,ended_at,created_at,updated_at")
      .is("ended_at", null)
      .maybeSingle();
    if (error) throw error;
    return data ? mapSleepEntry(data) : null;
  }

  async createSleepEntryWithId(entry: SleepEntry): Promise<void> {
    const { error } = await this.supabase.from("sleep_entries").insert({
      created_at: entry.createdAt,
      ended_at: entry.endedAt,
      id: entry.id,
      kind: entry.kind,
      started_at: entry.startedAt,
      updated_at: entry.updatedAt,
    });
    if (error) throw error;
  }

  async updateSleepEntry(
    id: string,
    entry: Omit<SleepEntry, "id" | "createdAt" | "updatedAt">,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("sleep_entries")
      .update({
        ended_at: entry.endedAt,
        kind: entry.kind,
        started_at: entry.startedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async deleteSleepEntry(id: string): Promise<void> {
    const { error } = await this.supabase.from("sleep_entries").delete().eq("id", id);
    if (error) throw error;
  }
}

function isPendingSleepMutation(value: unknown): value is PendingSleepMutation {
  if (!value || typeof value !== "object") return false;
  const mutation = value as PendingSleepMutation;
  if (
    mutation.entity !== "sleep" ||
    !["create", "update", "delete"].includes(mutation.operation) ||
    typeof mutation.id !== "string" ||
    typeof mutation.createdAt !== "string" ||
    !mutation.payload ||
    typeof mutation.payload !== "object" ||
    typeof mutation.payload.id !== "string"
  ) {
    return false;
  }
  if (mutation.operation === "delete") return true;
  if (!isSleepEntryPayload(mutation.payload)) return false;
  try {
    createSleepEntry(mutation.payload);
    return true;
  } catch {
    return false;
  }
}

function isSleepEntryPayload(value: PendingSleepMutation["payload"]): value is SleepEntry {
  return (
    "kind" in value &&
    "startedAt" in value &&
    "endedAt" in value &&
    "createdAt" in value &&
    "updatedAt" in value &&
    typeof value.kind === "string" &&
    isSleepKind(value.kind) &&
    typeof value.startedAt === "string" &&
    (value.endedAt === null || typeof value.endedAt === "string") &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isUniqueActiveSleepViolation(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as { code?: string }).code === "23505";
}

function mapSleepEntry(row: Database["public"]["Tables"]["sleep_entries"]["Row"]): SleepEntry {
  return {
    createdAt: row.created_at,
    endedAt: row.ended_at,
    id: row.id,
    kind: row.kind,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
  };
}
