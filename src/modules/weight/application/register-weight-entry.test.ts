import { describe, expect, it } from "vitest";
import { registerWeightEntry } from "./register-weight-entry";
import { WeightRepository } from "./weight-repository";

describe("registerWeightEntry", () => {
  it("validates and stores a weight entry", async () => {
    const repository: WeightRepository = {
      async listWeightEntries() {
        return [];
      },
      async createWeightEntry(entry) {
        return {
          id: "weight-1",
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
      registerWeightEntry(repository, {
        measuredOn: "2026-07-17",
        weightGrams: 3200,
        place: "farmacia",
      }),
    ).resolves.toEqual({
      id: "weight-1",
      measuredOn: "2026-07-17",
      weightGrams: 3200,
      place: "farmacia",
      notes: null,
    });
  });
});
