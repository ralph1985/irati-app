import { describe, expect, it } from "vitest";
import {
  filterWeightEntries,
  getWeightPlaceFilters,
  toggleWeightPlaceFilter,
  weightFilterHref,
} from "./weight-filter";
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
  {
    id: "4",
    measuredOn: "2026-07-11",
    weightGrams: 3000,
    place: "enfermeria",
    notes: null,
  },
];

describe("filterWeightEntries", () => {
  it("returns all entries for the all filter", () => {
    expect(filterWeightEntries(entries, [])).toHaveLength(4);
  });

  it("filters entries by one or several places", () => {
    expect(filterWeightEntries(entries, ["hospital"])).toEqual([entries[0]]);
    expect(filterWeightEntries(entries, ["pediatra"])).toEqual([entries[1]]);
    expect(filterWeightEntries(entries, ["farmacia"])).toEqual([entries[2]]);
    expect(filterWeightEntries(entries, ["enfermeria"])).toEqual([entries[3]]);
    expect(filterWeightEntries(entries, ["hospital", "farmacia"])).toEqual([
      entries[0],
      entries[2],
    ]);
    expect(filterWeightEntries(entries, [])).toHaveLength(4);
  });
});

describe("getWeightPlaceFilters", () => {
  it("keeps valid repeated values, removing invalid and duplicate values", () => {
    expect(getWeightPlaceFilters(["hospital", "casa", "hospital", "farmacia"])).toEqual([
      "hospital",
      "farmacia",
    ]);
  });

  it("returns no selected places for an absent value", () => {
    expect(getWeightPlaceFilters(undefined)).toEqual([]);
  });
});

describe("toggleWeightPlaceFilter", () => {
  it("adds and removes places without turning all into a separate selection", () => {
    expect(toggleWeightPlaceFilter([], "hospital")).toEqual(["hospital"]);
    expect(toggleWeightPlaceFilter(["hospital"], "farmacia")).toEqual(["hospital", "farmacia"]);
    expect(toggleWeightPlaceFilter(["hospital", "farmacia"], "hospital")).toEqual(["farmacia"]);
    expect(toggleWeightPlaceFilter(["hospital"], "hospital")).toEqual([]);
  });
});

describe("weightFilterHref", () => {
  it("serializes multiple places as repeatable query parameters", () => {
    expect(weightFilterHref(["hospital", "farmacia"])).toBe("/peso?lugar=hospital&lugar=farmacia");
    expect(weightFilterHref([])).toBe("/peso");
  });
});
