export type BabyProfile = {
  name: string;
  birthDate: string;
  birthTime?: string;
  cipa: string | null;
};

export const IRATI_BIRTH_TIME = "22:02";

export const iratiProfile: BabyProfile = {
  name: "Irati",
  birthDate: "2026-07-02",
  birthTime: IRATI_BIRTH_TIME,
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

export type BabyAge = {
  years: number;
  months: number;
  days: number;
};

export function calculateAge(profile: BabyProfile, today: Date): BabyAge {
  const birthDate = parseUtcDate(profile.birthDate);
  const currentDate = getEffectiveCurrentDate(profile, today);

  if (currentDate < birthDate) {
    return { days: 0, months: 0, years: 0 };
  }

  let years = currentDate.getUTCFullYear() - birthDate.getUTCFullYear();
  let months = currentDate.getUTCMonth() - birthDate.getUTCMonth();
  let days = currentDate.getUTCDate() - birthDate.getUTCDate();

  if (days < 0) {
    months -= 1;
    days += new Date(
      Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 0),
    ).getUTCDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { days, months, years };
}

function getEffectiveCurrentDate(profile: BabyProfile, today: Date): Date {
  const madridParts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Madrid",
    year: "numeric",
  })
    .formatToParts(today)
    .reduce<Record<string, number>>((parts, part) => {
      if (part.type !== "literal") {
        parts[part.type] = Number(part.value);
      }
      return parts;
    }, {});
  const [birthHour, birthMinute] = (profile.birthTime ?? IRATI_BIRTH_TIME).split(":").map(Number);
  const currentDate = new Date(Date.UTC(madridParts.year, madridParts.month - 1, madridParts.day));

  if (
    madridParts.hour < birthHour ||
    (madridParts.hour === birthHour && madridParts.minute < birthMinute)
  ) {
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  }

  return currentDate;
}

export function formatAge(profile: BabyProfile, today: Date): string {
  const age = calculateAge(profile, today);

  return `${age.years} ${pluralize(age.years, "año")}, ${age.months} ${pluralize(age.months, "mes")} y ${age.days} ${pluralize(age.days, "día")}`;
}

function pluralize(value: number, singular: string): string {
  if (singular === "mes") {
    return value === 1 ? "mes" : "meses";
  }

  return value === 1 ? singular : `${singular}s`;
}

function parseUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}
