import { getSleepDurationMinutes, type SleepEntry } from "../domain/sleep-entry";

export type SleepSummary = {
  activeEntry: SleepEntry | null;
  completedEntries: number;
  totalMinutes: number;
};

export function summarizeSleepEntries(entries: SleepEntry[]): SleepSummary {
  const activeEntries = entries.filter((entry) => entry.endedAt === null);

  return {
    activeEntry: activeEntries.length === 1 ? activeEntries[0] : null,
    completedEntries: entries.length - activeEntries.length,
    totalMinutes: entries.reduce(
      (total, entry) => total + (getSleepDurationMinutes(entry) ?? 0),
      0,
    ),
  };
}
