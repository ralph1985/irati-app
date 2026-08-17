import type { NewSleepEntry, SleepEntry } from "../domain/sleep-entry";

export type SleepRepository = {
  listSleepEntries(): Promise<SleepEntry[]>;
  getActiveSleepEntry(): Promise<SleepEntry | null>;
  createSleepEntry(entry: NewSleepEntry): Promise<SleepEntry>;
  updateSleepEntry(id: string, entry: NewSleepEntry): Promise<SleepEntry>;
  deleteSleepEntry(id: string): Promise<void>;
};
