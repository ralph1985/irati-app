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
