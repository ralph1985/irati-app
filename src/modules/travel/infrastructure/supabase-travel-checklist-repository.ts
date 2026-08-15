import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/shared/infrastructure/supabase/database.types";
import { TravelChecklistRepository } from "../application/travel-checklist-repository";
import {
  NewTravelChecklistItem,
  TravelChecklistCategoryDefinition,
  TravelChecklistItem,
  TravelStorageLocation,
} from "../domain/travel-checklist-item";

export class SupabaseTravelChecklistRepository implements TravelChecklistRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listTravelChecklistCategories(): Promise<TravelChecklistCategoryDefinition[]> {
    const { data, error } = await this.supabase
      .from("travel_checklist_categories")
      .select("slug,label,sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map((row) => ({
      label: row.label,
      slug: row.slug,
      sortOrder: row.sort_order,
    }));
  }

  async listTravelChecklistItems(): Promise<TravelChecklistItem[]> {
    const { data, error } = await this.supabase
      .from("travel_checklist_items")
      .select("id,label,category,sort_order,is_packed,notes,storage_location_id")
      .order("category", { ascending: true })
      .order("is_packed", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapTravelChecklistItem);
  }

  async listTravelStorageLocations(): Promise<TravelStorageLocation[]> {
    const { data, error } = await this.supabase
      .from("travel_storage_locations")
      .select("id,label,parent_id,sort_order")
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data.map((row) => ({
      id: row.id,
      label: row.label,
      parentId: row.parent_id,
      sortOrder: row.sort_order,
    }));
  }

  async createTravelChecklistCategory(label: string): Promise<TravelChecklistCategoryDefinition> {
    const slug = label
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const categories = await this.listTravelChecklistCategories();
    const { data, error } = await this.supabase
      .from("travel_checklist_categories")
      .insert({
        slug: `${slug || "categoria"}_${Date.now()}`,
        label: label.trim(),
        sort_order: (Math.max(0, ...categories.map((category) => category.sortOrder)) || 0) + 10,
      })
      .select("slug,label,sort_order")
      .single();
    if (error) throw error;
    return { slug: data.slug, label: data.label, sortOrder: data.sort_order };
  }

  async updateTravelChecklistCategory(
    slug: string,
    label: string,
    sortOrder: number,
  ): Promise<void> {
    const current = await this.listTravelChecklistCategories();
    const target = current.find((category) => category.slug === slug);
    if (!target) throw new Error("CATEGORY_NOT_FOUND");
    const rest = current
      .filter((category) => category.slug !== slug)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = Math.max(0, Math.min(Math.round(sortOrder / 10) - 1, rest.length));
    rest.splice(index, 0, { ...target, label: label.trim() });
    for (const [position, category] of rest.entries()) {
      const { error } = await this.supabase
        .from("travel_checklist_categories")
        .update({
          label: category.slug === slug ? label.trim() : category.label,
          sort_order: 100000 + position,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", category.slug);
      if (error) throw error;
    }
    for (const [position, category] of rest.entries()) {
      const { error } = await this.supabase
        .from("travel_checklist_categories")
        .update({ sort_order: (position + 1) * 10 })
        .eq("slug", category.slug);
      if (error) throw error;
    }
  }

  async deleteTravelChecklistCategory(slug: string): Promise<void> {
    const { count, error: countError } = await this.supabase
      .from("travel_checklist_items")
      .select("id", { count: "exact", head: true })
      .eq("category", slug);
    if (countError) throw countError;
    if ((count ?? 0) > 0) throw new Error("CATEGORY_NOT_EMPTY");
    const { error } = await this.supabase
      .from("travel_checklist_categories")
      .delete()
      .eq("slug", slug);
    if (error) throw error;
  }

  async createTravelStorageLocation(
    location: Omit<TravelStorageLocation, "id">,
  ): Promise<TravelStorageLocation> {
    const { data, error } = await this.supabase
      .from("travel_storage_locations")
      .insert({
        label: location.label.trim(),
        parent_id: location.parentId,
        sort_order: location.sortOrder,
      })
      .select("id,label,parent_id,sort_order")
      .single();
    if (error) throw error;
    return { id: data.id, label: data.label, parentId: data.parent_id, sortOrder: data.sort_order };
  }

  async updateTravelStorageLocation(
    id: string,
    location: Omit<TravelStorageLocation, "id">,
  ): Promise<void> {
    if (location.parentId === id) throw new Error("LOCATION_CYCLE");
    const locations = await this.listTravelStorageLocations();
    const ancestors = new Map(locations.map((candidate) => [candidate.id, candidate.parentId]));
    let parentId = location.parentId;
    while (parentId) {
      if (parentId === id) throw new Error("LOCATION_CYCLE");
      parentId = ancestors.get(parentId) ?? null;
    }
    const { error } = await this.supabase
      .from("travel_storage_locations")
      .update({
        label: location.label.trim(),
        parent_id: location.parentId,
        sort_order: location.sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async deleteTravelStorageLocation(id: string): Promise<void> {
    const [{ count: itemCount, error: itemError }, { count: childCount, error: childError }] =
      await Promise.all([
        this.supabase
          .from("travel_checklist_items")
          .select("id", { count: "exact", head: true })
          .eq("storage_location_id", id),
        this.supabase
          .from("travel_storage_locations")
          .select("id", { count: "exact", head: true })
          .eq("parent_id", id),
      ]);
    if (itemError) throw itemError;
    if (childError) throw childError;
    if ((itemCount ?? 0) > 0 || (childCount ?? 0) > 0) throw new Error("LOCATION_NOT_EMPTY");
    const { error } = await this.supabase.from("travel_storage_locations").delete().eq("id", id);
    if (error) throw error;
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
        storage_location_id: item.storageLocationId ?? null,
      })
      .select("id,label,category,sort_order,is_packed,notes,storage_location_id")
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
        notes: item.notes ?? null,
        storage_location_id: item.storageLocationId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,label,category,sort_order,is_packed,notes,storage_location_id")
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
      .select("id,label,category,sort_order,is_packed,notes,storage_location_id")
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
    "id" | "label" | "category" | "sort_order" | "is_packed" | "notes" | "storage_location_id"
  >,
): TravelChecklistItem {
  return {
    id: row.id,
    label: row.label,
    category: row.category,
    sortOrder: row.sort_order,
    isPacked: row.is_packed,
    notes: row.notes,
    storageLocationId: row.storage_location_id,
  };
}
