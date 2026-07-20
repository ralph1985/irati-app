import { WeightEntry } from "../domain/weight-entry";

export type WeightTrendSummary = {
  averageGramsPerDay: number | null;
  daysBetweenLastEntries: number | null;
  daysSinceLatest: number | null;
  differenceGrams: number | null;
  latest: WeightEntry | null;
  previous: WeightEntry | null;
  totalEntries: number;
};

export function buildWeightTrendSummary(entries: WeightEntry[], today: Date): WeightTrendSummary {
  const sortedEntries = [...entries].sort((left, right) =>
    left.measuredOn.localeCompare(right.measuredOn),
  );
  const latest = sortedEntries.at(-1) ?? null;
  const previous = sortedEntries.at(-2) ?? null;

  if (!latest) {
    return {
      averageGramsPerDay: null,
      daysBetweenLastEntries: null,
      daysSinceLatest: null,
      differenceGrams: null,
      latest: null,
      previous: null,
      totalEntries: 0,
    };
  }

  const daysSinceLatest = Math.max(0, daysBetween(latest.measuredOn, toIsoDate(today)));

  if (!previous) {
    return {
      averageGramsPerDay: null,
      daysBetweenLastEntries: null,
      daysSinceLatest,
      differenceGrams: null,
      latest,
      previous: null,
      totalEntries: sortedEntries.length,
    };
  }

  const daysBetweenLastEntries = Math.max(0, daysBetween(previous.measuredOn, latest.measuredOn));
  const differenceGrams = latest.weightGrams - previous.weightGrams;

  return {
    averageGramsPerDay:
      daysBetweenLastEntries > 0 ? Math.round(differenceGrams / daysBetweenLastEntries) : null,
    daysBetweenLastEntries,
    daysSinceLatest,
    differenceGrams,
    latest,
    previous,
    totalEntries: sortedEntries.length,
  };
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
