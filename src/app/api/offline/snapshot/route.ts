import { NextResponse } from "next/server";
import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { CachedFriendReadRepository } from "@/modules/friends/infrastructure/cached-friend-read-repository";
import { listFriends } from "@/modules/friends/application/list-friends";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import { SupabaseTravelChecklistRepository } from "@/modules/travel/infrastructure/supabase-travel-checklist-repository";
import { SupabaseVaccinePlanRepository } from "@/modules/vaccines/infrastructure/supabase-vaccine-plan-repository";
import { SupabaseWeightRepository } from "@/modules/weight/infrastructure/supabase-weight-repository";
import { SupabaseSleepRepository } from "@/modules/sleep/infrastructure/supabase-sleep-repository";
import { SupabaseGrowthRepository } from "@/modules/growth/infrastructure/supabase-growth-repository";
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
  const growthRepository = new SupabaseGrowthRepository(supabase);

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
      { heightEntries, headCircumferenceEntries },
      friends,
    ] = await Promise.all([
      getBabyProfile(profileRepository),
      weightRepository.listWeightEntries(),
      vaccineRepository.listPlannedVaccineDoses(),
      vaccineRepository.listAppliedVaccineDoses(),
      travelRepository.listTravelChecklistCategories(),
      travelRepository.listTravelChecklistItems(),
      travelRepository.listTravelStorageLocations(),
      sleepRepository.listSleepEntries(),
      growthRepository.listGrowthEntries(),
      listFriends(new CachedFriendReadRepository()),
    ]);
    const snapshot: OfflineSnapshot = {
      appliedVaccineDoses,
      friendEntries: friends.groups.flatMap((group) => group.entries),
      plannedVaccineDoses,
      profile,
      travelChecklistItems,
      travelChecklistCategories,
      travelStorageLocations,
      weightEntries,
      heightEntries,
      headCircumferenceEntries,
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
