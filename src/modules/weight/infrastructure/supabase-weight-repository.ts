import { SupabaseClient } from "@supabase/supabase-js";
import { WeightRepository } from "../application/weight-repository";
import { NewWeightEntry, WeightEntry } from "../domain/weight-entry";
import { Database } from "@/shared/infrastructure/supabase/database.types";

export class SupabaseWeightRepository implements WeightRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listWeightEntries(): Promise<WeightEntry[]> {
    const { data, error } = await this.supabase
      .from("weight_entries")
      .select("id,measured_on,weight_grams,place,notes")
      .order("measured_on", { ascending: false });

    if (error) {
      throw error;
    }

    return data.map((entry) => ({
      id: entry.id,
      measuredOn: entry.measured_on,
      weightGrams: entry.weight_grams,
      place: entry.place,
      notes: entry.notes,
    }));
  }

  async createWeightEntry(entry: NewWeightEntry): Promise<WeightEntry> {
    const { data, error } = await this.supabase
      .from("weight_entries")
      .insert({
        measured_on: entry.measuredOn,
        weight_grams: entry.weightGrams,
        place: entry.place,
        notes: entry.notes ?? null,
      })
      .select("id,measured_on,weight_grams,place,notes")
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      measuredOn: data.measured_on,
      weightGrams: data.weight_grams,
      place: data.place,
      notes: data.notes,
    };
  }

  async updateWeightEntry(id: string, entry: NewWeightEntry): Promise<WeightEntry> {
    const { data, error } = await this.supabase
      .from("weight_entries")
      .update({
        measured_on: entry.measuredOn,
        weight_grams: entry.weightGrams,
        place: entry.place,
        notes: entry.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,measured_on,weight_grams,place,notes")
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      measuredOn: data.measured_on,
      weightGrams: data.weight_grams,
      place: data.place,
      notes: data.notes,
    };
  }

  async deleteWeightEntry(id: string): Promise<void> {
    const { error } = await this.supabase.from("weight_entries").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }
}
