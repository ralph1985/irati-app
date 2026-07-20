import { describe, expect, it } from "vitest";
import { buildWeightTrendSummary } from "./weight-trend-summary";
import { WeightEntry } from "../domain/weight-entry";

describe("buildWeightTrendSummary", () => {
  it("returns an empty summary without entries", () => {
    expect(buildWeightTrendSummary([], new Date("2026-07-20T00:00:00.000Z"))).toMatchObject({
      averageGramsPerDay: null,
      daysBetweenLastEntries: null,
      daysSinceLatest: null,
      differenceGrams: null,
      latest: null,
      previous: null,
      totalEntries: 0,
    });
  });

  it("reports the latest entry without trend when there is only one entry", () => {
    const summary = buildWeightTrendSummary(
      [entry({ measuredOn: "2026-07-18", weightGrams: 3200 })],
      new Date("2026-07-20T00:00:00.000Z"),
    );

    expect(summary.latest?.weightGrams).toBe(3200);
    expect(summary.daysSinceLatest).toBe(2);
    expect(summary.previous).toBeNull();
    expect(summary.differenceGrams).toBeNull();
  });

  it("sorts entries and calculates difference and average grams per day", () => {
    const summary = buildWeightTrendSummary(
      [
        entry({ measuredOn: "2026-07-20", weightGrams: 3400 }),
        entry({ measuredOn: "2026-07-16", weightGrams: 3200 }),
      ],
      new Date("2026-07-20T00:00:00.000Z"),
    );

    expect(summary.latest?.measuredOn).toBe("2026-07-20");
    expect(summary.previous?.measuredOn).toBe("2026-07-16");
    expect(summary.daysBetweenLastEntries).toBe(4);
    expect(summary.differenceGrams).toBe(200);
    expect(summary.averageGramsPerDay).toBe(50);
  });
});

function entry(overrides: Partial<WeightEntry>): WeightEntry {
  return {
    id: "weight",
    measuredOn: "2026-07-18",
    notes: null,
    place: "pediatra",
    weightGrams: 3200,
    ...overrides,
  };
}
