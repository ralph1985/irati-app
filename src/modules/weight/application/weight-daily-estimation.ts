import { WeightEntry } from "../domain/weight-entry";

export type WeightDailyEstimate = {
  days: number;
  differenceGrams: number;
  endDate: string;
  gramsPerDay: number;
  startDate: string;
};

export function buildWeightDailyEstimates(entries: WeightEntry[]): WeightDailyEstimate[] {
  const sortedEntries = [...entries].sort((left, right) =>
    left.measuredOn.localeCompare(right.measuredOn),
  );

  return sortedEntries.slice(1).flatMap((entry, index) => {
    const previous = sortedEntries[index];
    const days = daysBetween(previous.measuredOn, entry.measuredOn);

    if (days <= 0) {
      return [];
    }

    const differenceGrams = entry.weightGrams - previous.weightGrams;

    return [
      {
        days,
        differenceGrams,
        endDate: entry.measuredOn,
        gramsPerDay: differenceGrams / days,
        startDate: previous.measuredOn,
      },
    ];
  });
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}
