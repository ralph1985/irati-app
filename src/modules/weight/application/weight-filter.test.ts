import { describe, expect, it } from "vitest";
import { filterWeightEntries, isWeightFilter } from "./weight-filter";
import { WeightEntry } from "../domain/weight-entry";

const entries: WeightEntry[] = [
  {
    id: "1",
    measuredOn: "2026-07-02",
    weightGrams: 2700,
    place: "hospital",
    notes: null,
  },
  {
    id: "2",
    measuredOn: "2026-07-09",
    weightGrams: 2800,
    place: "pediatra",
    notes: null,
  },
  {
    id: "3",
    measuredOn: "2026-07-10",
    weightGrams: 2935,
    place: "farmacia",
    notes: null,
  },
];

describe("filterWeightEntries", () => {
  it("returns all entries for the all filter", () => {
    expect(filterWeightEntries(entries, "all")).toHaveLength(3);
  });

  it("filters entries by place", () => {
    expect(filterWeightEntries(entries, "hospital")).toEqual([entries[0]]);
    expect(filterWeightEntries(entries, "pediatra")).toEqual([entries[1]]);
    expect(filterWeightEntries(entries, "farmacia")).toEqual([entries[2]]);
  });
});

describe("isWeightFilter", () => {
  it("accepts supported filter values", () => {
    expect(isWeightFilter("all")).toBe(true);
    expect(isWeightFilter("hospital")).toBe(true);
  });

  it("rejects unsupported filter values", () => {
    expect(isWeightFilter("casa")).toBe(false);
  });
});
