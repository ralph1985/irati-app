import { describe, expect, it } from "vitest";
import { createTravelChecklistItem } from "./create-travel-checklist-item";
import { deleteTravelChecklistItem } from "./delete-travel-checklist-item";
import { listTravelChecklist } from "./list-travel-checklist";
import { resetTravelChecklist } from "./reset-travel-checklist";
import { setTravelChecklistItemPacked } from "./set-travel-checklist-item-packed";
import { TravelChecklistRepository } from "./travel-checklist-repository";
import { updateTravelChecklistItem } from "./update-travel-checklist-item";
import { TravelChecklistItem } from "../domain/travel-checklist-item";

describe("travel checklist use cases", () => {
  it("lists grouped items with progress", async () => {
    const repository = new FakeTravelChecklistRepository([
      item({ id: "packed", isPacked: true }),
      item({ id: "pending", isPacked: false }),
    ]);

    await expect(listTravelChecklist(repository)).resolves.toMatchObject({
      progress: {
        packed: 1,
        pending: 1,
        total: 2,
      },
    });
  });

  it("creates, updates, marks, deletes and resets items", async () => {
    const repository = new FakeTravelChecklistRepository();

    const created = await createTravelChecklistItem(repository, {
      label: " Chupete ",
      category: "sueno",
      sortOrder: 20,
      notes: "",
    });
    const updated = await updateTravelChecklistItem(repository, created.id, {
      label: "Chupete extra",
      category: "sueno",
      sortOrder: 30,
      isPacked: false,
    });
    const packed = await setTravelChecklistItemPacked(repository, created.id, true);

    await resetTravelChecklist(repository);
    await deleteTravelChecklistItem(repository, created.id);

    expect(created.label).toBe("Chupete");
    expect(updated.label).toBe("Chupete extra");
    expect(packed.isPacked).toBe(true);
    await expect(repository.listTravelChecklistItems()).resolves.toEqual([]);
  });
});

class FakeTravelChecklistRepository implements TravelChecklistRepository {
  private items: TravelChecklistItem[];

  constructor(items: TravelChecklistItem[] = []) {
    this.items = items;
  }

  async listTravelChecklistItems() {
    return this.items;
  }

  async createTravelChecklistItem(entry: Omit<TravelChecklistItem, "id">) {
    const item = {
      id: `item-${this.items.length + 1}`,
      ...entry,
      isPacked: entry.isPacked ?? false,
    };
    this.items = [...this.items, item];

    return item;
  }

  async updateTravelChecklistItem(id: string, entry: Omit<TravelChecklistItem, "id">) {
    const item = { id, ...entry, isPacked: entry.isPacked ?? false };
    this.items = this.items.map((existing) => (existing.id === id ? item : existing));

    return item;
  }

  async setTravelChecklistItemPacked(id: string, isPacked: boolean) {
    const item = this.items.find((entry) => entry.id === id);

    if (!item) {
      throw new Error("Item not found");
    }

    const updated = { ...item, isPacked };
    this.items = this.items.map((existing) => (existing.id === id ? updated : existing));

    return updated;
  }

  async deleteTravelChecklistItem(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }

  async resetTravelChecklist() {
    this.items = this.items.map((item) => ({ ...item, isPacked: false }));
  }
}

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
