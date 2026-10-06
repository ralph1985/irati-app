import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import { AppliedVaccineDose, PlannedVaccineDose } from "../domain/vaccine-calendar";
import { SupabaseVaccinePlanRepository } from "./supabase-vaccine-plan-repository";

export class CachedVaccinePlanReadRepository {
  async listPlannedVaccineDoses(): Promise<PlannedVaccineDose[]> {
    return new SupabaseVaccinePlanRepository(
      createServerSupabaseClient(),
    ).listPlannedVaccineDoses();
  }

  async listAppliedVaccineDoses(): Promise<AppliedVaccineDose[]> {
    return new SupabaseVaccinePlanRepository(
      createServerSupabaseClient(),
    ).listAppliedVaccineDoses();
  }
}
