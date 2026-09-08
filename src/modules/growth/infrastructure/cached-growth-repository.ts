import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import { SupabaseGrowthRepository } from "./supabase-growth-repository";

const listCachedGrowthEntries = unstable_cache(
  async () => {
    return new SupabaseGrowthRepository(createServerSupabaseClient()).listGrowthEntries();
  },
  ["irati", "growth-entries"],
  {
    revalidate: false,
    tags: [CACHE_TAGS.growthEntries],
  },
);

export class CachedGrowthReadRepository {
  async listGrowthEntries() {
    return listCachedGrowthEntries();
  }
}
