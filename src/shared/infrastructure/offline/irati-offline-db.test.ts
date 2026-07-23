import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyOfflineWeightEntry,
  applyOfflineTravelChecklistItem,
  clearOfflineData,
  deleteOfflineTravelChecklistItem,
  deleteOfflineWeightEntry,
  enqueuePendingTravelMutation,
  enqueuePendingWeightMutation,
  listPendingTravelMutations,
  listPendingWeightMutations,
  markPendingMutationError,
  readOfflineSnapshot,
  readSyncMetadata,
  recordOfflineSyncError,
  removePendingMutation,
  replaceOfflineSnapshot,
} from "./irati-offline-db";

afterEach(async () => {
  await clearOfflineData();
});

describe("Irati offline database", () => {
  it("starts with an empty snapshot and no sync timestamp", async () => {
    await expect(readOfflineSnapshot()).resolves.toEqual({
      appliedVaccineDoses: [],
      plannedVaccineDoses: [],
      profile: null,
      travelChecklistItems: [],
      weightEntries: [],
    });
    await expect(readSyncMetadata()).resolves.toMatchObject({
      lastError: null,
      lastSuccessfulSyncAt: null,
      schemaVersion: 3,
    });
  });

  it("replaces the full offline snapshot and records sync metadata", async () => {
    await replaceOfflineSnapshot(
      {
        appliedVaccineDoses: [
          {
            appliedOn: "2026-09-02",
            doseLabel: "1 dosis",
            id: "applied-1",
            lot: "A1",
            notes: null,
            place: "Centro de salud",
            plannedDoseId: "planned-1",
            vaccineName: "Hexavalente",
          },
        ],
        plannedVaccineDoses: [
          {
            ageLabel: "2 meses",
            doseLabel: "1 dosis",
            id: "planned-1",
            notes: null,
            plannedDate: "2026-09-02",
            vaccineName: "Hexavalente",
          },
        ],
        profile: {
          birthDate: "2026-07-02",
          cipa: "1234567890",
          name: "Irati",
        },
        travelChecklistItems: [
          {
            category: "salud",
            id: "travel-1",
            isPacked: false,
            label: "Cartilla",
            notes: null,
            sortOrder: 10,
          },
        ],
        weightEntries: [
          {
            id: "weight-1",
            measuredOn: "2026-07-10",
            notes: null,
            place: "pediatra",
            weightGrams: 3300,
          },
        ],
      },
      "2026-07-23T10:00:00.000Z",
    );

    await expect(readOfflineSnapshot()).resolves.toMatchObject({
      appliedVaccineDoses: [{ id: "applied-1" }],
      plannedVaccineDoses: [{ id: "planned-1" }],
      profile: { name: "Irati" },
      travelChecklistItems: [{ id: "travel-1" }],
      weightEntries: [{ id: "weight-1" }],
    });
    await expect(readSyncMetadata()).resolves.toMatchObject({
      lastSuccessfulSyncAt: "2026-07-23T10:00:00.000Z",
      schemaVersion: 3,
    });
  });

  it("clears local data for logout", async () => {
    await replaceOfflineSnapshot(
      {
        appliedVaccineDoses: [],
        plannedVaccineDoses: [],
        profile: { birthDate: "2026-07-02", cipa: null, name: "Irati" },
        travelChecklistItems: [],
        weightEntries: [],
      },
      "2026-07-23T10:00:00.000Z",
    );

    await clearOfflineData();

    await expect(readOfflineSnapshot()).resolves.toEqual({
      appliedVaccineDoses: [],
      plannedVaccineDoses: [],
      profile: null,
      travelChecklistItems: [],
      weightEntries: [],
    });
    await expect(readSyncMetadata()).resolves.toMatchObject({
      lastSuccessfulSyncAt: null,
    });
  });

  it("records sync errors without deleting the latest successful snapshot", async () => {
    await replaceOfflineSnapshot(
      {
        appliedVaccineDoses: [],
        plannedVaccineDoses: [],
        profile: { birthDate: "2026-07-02", cipa: null, name: "Irati" },
        travelChecklistItems: [],
        weightEntries: [],
      },
      "2026-07-23T10:00:00.000Z",
    );

    await recordOfflineSyncError("No pudimos actualizar la copia local.");

    await expect(readSyncMetadata()).resolves.toMatchObject({
      lastError: "No pudimos actualizar la copia local.",
      lastSuccessfulSyncAt: "2026-07-23T10:00:00.000Z",
    });
    await expect(readOfflineSnapshot()).resolves.toMatchObject({
      profile: { name: "Irati" },
    });
  });

  it("queues pending weight mutations in creation order", async () => {
    await enqueuePendingWeightMutation({
      createdAt: "2026-07-23T10:01:00.000Z",
      id: "mutation-2",
      operation: "delete",
      payload: { id: "weight-1" },
    });
    await enqueuePendingWeightMutation({
      createdAt: "2026-07-23T10:00:00.000Z",
      id: "mutation-1",
      operation: "create",
      payload: {
        id: "weight-1",
        measuredOn: "2026-07-10",
        notes: null,
        place: "pediatra",
        weightGrams: 3300,
      },
    });

    await expect(listPendingWeightMutations()).resolves.toMatchObject([
      { id: "mutation-1", operation: "create" },
      { id: "mutation-2", operation: "delete" },
    ]);
  });

  it("applies optimistic weight changes to the local snapshot", async () => {
    await applyOfflineWeightEntry({
      id: "weight-1",
      measuredOn: "2026-07-10",
      notes: null,
      place: "pediatra",
      weightGrams: 3300,
    });

    await expect(readOfflineSnapshot()).resolves.toMatchObject({
      weightEntries: [{ id: "weight-1", weightGrams: 3300 }],
    });

    await deleteOfflineWeightEntry("weight-1");

    await expect(readOfflineSnapshot()).resolves.toMatchObject({
      weightEntries: [],
    });
  });

  it("keeps failed pending weight mutations visible until they are removed", async () => {
    await enqueuePendingWeightMutation({
      id: "mutation-1",
      operation: "delete",
      payload: { id: "weight-1" },
    });

    await markPendingMutationError("mutation-1", "Supabase rejected the mutation.");

    await expect(listPendingWeightMutations()).resolves.toMatchObject([
      {
        id: "mutation-1",
        lastError: "Supabase rejected the mutation.",
      },
    ]);

    await removePendingMutation("mutation-1");

    await expect(listPendingWeightMutations()).resolves.toEqual([]);
  });

  it("queues pending travel mutations in creation order", async () => {
    await enqueuePendingTravelMutation({
      createdAt: "2026-07-23T10:01:00.000Z",
      id: "travel-mutation-2",
      operation: "delete",
      payload: { id: "travel-1" },
    });
    await enqueuePendingTravelMutation({
      createdAt: "2026-07-23T10:00:00.000Z",
      id: "travel-mutation-1",
      operation: "create",
      payload: {
        category: "salud",
        id: "travel-1",
        isPacked: false,
        label: "Cartilla",
        notes: null,
        sortOrder: 10,
      },
    });

    await expect(listPendingTravelMutations()).resolves.toMatchObject([
      { id: "travel-mutation-1", operation: "create" },
      { id: "travel-mutation-2", operation: "delete" },
    ]);
  });

  it("applies optimistic travel changes to the local snapshot", async () => {
    await applyOfflineTravelChecklistItem({
      category: "salud",
      id: "travel-1",
      isPacked: false,
      label: "Cartilla",
      notes: null,
      sortOrder: 10,
    });

    await expect(readOfflineSnapshot()).resolves.toMatchObject({
      travelChecklistItems: [{ id: "travel-1", label: "Cartilla" }],
    });

    await deleteOfflineTravelChecklistItem("travel-1");

    await expect(readOfflineSnapshot()).resolves.toMatchObject({
      travelChecklistItems: [],
    });
  });
});
