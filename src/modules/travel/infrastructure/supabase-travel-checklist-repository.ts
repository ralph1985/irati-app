import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/shared/infrastructure/supabase/database.types";
import { TravelChecklistRepository } from "../application/travel-checklist-repository";
import { NewTravelChecklistItem, TravelChecklistItem } from "../domain/travel-checklist-item";

export class SupabaseTravelChecklistRepository implements TravelChecklistRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listTravelChecklistItems(): Promise<TravelChecklistItem[]> {
    const { data, error } = await this.supabase
      .from("travel_checklist_items")
      .select("id,label,category,sort_order,is_packed,notes")
      .order("category", { ascending: true })
      .order("is_packed", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapTravelChecklistItem);
  }

  async createTravelChecklistItem(item: NewTravelChecklistItem): Promise<TravelChecklistItem> {
    const { data, error } = await this.supabase
      .from("travel_checklist_items")
      .insert({
        label: item.label,
        category: item.category,
        sort_order: item.sortOrder,
        is_packed: item.isPacked ?? false,
        notes: item.notes ?? null,
      })
      .select("id,label,category,sort_order,is_packed,notes")
      .single();

    if (error) {
      throw error;
    }

    return mapTravelChecklistItem(data);
  }

  async updateTravelChecklistItem(
    id: string,
    item: NewTravelChecklistItem,
  ): Promise<TravelChecklistItem> {
    const { data, error } = await this.supabase
      .from("travel_checklist_items")
      .update({
        label: item.label,
        category: item.category,
        sort_order: item.sortOrder,
        is_packed: item.isPacked ?? false,
        notes: item.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,label,category,sort_order,is_packed,notes")
      .single();

    if (error) {
      throw error;
    }

    return mapTravelChecklistItem(data);
  }

  async setTravelChecklistItemPacked(id: string, isPacked: boolean): Promise<TravelChecklistItem> {
    const { data, error } = await this.supabase
      .from("travel_checklist_items")
      .update({
        is_packed: isPacked,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,label,category,sort_order,is_packed,notes")
      .single();

    if (error) {
      throw error;
    }

    return mapTravelChecklistItem(data);
  }

  async deleteTravelChecklistItem(id: string): Promise<void> {
    const { error } = await this.supabase.from("travel_checklist_items").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  async resetTravelChecklist(): Promise<void> {
    const { error } = await this.supabase
      .from("travel_checklist_items")
      .update({
        is_packed: false,
        updated_at: new Date().toISOString(),
      })
      .eq("is_packed", true);

    if (error) {
      throw error;
    }
  }
}

function mapTravelChecklistItem(
  row: Pick<
    Database["public"]["Tables"]["travel_checklist_items"]["Row"],
    "id" | "label" | "category" | "sort_order" | "is_packed" | "notes"
  >,
): TravelChecklistItem {
  return {
    id: row.id,
    label: row.label,
    category: row.category,
    sortOrder: row.sort_order,
    isPacked: row.is_packed,
    notes: row.notes,
  };
}
