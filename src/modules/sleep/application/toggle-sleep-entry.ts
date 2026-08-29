import { registerSleepEntry } from "./create-sleep-entry";
import { updateSleepEntry } from "./update-sleep-entry";
import type { SleepRepository } from "./sleep-repository";
import type { SleepEntry, SleepKind } from "../domain/sleep-entry";

export type ToggleSleepResult = {
  action: "started" | "stopped";
  entry: SleepEntry;
};

export async function toggleSleepEntry(
  repository: Pick<
    SleepRepository,
    "createSleepEntry" | "getActiveSleepEntry" | "updateSleepEntry"
  >,
  kind: SleepKind,
  now = new Date().toISOString(),
): Promise<ToggleSleepResult> {
  const activeEntry = await repository.getActiveSleepEntry();

  if (activeEntry) {
    return {
      action: "stopped",
      entry: await updateSleepEntry(repository, activeEntry.id, {
        endedAt: now,
        kind: activeEntry.kind,
        startedAt: activeEntry.startedAt,
      }),
    };
  }

  return {
    action: "started",
    entry: await registerSleepEntry(repository, {
      endedAt: null,
      kind,
      startedAt: now,
    }),
  };
}
