import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import { AppliedVaccineDose, PlannedVaccineDose } from "../domain/vaccine-calendar";
import { SupabaseVaccinePlanRepository } from "./supabase-vaccine-plan-repository";

const listCachedPlannedVaccineDoses = unstable_cache(
  async (): Promise<PlannedVaccineDose[]> =>
    new SupabaseVaccinePlanRepository(createServerSupabaseClient()).listPlannedVaccineDoses(),
  ["irati", "vaccines", "planned-doses"],
  {
    revalidate: false,
    tags: [CACHE_TAGS.vaccinePlannedDoses],
  },
);

const listCachedAppliedVaccineDoses = unstable_cache(
  async (): Promise<AppliedVaccineDose[]> =>
    new SupabaseVaccinePlanRepository(createServerSupabaseClient()).listAppliedVaccineDoses(),
  ["irati", "vaccines", "applied-doses"],
  {
    revalidate: false,
    tags: [CACHE_TAGS.vaccineAppliedDoses],
  },
);

export class CachedVaccinePlanReadRepository {
  async listPlannedVaccineDoses(): Promise<PlannedVaccineDose[]> {
    return listCachedPlannedVaccineDoses();
  }

  async listAppliedVaccineDoses(): Promise<AppliedVaccineDose[]> {
    return listCachedAppliedVaccineDoses();
  }
}
