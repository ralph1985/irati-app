export const travelChecklistCategories = [
  "comida",
  "higiene",
  "cambio",
  "sueno",
  "salud",
  "paseo",
  "documentacion",
] as const;

export type TravelChecklistCategory = (typeof travelChecklistCategories)[number];

export type TravelChecklistItem = {
  id: string;
  label: string;
  category: TravelChecklistCategory;
  sortOrder: number;
  isPacked: boolean;
  notes?: string | null;
};

export type NewTravelChecklistItem = Omit<TravelChecklistItem, "id" | "isPacked"> & {
  isPacked?: boolean;
};

export type TravelChecklistProgress = {
  packed: number;
  pending: number;
  total: number;
};

export type TravelChecklistGroup = {
  category: TravelChecklistCategory;
  items: TravelChecklistItem[];
  progress: TravelChecklistProgress;
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

export function groupTravelChecklistItems(items: TravelChecklistItem[]): TravelChecklistGroup[] {
  return travelChecklistCategories.map((category) => {
    const categoryItems = sortTravelChecklistItems(
      items.filter((item) => item.category === category),
    );

    return {
      category,
      items: categoryItems,
      progress: calculateTravelChecklistProgress(categoryItems),
    };
  });
}

export function sortTravelChecklistItems(items: TravelChecklistItem[]): TravelChecklistItem[] {
  return [...items].sort((first, second) => {
    if (first.category !== second.category) {
      return (
        travelChecklistCategories.indexOf(first.category) -
        travelChecklistCategories.indexOf(second.category)
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
  const normalizedOtherItems = travelChecklistCategories.flatMap((category) => {
    const categoryItems = otherItems.filter((item) => item.category === category);
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
  return travelChecklistCategories.includes(value as TravelChecklistCategory);
}

export function formatTravelChecklistCategory(category: TravelChecklistCategory): string {
  switch (category) {
    case "comida":
      return "Comida";
    case "higiene":
      return "Higiene";
    case "cambio":
      return "Cambio";
    case "sueno":
      return "Sueño";
    case "salud":
      return "Salud";
    case "paseo":
      return "Paseo";
    case "documentacion":
      return "Documentacion";
  }
}

function normalizeTravelChecklistItem(input: NewTravelChecklistItem): NewTravelChecklistItem {
  return {
    label: input.label.trim(),
    category: input.category,
    sortOrder: input.sortOrder,
    isPacked: input.isPacked ?? false,
    notes: input.notes?.trim() || null,
  };
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
