import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import type { SleepEntry } from "../domain/sleep-entry";
import { SupabaseSleepRepository } from "./supabase-sleep-repository";

const listCachedSleepEntries = unstable_cache(
  async (): Promise<SleepEntry[]> =>
    new SupabaseSleepRepository(createServerSupabaseClient()).listSleepEntries(),
  ["irati", "sleep-entries"],
  { revalidate: false, tags: [CACHE_TAGS.sleepEntries] },
);

export class CachedSleepRepository {
  async listSleepEntries(): Promise<SleepEntry[]> {
    return listCachedSleepEntries();
  }
}
