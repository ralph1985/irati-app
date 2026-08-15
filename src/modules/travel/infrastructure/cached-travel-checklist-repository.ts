import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import {
  TravelChecklistCategoryDefinition,
  TravelChecklistItem,
  TravelStorageLocation,
} from "../domain/travel-checklist-item";
import { SupabaseTravelChecklistRepository } from "./supabase-travel-checklist-repository";

export class CachedTravelChecklistReadRepository {
  async listTravelChecklistCategories(): Promise<TravelChecklistCategoryDefinition[]> {
    return new SupabaseTravelChecklistRepository(
      createServerSupabaseClient(),
    ).listTravelChecklistCategories();
  }

  async listTravelChecklistItems(): Promise<TravelChecklistItem[]> {
    return new SupabaseTravelChecklistRepository(
      createServerSupabaseClient(),
    ).listTravelChecklistItems();
  }

  async listTravelStorageLocations(): Promise<TravelStorageLocation[]> {
    return new SupabaseTravelChecklistRepository(
      createServerSupabaseClient(),
    ).listTravelStorageLocations();
  }
}
