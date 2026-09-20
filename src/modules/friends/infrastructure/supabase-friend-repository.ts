import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/infrastructure/supabase/database.types";
import type { FriendRepository } from "../application/friend-repository";
import type { FriendEntry } from "../domain/friend-entry";

export class SupabaseFriendRepository implements FriendRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listFriendEntries(): Promise<FriendEntry[]> {
    const { data, error } = await this.supabase
      .from("friend_entries")
      .select("id,group_label,adults_label,children_label,sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map((row) => ({
      adultsLabel: row.adults_label,
      childrenLabel: row.children_label,
      groupLabel: row.group_label,
      id: row.id,
      sortOrder: row.sort_order,
    }));
  }
}
