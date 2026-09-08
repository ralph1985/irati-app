import { describe, expect, it } from "vitest";
import { buildWhoGrowthReferences, calculateWhoGrowthValueCm } from "./who-growth-references";

describe("WHO growth references", () => {
  it("uses the official girl height and head circumference anchors", () => {
    expect(calculateWhoGrowthValueCm(0, "height", "P50")).toBe(49.148);
    expect(calculateWhoGrowthValueCm(0, "headCircumference", "P50")).toBe(33.879);
    expect(calculateWhoGrowthValueCm(12 * (365.25 / 12), "height", "P50")).toBe(74.005);
  });

  it("builds all five curves and caps them at five years", () => {
    const references = buildWhoGrowthReferences("height", 120 * (365.25 / 12));
    expect(new Set(references.map((point) => point.percentile))).toEqual(
      new Set(["P3", "P15", "P50", "P85", "P97"]),
    );
    expect(references.every((point) => point.ageDays <= Math.round(60 * (365.25 / 12)))).toBe(true);
  });
});
