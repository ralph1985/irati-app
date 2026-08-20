import { describe, expect, it } from "vitest";
import { WeightEntry } from "../domain/weight-entry";
import { buildWeightHistory } from "./weight-history";

describe("buildWeightHistory", () => {
  it("sorts entries and calculates change and daily average", () => {
    const rows = buildWeightHistory([
      entry({ measuredOn: "2026-07-21", weightGrams: 3400 }),
      entry({ id: "weight-1", measuredOn: "2026-07-17", weightGrams: 3200 }),
    ]);

    expect(rows[0]).toMatchObject({
      entry: { measuredOn: "2026-07-21" },
      differenceGrams: 200,
      averageGramsPerDay: 50,
    });
    expect(rows[1]).toMatchObject({
      entry: { measuredOn: "2026-07-17" },
      differenceGrams: null,
      averageGramsPerDay: null,
    });
  });

  it("keeps the change but omits the daily average for the same date", () => {
    const rows = buildWeightHistory([
      entry({ measuredOn: "2026-07-17", weightGrams: 3400 }),
      entry({ id: "weight-1", measuredOn: "2026-07-17", weightGrams: 3200 }),
    ]);

    expect(rows[0]).toMatchObject({ differenceGrams: -200, averageGramsPerDay: null });
  });
});

function entry(overrides: Partial<WeightEntry>): WeightEntry {
  return {
    id: "weight-2",
    measuredOn: "2026-07-18",
    notes: null,
    place: "pediatra",
    weightGrams: 3200,
    ...overrides,
  };
}
