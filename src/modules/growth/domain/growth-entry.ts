export const measurementPlaces = ["hospital", "pediatra", "farmacia"] as const;

export type MeasurementPlace = (typeof measurementPlaces)[number];

export type HeightEntry = {
  id: string;
  measuredOn: string;
  heightCm: number;
  place: MeasurementPlace;
  notes?: string | null;
};

export type HeadCircumferenceEntry = {
  id: string;
  measuredOn: string;
  headCircumferenceCm: number;
  place: MeasurementPlace;
  notes?: string | null;
};

export type NewHeightEntry = Omit<HeightEntry, "id">;
export type NewHeadCircumferenceEntry = Omit<HeadCircumferenceEntry, "id">;

export class GrowthEntryValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "GrowthEntryValidationError";
  }
}

export function createHeightEntry(input: NewHeightEntry): NewHeightEntry {
  const issues = validateCommonMeasurement(input.measuredOn, input.place);

  if (!Number.isInteger(input.heightCm) || input.heightCm < 1 || input.heightCm > 150) {
    issues.push("La altura debe estar entre 1 y 150 centímetros enteros.");
  }

  if (issues.length > 0) {
    throw new GrowthEntryValidationError(issues);
  }

  return normalizeMeasurement(input);
}

export function createHeadCircumferenceEntry(
  input: NewHeadCircumferenceEntry,
): NewHeadCircumferenceEntry {
  const issues = validateCommonMeasurement(input.measuredOn, input.place);

  if (
    !Number.isInteger(input.headCircumferenceCm) ||
    input.headCircumferenceCm < 1 ||
    input.headCircumferenceCm > 70
  ) {
    issues.push("El perímetro craneal debe estar entre 1 y 70 centímetros enteros.");
  }

  if (issues.length > 0) {
    throw new GrowthEntryValidationError(issues);
  }

  return normalizeMeasurement(input);
}

export function isMeasurementPlace(value: string): value is MeasurementPlace {
  return measurementPlaces.includes(value as MeasurementPlace);
}

function validateCommonMeasurement(measuredOn: string, place: string): string[] {
  const issues: string[] = [];

  if (!isIsoDate(measuredOn)) {
    issues.push("La fecha de la medida no es válida.");
  }

  if (!isMeasurementPlace(place)) {
    issues.push("El lugar debe ser Hospital, Pediatra o Farmacia.");
  }

  return issues;
}

function normalizeMeasurement<T extends { notes?: string | null }>(input: T): T {
  return {
    ...input,
    notes: input.notes?.trim() || null,
  };
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
