import { describe, expect, it } from "vitest";
import {
  buildWhoWeightForAgeReferences,
  calculateAgeInDaysFromBirth,
  calculateWhoWeightForAgeGrams,
} from "./who-weight-for-age";

describe("WHO weight-for-age references", () => {
  it("calculates age in days from birth", () => {
    expect(calculateAgeInDaysFromBirth("2026-07-02", "2026-07-20")).toBe(18);
  });

  it("calculates selected girl weight percentiles from the official WHO table", () => {
    expect(calculateWhoWeightForAgeGrams(0, "P50")).toBe(3200);
    expect(calculateWhoWeightForAgeGrams(0, "P3")).toBe(2400);
    expect(calculateWhoWeightForAgeGrams(0, "P97")).toBe(4200);
  });

  it("builds all selected percentile curves for the visible age range", () => {
    const references = buildWhoWeightForAgeReferences(18);

    expect(new Set(references.map((point) => point.percentile))).toEqual(
      new Set(["P3", "P15", "P50", "P85", "P97"]),
    );
    expect(references.some((point) => point.ageDays === 0)).toBe(true);
    expect(references.some((point) => point.ageDays === 18)).toBe(true);
  });

  it("uses the WHO 5-to-10 reference after the first five years", () => {
    expect(calculateWhoWeightForAgeGrams(60 * (365.25 / 12), "P50")).toBe(18200);
    expect(calculateWhoWeightForAgeGrams(120 * (365.25 / 12), "P50")).toBe(31858);
  });
});
