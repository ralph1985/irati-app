import type { SleepEntry } from "../domain/sleep-entry";
import type { SleepRepository } from "./sleep-repository";

export async function listSleepEntries(
  repository: Pick<SleepRepository, "listSleepEntries">,
): Promise<SleepEntry[]> {
  return repository.listSleepEntries();
}
