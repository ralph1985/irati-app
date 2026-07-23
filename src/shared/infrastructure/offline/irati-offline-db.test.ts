import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  clearOfflineData,
  readOfflineSnapshot,
  readSyncMetadata,
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
      schemaVersion: 1,
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
      schemaVersion: 1,
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
});
