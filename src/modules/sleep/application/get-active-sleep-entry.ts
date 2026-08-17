import type { SleepEntry } from "../domain/sleep-entry";
import type { SleepRepository } from "./sleep-repository";

export async function getActiveSleepEntry(
  repository: Pick<SleepRepository, "getActiveSleepEntry">,
): Promise<SleepEntry | null> {
  return repository.getActiveSleepEntry();
}
