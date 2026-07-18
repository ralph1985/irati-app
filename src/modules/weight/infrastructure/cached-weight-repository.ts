import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import { WeightEntry } from "../domain/weight-entry";
import { SupabaseWeightRepository } from "./supabase-weight-repository";

const listCachedWeightEntries = unstable_cache(
  async (): Promise<WeightEntry[]> =>
    new SupabaseWeightRepository(createServerSupabaseClient()).listWeightEntries(),
  ["irati", "weight-entries"],
  {
    revalidate: false,
    tags: [CACHE_TAGS.weightEntries],
  },
);

export class CachedWeightReadRepository {
  async listWeightEntries(): Promise<WeightEntry[]> {
    return listCachedWeightEntries();
  }
}
