import { NextResponse } from "next/server";
import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import { SupabaseTravelChecklistRepository } from "@/modules/travel/infrastructure/supabase-travel-checklist-repository";
import { SupabaseVaccinePlanRepository } from "@/modules/vaccines/infrastructure/supabase-vaccine-plan-repository";
import { SupabaseWeightRepository } from "@/modules/weight/infrastructure/supabase-weight-repository";
import { SupabaseSleepRepository } from "@/modules/sleep/infrastructure/supabase-sleep-repository";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import type { OfflineSnapshot } from "@/shared/infrastructure/offline/irati-offline-db";

export async function GET() {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const profileRepository = new SupabaseProfileRepository(supabase);
  const weightRepository = new SupabaseWeightRepository(supabase);
  const vaccineRepository = new SupabaseVaccinePlanRepository(supabase);
  const travelRepository = new SupabaseTravelChecklistRepository(supabase);
  const sleepRepository = new SupabaseSleepRepository(supabase);

  try {
    const [
      { profile },
      weightEntries,
      plannedVaccineDoses,
      appliedVaccineDoses,
      travelChecklistCategories,
      travelChecklistItems,
      travelStorageLocations,
      sleepEntries,
    ] = await Promise.all([
      getBabyProfile(profileRepository),
      weightRepository.listWeightEntries(),
      vaccineRepository.listPlannedVaccineDoses(),
      vaccineRepository.listAppliedVaccineDoses(),
      travelRepository.listTravelChecklistCategories(),
      travelRepository.listTravelChecklistItems(),
      travelRepository.listTravelStorageLocations(),
      sleepRepository.listSleepEntries(),
    ]);
    const snapshot: OfflineSnapshot = {
      appliedVaccineDoses,
      plannedVaccineDoses,
      profile,
      travelChecklistItems,
      travelChecklistCategories,
      travelStorageLocations,
      weightEntries,
      sleepEntries,
    };

    return NextResponse.json(
      { snapshot, syncedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Snapshot unavailable" }, { status: 503 });
  }
}
