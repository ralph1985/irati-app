import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import type { FriendRepository } from "../application/friend-repository";
import type { FriendEntry } from "../domain/friend-entry";
import { SupabaseFriendRepository } from "./supabase-friend-repository";

const getCachedFriendEntries = unstable_cache(
  async (): Promise<FriendEntry[]> =>
    new SupabaseFriendRepository(createServerSupabaseClient()).listFriendEntries(),
  ["irati", "friends", "v2"],
  {
    revalidate: false,
    tags: [CACHE_TAGS.friends],
  },
);

export class CachedFriendReadRepository implements FriendRepository {
  async listFriendEntries(): Promise<FriendEntry[]> {
    return getCachedFriendEntries();
  }
}
