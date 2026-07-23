import Dexie, { type Table } from "dexie";
import type { BabyProfile } from "@/modules/profile/domain/baby-profile";
import type { TravelChecklistItem } from "@/modules/travel/domain/travel-checklist-item";
import type {
  AppliedVaccineDose,
  PlannedVaccineDose,
} from "@/modules/vaccines/domain/vaccine-calendar";
import type { WeightEntry } from "@/modules/weight/domain/weight-entry";

export type OfflineSnapshot = {
  profile: BabyProfile | null;
  weightEntries: WeightEntry[];
  plannedVaccineDoses: PlannedVaccineDose[];
  appliedVaccineDoses: AppliedVaccineDose[];
  travelChecklistItems: TravelChecklistItem[];
};

export type SyncMetadata = {
  id: "main";
  lastSuccessfulSyncAt: string | null;
  schemaVersion: number;
  lastError: string | null;
};

type StoredBabyProfile = BabyProfile & {
  id: "irati";
};

const currentSchemaVersion = 1;
const profileId = "irati";
const metadataId = "main";

class IratiOfflineDatabase extends Dexie {
  babyProfiles!: Table<StoredBabyProfile, string>;
  weightEntries!: Table<WeightEntry, string>;
  plannedVaccineDoses!: Table<PlannedVaccineDose, string>;
  appliedVaccineDoses!: Table<AppliedVaccineDose, string>;
  travelChecklistItems!: Table<TravelChecklistItem, string>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super("irati-offline");

    this.version(currentSchemaVersion).stores({
      appliedVaccineDoses: "id, plannedDoseId, appliedOn",
      babyProfiles: "id",
      plannedVaccineDoses: "id, plannedDate",
      syncMetadata: "id",
      travelChecklistItems: "id, category, sortOrder, isPacked",
      weightEntries: "id, measuredOn",
    });
  }
}

export const iratiOfflineDb = new IratiOfflineDatabase();

export async function replaceOfflineSnapshot(
  snapshot: OfflineSnapshot,
  syncedAt: string,
): Promise<void> {
  await iratiOfflineDb.transaction(
    "rw",
    [
      iratiOfflineDb.babyProfiles,
      iratiOfflineDb.weightEntries,
      iratiOfflineDb.plannedVaccineDoses,
      iratiOfflineDb.appliedVaccineDoses,
      iratiOfflineDb.travelChecklistItems,
      iratiOfflineDb.syncMetadata,
    ],
    async () => {
      await iratiOfflineDb.babyProfiles.clear();
      await iratiOfflineDb.weightEntries.clear();
      await iratiOfflineDb.plannedVaccineDoses.clear();
      await iratiOfflineDb.appliedVaccineDoses.clear();
      await iratiOfflineDb.travelChecklistItems.clear();

      if (snapshot.profile) {
        await iratiOfflineDb.babyProfiles.put({
          ...snapshot.profile,
          id: profileId,
        });
      }

      await iratiOfflineDb.weightEntries.bulkPut(snapshot.weightEntries);
      await iratiOfflineDb.plannedVaccineDoses.bulkPut(snapshot.plannedVaccineDoses);
      await iratiOfflineDb.appliedVaccineDoses.bulkPut(snapshot.appliedVaccineDoses);
      await iratiOfflineDb.travelChecklistItems.bulkPut(snapshot.travelChecklistItems);
      await iratiOfflineDb.syncMetadata.put({
        id: metadataId,
        lastError: null,
        lastSuccessfulSyncAt: syncedAt,
        schemaVersion: currentSchemaVersion,
      });
    },
  );
}

export async function readOfflineSnapshot(): Promise<OfflineSnapshot> {
  const [profile, weightEntries, plannedVaccineDoses, appliedVaccineDoses, travelChecklistItems] =
    await Promise.all([
      iratiOfflineDb.babyProfiles.get(profileId),
      iratiOfflineDb.weightEntries.orderBy("measuredOn").toArray(),
      iratiOfflineDb.plannedVaccineDoses.orderBy("plannedDate").toArray(),
      iratiOfflineDb.appliedVaccineDoses.orderBy("appliedOn").toArray(),
      iratiOfflineDb.travelChecklistItems.orderBy("sortOrder").toArray(),
    ]);

  return {
    appliedVaccineDoses,
    plannedVaccineDoses,
    profile: profile
      ? { birthDate: profile.birthDate, cipa: profile.cipa, name: profile.name }
      : null,
    travelChecklistItems,
    weightEntries,
  };
}

export async function readSyncMetadata(): Promise<SyncMetadata> {
  return (
    (await iratiOfflineDb.syncMetadata.get(metadataId)) ?? {
      id: metadataId,
      lastError: null,
      lastSuccessfulSyncAt: null,
      schemaVersion: currentSchemaVersion,
    }
  );
}

export async function clearOfflineData(): Promise<void> {
  await iratiOfflineDb.transaction(
    "rw",
    [
      iratiOfflineDb.babyProfiles,
      iratiOfflineDb.weightEntries,
      iratiOfflineDb.plannedVaccineDoses,
      iratiOfflineDb.appliedVaccineDoses,
      iratiOfflineDb.travelChecklistItems,
      iratiOfflineDb.syncMetadata,
    ],
    async () => {
      await iratiOfflineDb.babyProfiles.clear();
      await iratiOfflineDb.weightEntries.clear();
      await iratiOfflineDb.plannedVaccineDoses.clear();
      await iratiOfflineDb.appliedVaccineDoses.clear();
      await iratiOfflineDb.travelChecklistItems.clear();
      await iratiOfflineDb.syncMetadata.clear();
    },
  );
}
