import Dexie, { type Table } from "dexie";
import type { BabyProfile } from "@/modules/profile/domain/baby-profile";
import type { TravelChecklistItem } from "@/modules/travel/domain/travel-checklist-item";
import type { PendingVaccineMutation as PendingVaccineMutationPayload } from "@/modules/vaccines/application/vaccine-offline-conflicts";
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

export type PendingWeightMutationOperation = "create" | "update" | "delete";

export type PendingWeightMutation = {
  id: string;
  entity: "weight";
  operation: PendingWeightMutationOperation;
  payload: WeightEntry | { id: string };
  createdAt: string;
  lastError: string | null;
};

export type PendingTravelMutationOperation = "create" | "update" | "setPacked" | "delete" | "reset";

export type PendingTravelMutation = {
  id: string;
  entity: "travel";
  operation: PendingTravelMutationOperation;
  payload: TravelChecklistItem | { id: string; isPacked?: boolean } | { resetAt: string };
  createdAt: string;
  lastError: string | null;
};

export type PendingVaccineMutation = PendingVaccineMutationPayload & {
  id: string;
  entity: "vaccine";
  createdAt: string;
  lastError: string | null;
};

export type PendingMutation =
  PendingWeightMutation | PendingTravelMutation | PendingVaccineMutation;

type StoredBabyProfile = BabyProfile & {
  id: "irati";
};

const currentSchemaVersion = 3;
const profileId = "irati";
const metadataId = "main";

class IratiOfflineDatabase extends Dexie {
  babyProfiles!: Table<StoredBabyProfile, string>;
  weightEntries!: Table<WeightEntry, string>;
  plannedVaccineDoses!: Table<PlannedVaccineDose, string>;
  appliedVaccineDoses!: Table<AppliedVaccineDose, string>;
  travelChecklistItems!: Table<TravelChecklistItem, string>;
  syncMetadata!: Table<SyncMetadata, string>;
  pendingMutations!: Table<PendingMutation, string>;

  constructor() {
    super("irati-offline");

    this.version(currentSchemaVersion).stores({
      appliedVaccineDoses: "id, plannedDoseId, appliedOn",
      babyProfiles: "id",
      pendingMutations: "id, entity, operation, createdAt",
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
      iratiOfflineDb.pendingMutations,
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

export async function recordOfflineSyncError(error: string): Promise<void> {
  const currentMetadata = await readSyncMetadata();

  await iratiOfflineDb.syncMetadata.put({
    ...currentMetadata,
    id: metadataId,
    lastError: error,
    schemaVersion: currentSchemaVersion,
  });
}

export async function enqueuePendingWeightMutation(
  mutation: Omit<PendingWeightMutation, "createdAt" | "entity" | "lastError"> &
    Partial<Pick<PendingWeightMutation, "createdAt" | "lastError">>,
): Promise<void> {
  await iratiOfflineDb.pendingMutations.put({
    ...mutation,
    createdAt: mutation.createdAt ?? new Date().toISOString(),
    entity: "weight",
    lastError: mutation.lastError ?? null,
  });
}

export async function enqueuePendingTravelMutation(
  mutation: Omit<PendingTravelMutation, "createdAt" | "entity" | "lastError"> &
    Partial<Pick<PendingTravelMutation, "createdAt" | "lastError">>,
): Promise<void> {
  await iratiOfflineDb.pendingMutations.put({
    ...mutation,
    createdAt: mutation.createdAt ?? new Date().toISOString(),
    entity: "travel",
    lastError: mutation.lastError ?? null,
  });
}

export async function enqueuePendingVaccineMutation(
  mutation: Omit<PendingVaccineMutation, "createdAt" | "entity" | "lastError"> &
    Partial<Pick<PendingVaccineMutation, "createdAt" | "lastError">>,
): Promise<void> {
  const pendingMutation = {
    ...mutation,
    createdAt: mutation.createdAt ?? new Date().toISOString(),
    entity: "vaccine",
    lastError: mutation.lastError ?? null,
  } as PendingVaccineMutation;

  await iratiOfflineDb.pendingMutations.put(pendingMutation);
}

export async function applyOfflineWeightEntry(entry: WeightEntry): Promise<void> {
  await iratiOfflineDb.weightEntries.put(entry);
}

export async function deleteOfflineWeightEntry(id: string): Promise<void> {
  await iratiOfflineDb.weightEntries.delete(id);
}

export async function listPendingWeightMutations(): Promise<PendingWeightMutation[]> {
  const mutations = await iratiOfflineDb.pendingMutations
    .where("entity")
    .equals("weight")
    .sortBy("createdAt");

  return mutations.filter(
    (mutation): mutation is PendingWeightMutation => mutation.entity === "weight",
  );
}

export async function applyOfflineTravelChecklistItem(item: TravelChecklistItem): Promise<void> {
  await iratiOfflineDb.travelChecklistItems.put(item);
}

export async function applyOfflinePlannedVaccineDose(dose: PlannedVaccineDose): Promise<void> {
  await iratiOfflineDb.plannedVaccineDoses.put(dose);
}

export async function applyOfflineAppliedVaccineDose(dose: AppliedVaccineDose): Promise<void> {
  await iratiOfflineDb.appliedVaccineDoses.put(dose);
}

export async function deleteOfflineAppliedVaccineDose(id: string): Promise<void> {
  await iratiOfflineDb.appliedVaccineDoses.delete(id);
}

export async function setOfflineTravelChecklistItemPacked(
  id: string,
  isPacked: boolean,
): Promise<void> {
  await iratiOfflineDb.travelChecklistItems.update(id, {
    isPacked,
  });
}

export async function deleteOfflineTravelChecklistItem(id: string): Promise<void> {
  await iratiOfflineDb.travelChecklistItems.delete(id);
}

export async function resetOfflineTravelChecklist(): Promise<void> {
  const items = await iratiOfflineDb.travelChecklistItems.toArray();

  await iratiOfflineDb.travelChecklistItems.bulkPut(
    items.map((item) => ({
      ...item,
      isPacked: false,
    })),
  );
}

export async function listPendingTravelMutations(): Promise<PendingTravelMutation[]> {
  const mutations = await iratiOfflineDb.pendingMutations
    .where("entity")
    .equals("travel")
    .sortBy("createdAt");

  return mutations.filter(
    (mutation): mutation is PendingTravelMutation => mutation.entity === "travel",
  );
}

export async function listPendingVaccineMutations(): Promise<PendingVaccineMutation[]> {
  const mutations = await iratiOfflineDb.pendingMutations
    .where("entity")
    .equals("vaccine")
    .sortBy("createdAt");

  return mutations.filter(
    (mutation): mutation is PendingVaccineMutation => mutation.entity === "vaccine",
  );
}

export async function markPendingMutationError(id: string, error: string): Promise<void> {
  await iratiOfflineDb.pendingMutations.update(id, {
    lastError: error,
  });
}

export async function removePendingMutation(id: string): Promise<void> {
  await iratiOfflineDb.pendingMutations.delete(id);
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
      iratiOfflineDb.pendingMutations,
    ],
    async () => {
      await iratiOfflineDb.babyProfiles.clear();
      await iratiOfflineDb.weightEntries.clear();
      await iratiOfflineDb.plannedVaccineDoses.clear();
      await iratiOfflineDb.appliedVaccineDoses.clear();
      await iratiOfflineDb.travelChecklistItems.clear();
      await iratiOfflineDb.syncMetadata.clear();
      await iratiOfflineDb.pendingMutations.clear();
    },
  );
}
