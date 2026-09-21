import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/infrastructure/supabase/database.types";
import type { FriendMutationRepository } from "../application/friend-repository";
import type { FriendEntry, FriendEntryInput } from "../domain/friend-entry";

const friendEntrySelection = "id,group_label,adults_label,children_label,sort_order";

export class SupabaseFriendRepository implements FriendMutationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listFriendEntries(): Promise<FriendEntry[]> {
    const { data, error } = await this.supabase
      .from("friend_entries")
      .select(friendEntrySelection)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapFriendEntry);
  }

  async createFriendEntry(
    input: FriendEntryInput & { id: string; sortOrder: number },
  ): Promise<FriendEntry> {
    const { data, error } = await this.supabase
      .from("friend_entries")
      .insert({
        adults_label: input.adultsLabel,
        children_label: input.childrenLabel,
        group_label: input.groupLabel,
        id: input.id,
        sort_order: input.sortOrder,
      })
      .select(friendEntrySelection)
      .single();

    if (error) {
      throw error;
    }

    return mapFriendEntry(data);
  }

  async updateFriendEntry(id: string, input: FriendEntryInput): Promise<FriendEntry> {
    const { data, error } = await this.supabase
      .from("friend_entries")
      .update({
        adults_label: input.adultsLabel,
        children_label: input.childrenLabel,
        group_label: input.groupLabel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(friendEntrySelection)
      .single();

    if (error) {
      throw error;
    }

    return mapFriendEntry(data);
  }

  async renameFriendGroup(currentLabel: string, nextLabel: string): Promise<void> {
    const { error } = await this.supabase
      .from("friend_entries")
      .update({
        group_label: nextLabel,
        updated_at: new Date().toISOString(),
      })
      .eq("group_label", currentLabel);

    if (error) {
      throw error;
    }
  }
}

function mapFriendEntry(row: {
  id: string;
  group_label: string | null;
  adults_label: string;
  children_label: string;
  sort_order: number;
}): FriendEntry {
  return {
    adultsLabel: row.adults_label,
    childrenLabel: row.children_label,
    groupLabel: row.group_label,
    id: row.id,
    sortOrder: row.sort_order,
  };
}
