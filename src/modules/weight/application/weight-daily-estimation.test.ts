import { describe, expect, it } from "vitest";
import { buildWeightDailyEstimates } from "./weight-daily-estimation";

describe("buildWeightDailyEstimates", () => {
  it("sorts entries and estimates the daily change for each interval", () => {
    const estimates = buildWeightDailyEstimates([
      { id: "2", measuredOn: "2026-07-10", weightGrams: 2935, place: "farmacia" },
      { id: "1", measuredOn: "2026-07-07", weightGrams: 2660, place: "hospital" },
      { id: "3", measuredOn: "2026-07-13", weightGrams: 3020, place: "pediatra" },
    ]);

    expect(estimates).toEqual([
      {
        days: 3,
        differenceGrams: 275,
        endDate: "2026-07-10",
        gramsPerDay: 91.66666666666667,
        startDate: "2026-07-07",
      },
      {
        days: 3,
        differenceGrams: 85,
        endDate: "2026-07-13",
        gramsPerDay: 28.333333333333332,
        startDate: "2026-07-10",
      },
    ]);
  });

  it("returns no estimate with fewer than two entries", () => {
    expect(buildWeightDailyEstimates([])).toEqual([]);
    expect(
      buildWeightDailyEstimates([
        { id: "1", measuredOn: "2026-07-10", weightGrams: 2935, place: "farmacia" },
      ]),
    ).toEqual([]);
  });
});
