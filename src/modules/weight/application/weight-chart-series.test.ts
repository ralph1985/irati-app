import { describe, expect, it } from "vitest";
import { buildWeightChartPath, buildWeightChartSeries } from "./weight-chart-series";

describe("buildWeightChartSeries", () => {
  it("sorts entries by date and maps them to chart points", () => {
    const series = buildWeightChartSeries([
      {
        id: "2",
        measuredOn: "2026-07-04",
        weightGrams: 2520,
        place: "hospital",
      },
      {
        id: "1",
        measuredOn: "2026-07-02",
        weightGrams: 2700,
        place: "hospital",
      },
    ]);

    expect(series.minWeight).toBe(2520);
    expect(series.maxWeight).toBe(2700);
    expect(series.points.map((point) => point.date)).toEqual(["2026-07-02", "2026-07-04"]);
    expect(buildWeightChartPath(series.points)).toContain("M");
  });

  it("returns an empty series without entries", () => {
    expect(buildWeightChartSeries([]).points).toEqual([]);
  });
});
