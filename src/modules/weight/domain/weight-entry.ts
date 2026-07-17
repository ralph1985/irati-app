export const weightPlaces = ["hospital", "pediatra", "farmacia"] as const;

export type WeightPlace = (typeof weightPlaces)[number];

export type WeightEntry = {
  id: string;
  measuredOn: string;
  weightGrams: number;
  place: WeightPlace;
  notes?: string | null;
};

export type NewWeightEntry = Omit<WeightEntry, "id">;

export class WeightEntryValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "WeightEntryValidationError";
  }
}

export function createWeightEntry(input: NewWeightEntry): NewWeightEntry {
  const issues = validateWeightEntry(input);

  if (issues.length > 0) {
    throw new WeightEntryValidationError(issues);
  }

  return {
    measuredOn: input.measuredOn,
    weightGrams: input.weightGrams,
    place: input.place,
    notes: input.notes?.trim() || null,
  };
}

export function isWeightPlace(value: string): value is WeightPlace {
  return weightPlaces.includes(value as WeightPlace);
}

function validateWeightEntry(input: NewWeightEntry): string[] {
  const issues: string[] = [];

  if (!isIsoDate(input.measuredOn)) {
    issues.push("La fecha del peso no es valida.");
  }

  if (
    !Number.isInteger(input.weightGrams) ||
    input.weightGrams < 1000 ||
    input.weightGrams > 20000
  ) {
    issues.push("El peso debe estar entre 1000 y 20000 gramos.");
  }

  if (!isWeightPlace(input.place)) {
    issues.push("El lugar debe ser Hospital, Pediatra o Farmacia.");
  }

  return issues;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
