import { describe, expect, it } from "vitest";
import { updateWeightEntry } from "./update-weight-entry";
import { WeightRepository } from "./weight-repository";

describe("updateWeightEntry", () => {
  it("validates and updates a weight entry", async () => {
    const repository: WeightRepository = {
      async listWeightEntries() {
        return [];
      },
      async createWeightEntry(entry) {
        return {
          id: "created",
          ...entry,
        };
      },
      async updateWeightEntry(id, entry) {
        return {
          id,
          ...entry,
        };
      },
      async deleteWeightEntry() {},
    };

    await expect(
      updateWeightEntry(repository, "weight-1", {
        measuredOn: "2026-07-18",
        weightGrams: 3300,
        place: "pediatra",
      }),
    ).resolves.toEqual({
      id: "weight-1",
      measuredOn: "2026-07-18",
      weightGrams: 3300,
      place: "pediatra",
      notes: null,
    });
  });
});
