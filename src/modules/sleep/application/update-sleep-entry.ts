import {
  createSleepEntry,
  isActiveSleepEntry,
  type NewSleepEntry,
  type SleepEntry,
} from "../domain/sleep-entry";
import { ActiveSleepEntryConflictError } from "./create-sleep-entry";
import type { SleepRepository } from "./sleep-repository";

export async function updateSleepEntry(
  repository: Pick<SleepRepository, "getActiveSleepEntry" | "updateSleepEntry">,
  id: string,
  input: NewSleepEntry,
): Promise<SleepEntry> {
  if (!id) {
    throw new Error("Missing sleep entry id");
  }

  const entry = createSleepEntry(input);
  if (isActiveSleepEntry(entry)) {
    const activeEntry = await repository.getActiveSleepEntry();
    if (activeEntry && activeEntry.id !== id) {
      throw new ActiveSleepEntryConflictError(activeEntry);
    }
  }
  return repository.updateSleepEntry(id, entry);
}
