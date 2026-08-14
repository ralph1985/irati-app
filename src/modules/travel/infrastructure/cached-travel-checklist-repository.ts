import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import {
  TravelChecklistCategoryDefinition,
  TravelChecklistItem,
} from "../domain/travel-checklist-item";
import { SupabaseTravelChecklistRepository } from "./supabase-travel-checklist-repository";

const listCachedTravelChecklistItems = unstable_cache(
  async (): Promise<TravelChecklistItem[]> =>
    new SupabaseTravelChecklistRepository(createServerSupabaseClient()).listTravelChecklistItems(),
  ["irati", "travel-checklist-items"],
  {
    revalidate: false,
    tags: [CACHE_TAGS.travelChecklistItems],
  },
);

const listCachedTravelChecklistCategories = unstable_cache(
  async (): Promise<TravelChecklistCategoryDefinition[]> =>
    new SupabaseTravelChecklistRepository(
      createServerSupabaseClient(),
    ).listTravelChecklistCategories(),
  ["irati", "travel-checklist-categories"],
  {
    revalidate: false,
    tags: [CACHE_TAGS.travelChecklistItems],
  },
);

export class CachedTravelChecklistReadRepository {
  async listTravelChecklistCategories(): Promise<TravelChecklistCategoryDefinition[]> {
    return listCachedTravelChecklistCategories();
  }

  async listTravelChecklistItems(): Promise<TravelChecklistItem[]> {
    return listCachedTravelChecklistItems();
  }
}
