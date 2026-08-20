import { WeightEntry } from "../domain/weight-entry";

export type WeightHistoryRow = {
  entry: WeightEntry;
  differenceGrams: number | null;
  averageGramsPerDay: number | null;
};

export function buildWeightHistory(entries: WeightEntry[]): WeightHistoryRow[] {
  const chronologicalEntries = [...entries].sort((left, right) =>
    left.measuredOn.localeCompare(right.measuredOn),
  );

  return chronologicalEntries
    .map((entry, index) => {
      const previous = chronologicalEntries[index - 1];
      const differenceGrams = previous ? entry.weightGrams - previous.weightGrams : null;
      const daysBetween = previous ? differenceInDays(previous.measuredOn, entry.measuredOn) : 0;

      return {
        entry,
        differenceGrams,
        averageGramsPerDay:
          differenceGrams !== null && daysBetween > 0
            ? Math.round(differenceGrams / daysBetween)
            : null,
      };
    })
    .reverse();
}

function differenceInDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}
