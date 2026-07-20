import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import { ProfileRepository } from "../application/profile-repository";
import { BabyProfile } from "../domain/baby-profile";
import { SupabaseProfileRepository } from "./supabase-profile-repository";

const getCachedBabyProfile = unstable_cache(
  async (): Promise<BabyProfile | null> =>
    new SupabaseProfileRepository(createServerSupabaseClient()).getBabyProfile(),
  ["irati", "profile", "with-cipa"],
  {
    revalidate: false,
    tags: [CACHE_TAGS.profile],
  },
);

export class CachedProfileRepository implements ProfileRepository {
  async getBabyProfile(): Promise<BabyProfile | null> {
    return getCachedBabyProfile();
  }
}
