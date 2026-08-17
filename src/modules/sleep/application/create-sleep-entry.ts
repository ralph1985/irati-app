import {
  createSleepEntry,
  isActiveSleepEntry,
  type NewSleepEntry,
  type SleepEntry,
} from "../domain/sleep-entry";
import type { SleepRepository } from "./sleep-repository";

export class ActiveSleepEntryConflictError extends Error {
  constructor(readonly activeEntry: SleepEntry) {
    super("An active sleep entry already exists");
    this.name = "ActiveSleepEntryConflictError";
  }
}

export async function registerSleepEntry(
  repository: Pick<SleepRepository, "createSleepEntry" | "getActiveSleepEntry">,
  input: NewSleepEntry,
): Promise<SleepEntry> {
  const entry = createSleepEntry(input);
  if (isActiveSleepEntry(entry)) {
    const activeEntry = await repository.getActiveSleepEntry();
    if (activeEntry) {
      throw new ActiveSleepEntryConflictError(activeEntry);
    }
  }
  return repository.createSleepEntry(entry);
}
