import { SupabaseClient } from "@supabase/supabase-js";
import { ProfileRepository } from "../application/profile-repository";
import { BabyProfile } from "../domain/baby-profile";
import { Database } from "@/shared/infrastructure/supabase/database.types";

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getBabyProfile(): Promise<BabyProfile | null> {
    const { data, error } = await this.supabase
      .from("baby_profiles")
      .select("name,birth_date")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      name: data.name,
      birthDate: data.birth_date,
    };
  }
}
