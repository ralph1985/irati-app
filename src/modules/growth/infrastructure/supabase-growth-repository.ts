import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/shared/infrastructure/supabase/database.types";
import { GrowthRepository } from "../application/growth-repository";
import {
  HeadCircumferenceEntry,
  HeightEntry,
  NewHeadCircumferenceEntry,
  NewHeightEntry,
} from "../domain/growth-entry";

export class SupabaseGrowthRepository implements GrowthRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listGrowthEntries() {
    const [heightEntries, headCircumferenceEntries] = await Promise.all([
      this.listHeightEntries(),
      this.listHeadCircumferenceEntries(),
    ]);

    return { heightEntries, headCircumferenceEntries };
  }

  async listHeightEntries(): Promise<HeightEntry[]> {
    const { data, error } = await this.supabase
      .from("height_entries")
      .select("id,measured_on,height_cm,place,notes")
      .order("measured_on", { ascending: false });

    if (error) throw error;

    return data.map((entry) => ({
      id: entry.id,
      measuredOn: entry.measured_on,
      heightCm: entry.height_cm,
      place: entry.place,
      notes: entry.notes,
    }));
  }

  async createHeightEntry(entry: NewHeightEntry): Promise<HeightEntry> {
    const { data, error } = await this.supabase
      .from("height_entries")
      .insert({
        measured_on: entry.measuredOn,
        height_cm: entry.heightCm,
        place: entry.place,
        notes: entry.notes ?? null,
      })
      .select("id,measured_on,height_cm,place,notes")
      .single();

    if (error) throw error;
    return mapHeightEntry(data);
  }

  async updateHeightEntry(id: string, entry: NewHeightEntry): Promise<HeightEntry> {
    const { data, error } = await this.supabase
      .from("height_entries")
      .update({
        measured_on: entry.measuredOn,
        height_cm: entry.heightCm,
        place: entry.place,
        notes: entry.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,measured_on,height_cm,place,notes")
      .single();

    if (error) throw error;
    return mapHeightEntry(data);
  }

  async deleteHeightEntry(id: string): Promise<void> {
    const { error } = await this.supabase.from("height_entries").delete().eq("id", id);
    if (error) throw error;
  }

  async listHeadCircumferenceEntries(): Promise<HeadCircumferenceEntry[]> {
    const { data, error } = await this.supabase
      .from("head_circumference_entries")
      .select("id,measured_on,head_circumference_cm,place,notes")
      .order("measured_on", { ascending: false });

    if (error) throw error;

    return data.map(mapHeadCircumferenceEntry);
  }

  async createHeadCircumferenceEntry(
    entry: NewHeadCircumferenceEntry,
  ): Promise<HeadCircumferenceEntry> {
    const { data, error } = await this.supabase
      .from("head_circumference_entries")
      .insert({
        measured_on: entry.measuredOn,
        head_circumference_cm: entry.headCircumferenceCm,
        place: entry.place,
        notes: entry.notes ?? null,
      })
      .select("id,measured_on,head_circumference_cm,place,notes")
      .single();

    if (error) throw error;
    return mapHeadCircumferenceEntry(data);
  }

  async updateHeadCircumferenceEntry(
    id: string,
    entry: NewHeadCircumferenceEntry,
  ): Promise<HeadCircumferenceEntry> {
    const { data, error } = await this.supabase
      .from("head_circumference_entries")
      .update({
        measured_on: entry.measuredOn,
        head_circumference_cm: entry.headCircumferenceCm,
        place: entry.place,
        notes: entry.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,measured_on,head_circumference_cm,place,notes")
      .single();

    if (error) throw error;
    return mapHeadCircumferenceEntry(data);
  }

  async deleteHeadCircumferenceEntry(id: string): Promise<void> {
    const { error } = await this.supabase.from("head_circumference_entries").delete().eq("id", id);
    if (error) throw error;
  }
}

function mapHeightEntry(
  entry: Pick<
    Database["public"]["Tables"]["height_entries"]["Row"],
    "id" | "measured_on" | "height_cm" | "place" | "notes"
  >,
): HeightEntry {
  return {
    id: entry.id,
    measuredOn: entry.measured_on,
    heightCm: entry.height_cm,
    place: entry.place,
    notes: entry.notes,
  };
}

function mapHeadCircumferenceEntry(
  entry: Pick<
    Database["public"]["Tables"]["head_circumference_entries"]["Row"],
    "id" | "measured_on" | "head_circumference_cm" | "place" | "notes"
  >,
): HeadCircumferenceEntry {
  return {
    id: entry.id,
    measuredOn: entry.measured_on,
    headCircumferenceCm: entry.head_circumference_cm,
    place: entry.place,
    notes: entry.notes,
  };
}
