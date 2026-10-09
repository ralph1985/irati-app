import { describe, expect, it } from "vitest";
import {
  calculateTravelChecklistProgress,
  TravelChecklistItem,
  TravelPackingStatus,
} from "./travel-checklist-item";

describe("travel packing status", () => {
  it("counts prepared, not taking and pending items separately", () => {
    expect(
      calculateTravelChecklistProgress([item("packed"), item("not_taking"), item("pending")]),
    ).toEqual({
      packed: 1,
      notTaking: 1,
      pending: 1,
      total: 3,
    });
  });
});

function item(packingStatus: TravelPackingStatus): TravelChecklistItem {
  return {
    id: packingStatus,
    label: packingStatus,
    category: "higiene",
    sortOrder: 10,
    packingStatus,
    notes: null,
    storageLocationId: null,
    storageSortOrder: null,
  };
}
