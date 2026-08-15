export type TravelChecklistCategory = string;

export type TravelChecklistCategoryDefinition = {
  slug: TravelChecklistCategory;
  label: string;
  sortOrder: number;
};

export type TravelStorageLocation = {
  id: string;
  label: string;
  parentId: string | null;
  sortOrder: number;
};

export type TravelChecklistItem = {
  id: string;
  label: string;
  category: TravelChecklistCategory;
  sortOrder: number;
  isPacked: boolean;
  notes?: string | null;
  storageLocationId?: string | null;
};

export type NewTravelChecklistItem = Omit<
  TravelChecklistItem,
  "id" | "isPacked" | "storageLocationId"
> & {
  isPacked?: boolean;
  storageLocationId?: string | null;
};

export type TravelChecklistProgress = {
  packed: number;
  pending: number;
  total: number;
};

export type TravelChecklistGroup = {
  category: TravelChecklistCategoryDefinition;
  items: TravelChecklistItem[];
  progress: TravelChecklistProgress;
};

export type TravelStorageLocationGroup = {
  location: TravelStorageLocation | null;
  items: TravelChecklistItem[];
};

export type TravelChecklistReorder = {
  id: string;
  category: TravelChecklistCategory;
  sortOrder: number;
};

export class TravelChecklistItemValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "TravelChecklistItemValidationError";
  }
}

export function createTravelChecklistItem(input: NewTravelChecklistItem): NewTravelChecklistItem {
  const normalized = normalizeTravelChecklistItem(input);
  const issues = validateTravelChecklistItem(normalized);

  if (issues.length > 0) {
    throw new TravelChecklistItemValidationError(issues);
  }

  return normalized;
}

export function updateTravelChecklistItemInput(
  input: NewTravelChecklistItem,
): NewTravelChecklistItem {
  return createTravelChecklistItem(input);
}

export function calculateTravelChecklistProgress(
  items: TravelChecklistItem[],
): TravelChecklistProgress {
  const packed = items.filter((item) => item.isPacked).length;
  const total = items.length;

  return {
    packed,
    pending: total - packed,
    total,
  };
}

export function groupTravelChecklistItems(
  items: TravelChecklistItem[],
  categories: TravelChecklistCategoryDefinition[],
): TravelChecklistGroup[] {
  return categories.map((category) => {
    const categoryItems = sortTravelChecklistItems(
      items.filter((item) => item.category === category.slug),
      categories,
    );

    return {
      category,
      items: categoryItems,
      progress: calculateTravelChecklistProgress(categoryItems),
    };
  });
}

export function groupTravelChecklistItemsByLocation(
  items: TravelChecklistItem[],
  locations: TravelStorageLocation[],
): TravelStorageLocationGroup[] {
  const groups = locations.map((location) => ({ location, items: [] as TravelChecklistItem[] }));
  const unassigned: TravelStorageLocationGroup = { location: null, items: [] };
  const groupsById = new Map(groups.map((group) => [group.location.id, group]));

  for (const item of items) {
    const group = item.storageLocationId ? groupsById.get(item.storageLocationId) : undefined;
    (group ?? unassigned).items.push(item);
  }

  return [...groups.filter((group) => group.items.length > 0), unassigned].filter(
    (group) => group.items.length > 0,
  );
}

export function sortTravelChecklistItems(
  items: TravelChecklistItem[],
  categories: TravelChecklistCategoryDefinition[],
): TravelChecklistItem[] {
  return [...items].sort((first, second) => {
    if (first.category !== second.category) {
      return (
        getCategorySortOrder(first.category, categories) -
        getCategorySortOrder(second.category, categories)
      );
    }

    if (first.sortOrder !== second.sortOrder) {
      return first.sortOrder - second.sortOrder;
    }

    return first.label.localeCompare(second.label, "es");
  });
}

export function reorderTravelChecklistItems(
  items: TravelChecklistItem[],
  itemId: string,
  targetCategory: TravelChecklistCategory,
  targetIndex: number,
  categories: TravelChecklistCategoryDefinition[],
): TravelChecklistItem[] {
  const movingItem = items.find((item) => item.id === itemId);

  if (!movingItem) {
    return items;
  }

  const withoutMovingItem = items.filter((item) => item.id !== itemId);
  const targetItems = withoutMovingItem.filter((item) => item.category === targetCategory);
  const boundedIndex = Math.max(0, Math.min(targetIndex, targetItems.length));
  targetItems.splice(boundedIndex, 0, { ...movingItem, category: targetCategory });

  const targetPositions = new Map(
    targetItems.map((item, index) => [
      item.id,
      { category: targetCategory, sortOrder: (index + 1) * 10 },
    ]),
  );

  const otherItems = withoutMovingItem.filter((item) => item.category !== targetCategory);
  const normalizedOtherItems = categories.flatMap((category) => {
    const categoryItems = otherItems.filter((item) => item.category === category.slug);
    return categoryItems.map((item, index) => ({
      ...item,
      sortOrder: (index + 1) * 10,
    }));
  });

  return [...normalizedOtherItems, ...targetItems].map((item) => {
    const position = targetPositions.get(item.id);
    return position ? { ...item, ...position } : item;
  });
}

export function isTravelChecklistCategory(value: string): value is TravelChecklistCategory {
  return value.trim().length > 0;
}

export function formatTravelChecklistCategory(category: TravelChecklistCategoryDefinition): string {
  return category.label;
}

function getCategorySortOrder(
  category: TravelChecklistCategory,
  categories: TravelChecklistCategoryDefinition[],
): number {
  return (
    categories.find((candidate) => candidate.slug === category)?.sortOrder ??
    Number.MAX_SAFE_INTEGER
  );
}

function normalizeTravelChecklistItem(input: NewTravelChecklistItem): NewTravelChecklistItem {
  return {
    label: input.label.trim(),
    category: input.category,
    sortOrder: input.sortOrder,
    isPacked: input.isPacked ?? false,
    notes: input.notes?.trim() || null,
    storageLocationId: input.storageLocationId ?? null,
  };
}

export function normalizeTravelStorageLocationLabel(label: string): string {
  return label.trim();
}

export function validateTravelStorageLocationLabel(label: string): string[] {
  return label.trim().length === 0 || label.trim().length > 80
    ? ["La ubicación debe tener entre 1 y 80 caracteres."]
    : [];
}

export function createTravelCategorySlug(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function validateTravelChecklistItem(input: NewTravelChecklistItem): string[] {
  const issues: string[] = [];

  if (input.label.length === 0 || input.label.length > 120) {
    issues.push("El elemento debe tener entre 1 y 120 caracteres.");
  }

  if (!isTravelChecklistCategory(input.category)) {
    issues.push("La categoría de viaje no es válida.");
  }

  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 10000) {
    issues.push("El orden debe ser un entero entre 0 y 10000.");
  }

  return issues;
}
