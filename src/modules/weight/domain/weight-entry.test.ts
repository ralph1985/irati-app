import { describe, expect, it } from "vitest";
import { createWeightEntry, isWeightPlace, WeightEntryValidationError } from "./weight-entry";

describe("createWeightEntry", () => {
  it("creates a valid weight entry", () => {
    expect(
      createWeightEntry({
        measuredOn: "2026-07-17",
        weightGrams: 3200,
        place: "pediatra",
        notes: "  control semanal  ",
      }),
    ).toEqual({
      measuredOn: "2026-07-17",
      weightGrams: 3200,
      place: "pediatra",
      notes: "control semanal",
    });
  });

  it("rejects invalid data", () => {
    expect(() =>
      createWeightEntry({
        measuredOn: "2026-99-99",
        weightGrams: 200,
        place: "farmacia",
      }),
    ).toThrow(WeightEntryValidationError);
  });
});

describe("isWeightPlace", () => {
  it("accepts supported places", () => {
    expect(isWeightPlace("hospital")).toBe(true);
    expect(isWeightPlace("pediatra")).toBe(true);
    expect(isWeightPlace("farmacia")).toBe(true);
  });

  it("rejects unsupported places", () => {
    expect(isWeightPlace("casa")).toBe(false);
  });
});
