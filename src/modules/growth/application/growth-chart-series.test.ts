import { describe, expect, it } from "vitest";
import {
  buildGrowthChartAreaPath,
  buildGrowthChartPath,
  buildGrowthChartSeries,
} from "./growth-chart-series";

describe("buildGrowthChartSeries", () => {
  it("sorts height entries, draws references and keeps values in centimeters", () => {
    const series = buildGrowthChartSeries(
      [
        { heightCm: 58, id: "2", measuredOn: "2026-09-09", place: "pediatra" },
        { heightCm: 57, id: "1", measuredOn: "2026-09-08", place: "pediatra" },
      ],
      "2026-07-02",
      "height",
    );

    expect(series.points.map((point) => point.valueCm)).toEqual([57, 58]);
    expect(series.referenceCurves.map((curve) => curve.label)).toEqual([
      "P3",
      "P15",
      "P50",
      "P85",
      "P97",
    ]);
    expect(buildGrowthChartPath(series.points)).toContain("M");
    expect(buildGrowthChartAreaPath(series.points)).toContain("Z");
  });

  it("supports an empty series and fixed age ranges", () => {
    expect(buildGrowthChartSeries([], "2026-07-02", "height").points).toEqual([]);
    const series = buildGrowthChartSeries(
      [{ headCircumferenceCm: 39, id: "1", measuredOn: "2026-07-02", place: "pediatra" }],
      "2026-07-02",
      "headCircumference",
      "twoYears",
    );
    expect(series.points[0].x).toBe(42);
    expect(series.referenceCurves.every((curve) => curve.points.at(-1)?.ageDays === 731)).toBe(
      true,
    );
  });
});
