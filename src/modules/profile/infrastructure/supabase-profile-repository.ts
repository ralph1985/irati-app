import { SupabaseClient } from "@supabase/supabase-js";
import { ProfileRepository } from "../application/profile-repository";
import { BabyProfile, BabyProfileUpdate } from "../domain/baby-profile";
import { Database } from "@/shared/infrastructure/supabase/database.types";

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getBabyProfile(): Promise<BabyProfile | null> {
    const { data, error } = await this.supabase
      .from("baby_profiles")
      .select("id,name,birth_date,cipa")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      name: data.name,
      birthDate: data.birth_date,
      cipa: data.cipa,
    };
  }

  async updateBabyProfile(profile: BabyProfileUpdate): Promise<BabyProfile> {
    const currentProfile = await this.getProfileId();

    if (!currentProfile) {
      throw new Error("Baby profile not found.");
    }

    const { data, error } = await this.supabase
      .from("baby_profiles")
      .update({
        cipa: profile.cipa,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentProfile.id)
      .select("name,birth_date,cipa")
      .single();

    if (error) {
      throw error;
    }

    return {
      name: data.name,
      birthDate: data.birth_date,
      cipa: data.cipa,
    };
  }

  private async getProfileId(): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase
      .from("baby_profiles")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  }
}
