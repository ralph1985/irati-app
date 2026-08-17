import type { SupabaseClient } from "@supabase/supabase-js";
import type { SleepRepository } from "../application/sleep-repository";
import type { NewSleepEntry, SleepEntry } from "../domain/sleep-entry";
import type { Database } from "@/shared/infrastructure/supabase/database.types";

export class SupabaseSleepRepository implements SleepRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listSleepEntries(): Promise<SleepEntry[]> {
    const { data, error } = await this.supabase
      .from("sleep_entries")
      .select("id,kind,started_at,ended_at,created_at,updated_at")
      .order("started_at", { ascending: false });

    if (error) throw error;
    return data.map(mapSleepEntry);
  }

  async getActiveSleepEntry(): Promise<SleepEntry | null> {
    const { data, error } = await this.supabase
      .from("sleep_entries")
      .select("id,kind,started_at,ended_at,created_at,updated_at")
      .is("ended_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? mapSleepEntry(data) : null;
  }

  async createSleepEntry(entry: NewSleepEntry): Promise<SleepEntry> {
    const { data, error } = await this.supabase
      .from("sleep_entries")
      .insert({ ended_at: entry.endedAt, kind: entry.kind, started_at: entry.startedAt })
      .select("id,kind,started_at,ended_at,created_at,updated_at")
      .single();

    if (error) throw error;
    return mapSleepEntry(data);
  }

  async updateSleepEntry(id: string, entry: NewSleepEntry): Promise<SleepEntry> {
    const { data, error } = await this.supabase
      .from("sleep_entries")
      .update({
        ended_at: entry.endedAt,
        kind: entry.kind,
        started_at: entry.startedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,kind,started_at,ended_at,created_at,updated_at")
      .single();

    if (error) throw error;
    return mapSleepEntry(data);
  }

  async deleteSleepEntry(id: string): Promise<void> {
    const { error } = await this.supabase.from("sleep_entries").delete().eq("id", id);
    if (error) throw error;
  }
}

type SleepEntryRow = Database["public"]["Tables"]["sleep_entries"]["Row"];

function mapSleepEntry(row: SleepEntryRow): SleepEntry {
  return {
    createdAt: row.created_at,
    endedAt: row.ended_at,
    id: row.id,
    kind: row.kind,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
  };
}
