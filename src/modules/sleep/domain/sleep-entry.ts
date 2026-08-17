export const sleepKinds = ["nap", "night"] as const;

export type SleepKind = (typeof sleepKinds)[number];

export type SleepEntry = {
  id: string;
  kind: SleepKind;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewSleepEntry = Omit<SleepEntry, "id" | "createdAt" | "updatedAt">;

export class SleepEntryValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "SleepEntryValidationError";
  }
}

export function createSleepEntry(input: NewSleepEntry): NewSleepEntry {
  const issues = validateSleepEntry(input);

  if (issues.length > 0) {
    throw new SleepEntryValidationError(issues);
  }

  return {
    endedAt: input.endedAt,
    kind: input.kind,
    startedAt: input.startedAt,
  };
}

export function isSleepKind(value: string): value is SleepKind {
  return sleepKinds.includes(value as SleepKind);
}

export function isActiveSleepEntry(entry: Pick<SleepEntry, "endedAt">): boolean {
  return entry.endedAt === null;
}

export function getSleepDurationMinutes(
  entry: Pick<SleepEntry, "startedAt" | "endedAt">,
): number | null {
  if (entry.endedAt === null) {
    return null;
  }

  return Math.round((Date.parse(entry.endedAt) - Date.parse(entry.startedAt)) / 60_000);
}

function validateSleepEntry(input: NewSleepEntry): string[] {
  const issues: string[] = [];

  if (!isSleepKind(input.kind)) {
    issues.push("El tipo de sueño no es válido.");
  }

  if (!isIsoDateTime(input.startedAt)) {
    issues.push("La hora de inicio no es válida.");
  }

  if (input.endedAt !== null && !isIsoDateTime(input.endedAt)) {
    issues.push("La hora de fin no es válida.");
  }

  if (
    isIsoDateTime(input.startedAt) &&
    input.endedAt !== null &&
    isIsoDateTime(input.endedAt) &&
    Date.parse(input.endedAt) <= Date.parse(input.startedAt)
  ) {
    issues.push("La hora de fin debe ser posterior al inicio.");
  }

  return issues;
}

function isIsoDateTime(value: string): boolean {
  if (Number.isNaN(Date.parse(value))) {
    return false;
  }

  return new Date(value).toISOString() === value;
}
