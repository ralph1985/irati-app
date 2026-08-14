import { describe, expect, it } from "vitest";
import {
  calculateTravelChecklistProgress,
  createTravelChecklistItem,
  groupTravelChecklistItems,
  reorderTravelChecklistItems,
  sortTravelChecklistItems,
  TravelChecklistItem,
  TravelChecklistItemValidationError,
} from "./travel-checklist-item";

describe("travel checklist item", () => {
  it("normalizes valid items", () => {
    expect(
      createTravelChecklistItem({
        label: " Pañales ",
        category: "higiene",
        sortOrder: 10,
        notes: "  Talla 1  ",
      }),
    ).toEqual({
      label: "Pañales",
      category: "higiene",
      sortOrder: 10,
      isPacked: false,
      notes: "Talla 1",
    });
  });

  it("rejects invalid items", () => {
    expect(() =>
      createTravelChecklistItem({
        label: "",
        category: "higiene",
        sortOrder: -1,
      }),
    ).toThrow(TravelChecklistItemValidationError);
  });

  it("calculates progress", () => {
    expect(
      calculateTravelChecklistProgress([
        item({ id: "item-1", isPacked: true }),
        item({ id: "item-2", isPacked: false }),
      ]),
    ).toEqual({
      packed: 1,
      pending: 1,
      total: 2,
    });
  });

  it("keeps the manual order regardless of packed state", () => {
    expect(
      sortTravelChecklistItems([
        item({ id: "packed", label: "B", isPacked: true, sortOrder: 10 }),
        item({ id: "pending", label: "A", isPacked: false, sortOrder: 20 }),
      ]).map((entry) => entry.id),
    ).toEqual(["packed", "pending"]);
  });

  it("reorders an item within and across categories", () => {
    const items = [
      item({ id: "one", category: "higiene", sortOrder: 10 }),
      item({ id: "two", category: "higiene", sortOrder: 20 }),
      item({ id: "three", category: "salud", sortOrder: 10 }),
    ];

    const reordered = reorderTravelChecklistItems(items, "one", "salud", 1);

    expect(reordered).toEqual([
      expect.objectContaining({ id: "two", category: "higiene", sortOrder: 10 }),
      expect.objectContaining({ id: "three", category: "salud", sortOrder: 10 }),
      expect.objectContaining({ id: "one", category: "salud", sortOrder: 20 }),
    ]);
  });

  it("groups items by category", () => {
    const groups = groupTravelChecklistItems([
      item({ id: "food", category: "comida", isPacked: true }),
      item({ id: "walk", category: "paseo", isPacked: false }),
    ]);

    expect(groups.find((group) => group.category === "comida")?.progress).toEqual({
      packed: 1,
      pending: 0,
      total: 1,
    });
    expect(groups.find((group) => group.category === "paseo")?.items[0]?.id).toBe("walk");
  });
});

function item(overrides: Partial<TravelChecklistItem>): TravelChecklistItem {
  return {
    id: "item",
    label: "Pañales",
    category: "higiene",
    sortOrder: 10,
    isPacked: false,
    notes: null,
    ...overrides,
  };
}
