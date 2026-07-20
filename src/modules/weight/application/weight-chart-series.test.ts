import { describe, expect, it } from "vitest";
import {
  buildWeightChartAreaPath,
  buildWeightChartPath,
  buildWeightChartSeries,
} from "./weight-chart-series";

describe("buildWeightChartSeries", () => {
  it("sorts entries by date and maps them to chart points", () => {
    const series = buildWeightChartSeries(
      [
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
      ],
      "2026-07-02",
    );

    expect(series.minWeight).toBe(2520);
    expect(series.maxWeight).toBe(2700);
    expect(series.points.map((point) => point.date)).toEqual(["2026-07-02", "2026-07-04"]);
    expect(series.points[0].x).toBeLessThan(series.points[1].x);
    expect(series.referenceCurves.map((curve) => curve.label)).toEqual([
      "P3",
      "P15",
      "P50",
      "P85",
      "P97",
    ]);
    expect(series.ticks).toHaveLength(3);
    expect(buildWeightChartPath(series.points)).toContain("M");
    expect(buildWeightChartPath(series.points)).toContain("C");
    expect(buildWeightChartAreaPath(series.points)).toContain("Z");
  });

  it("returns an empty series without entries", () => {
    expect(buildWeightChartSeries([], "2026-07-02").points).toEqual([]);
  });

  it("places one entry by age and keeps a readable display range", () => {
    const series = buildWeightChartSeries(
      [
        {
          id: "1",
          measuredOn: "2026-07-02",
          weightGrams: 2700,
          place: "hospital",
        },
      ],
      "2026-07-02",
    );

    expect(series.points).toHaveLength(1);
    expect(series.points[0].ageDays).toBe(0);
    expect(series.points[0].x).toBe(42);
    expect(series.minDisplayWeight).toBeLessThan(2700);
    expect(series.maxDisplayWeight).toBeGreaterThan(2700);
    expect(buildWeightChartPath(series.points)).toBe("");
    expect(buildWeightChartAreaPath(series.points)).toBe("");
  });
});
