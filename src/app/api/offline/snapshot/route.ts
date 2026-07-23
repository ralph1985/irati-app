import { NextResponse } from "next/server";
import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import { SupabaseTravelChecklistRepository } from "@/modules/travel/infrastructure/supabase-travel-checklist-repository";
import { SupabaseVaccinePlanRepository } from "@/modules/vaccines/infrastructure/supabase-vaccine-plan-repository";
import { SupabaseWeightRepository } from "@/modules/weight/infrastructure/supabase-weight-repository";
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

  try {
    const [
      { profile },
      weightEntries,
      plannedVaccineDoses,
      appliedVaccineDoses,
      travelChecklistItems,
    ] = await Promise.all([
      getBabyProfile(profileRepository),
      weightRepository.listWeightEntries(),
      vaccineRepository.listPlannedVaccineDoses(),
      vaccineRepository.listAppliedVaccineDoses(),
      travelRepository.listTravelChecklistItems(),
    ]);
    const snapshot: OfflineSnapshot = {
      appliedVaccineDoses,
      plannedVaccineDoses,
      profile,
      travelChecklistItems,
      weightEntries,
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
