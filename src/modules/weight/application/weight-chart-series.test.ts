import { describe, expect, it } from "vitest";
import {
  buildWeightChartAreaPath,
  buildWeightChartPath,
  buildWeightChartSeries,
} from "./weight-chart-series";

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
    expect(series.points[0].x).toBeLessThan(series.points[1].x);
    expect(series.ticks).toHaveLength(3);
    expect(buildWeightChartPath(series.points)).toContain("M");
    expect(buildWeightChartPath(series.points)).toContain("C");
    expect(buildWeightChartAreaPath(series.points)).toContain("Z");
  });

  it("returns an empty series without entries", () => {
    expect(buildWeightChartSeries([]).points).toEqual([]);
  });

  it("centers one entry and keeps a readable display range", () => {
    const series = buildWeightChartSeries([
      {
        id: "1",
        measuredOn: "2026-07-02",
        weightGrams: 2700,
        place: "hospital",
      },
    ]);

    expect(series.points).toHaveLength(1);
    expect(series.points[0].x).toBeGreaterThan(100);
    expect(series.points[0].x).toBeLessThan(240);
    expect(series.minDisplayWeight).toBeLessThan(2700);
    expect(series.maxDisplayWeight).toBeGreaterThan(2700);
    expect(buildWeightChartPath(series.points)).toBe("");
    expect(buildWeightChartAreaPath(series.points)).toBe("");
  });
});
