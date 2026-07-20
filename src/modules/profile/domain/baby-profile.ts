export type BabyProfile = {
  name: string;
  birthDate: string;
  cipa: string | null;
};

export const iratiProfile: BabyProfile = {
  name: "Irati",
  birthDate: "2026-07-02",
  cipa: null,
};

export type BabyProfileUpdate = {
  cipa: string | null;
};

export class BabyProfileValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "BabyProfileValidationError";
  }
}

export function createBabyProfileUpdate(input: BabyProfileUpdate): BabyProfileUpdate {
  const cipa = normalizeCipa(input.cipa);
  const issues = validateCipa(cipa);

  if (issues.length > 0) {
    throw new BabyProfileValidationError(issues);
  }

  return { cipa };
}

export function formatBirthDate(profile: BabyProfile): string {
  const birthDate = parseUtcDate(profile.birthDate);

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(birthDate);
}

export function calculateAgeInDays(profile: BabyProfile, today: Date): number {
  const birthDate = parseUtcDate(profile.birthDate);
  const currentDate = parseUtcDate(today.toISOString().slice(0, 10));

  return Math.max(0, Math.floor((currentDate.getTime() - birthDate.getTime()) / 86_400_000));
}

function parseUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function normalizeCipa(value: string | null): string | null {
  const normalized = value?.trim() ?? "";

  return normalized || null;
}

function validateCipa(cipa: string | null): string[] {
  const issues: string[] = [];

  if (!cipa) {
    return issues;
  }

  if (cipa.length > 32) {
    issues.push("El CIPA no puede superar 32 caracteres.");
  }

  if (/[\u0000-\u001f\u007f]/.test(cipa)) {
    issues.push("El CIPA contiene caracteres no validos.");
  }

  return issues;
}
