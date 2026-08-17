import { createSleepEntry, isActiveSleepEntry, type SleepEntry } from "../domain/sleep-entry";

export type PendingSleepMutationPayload = {
  operation: "create" | "update" | "delete";
  payload: SleepEntry | { id: string };
};

export type OfflineSleepMutationRepository = {
  createSleepEntryWithId(entry: SleepEntry): Promise<void>;
  deleteSleepEntry(id: string): Promise<void>;
  getActiveSleepEntry(): Promise<SleepEntry | null>;
  updateSleepEntry(
    id: string,
    entry: Omit<SleepEntry, "id" | "createdAt" | "updatedAt">,
  ): Promise<void>;
};

export class OfflineSleepMutationConflictError extends Error {
  constructor(readonly activeEntry: SleepEntry) {
    super("active_sleep_entry_conflict");
    this.name = "OfflineSleepMutationConflictError";
  }
}

export async function applyOfflineSleepMutation(
  repository: OfflineSleepMutationRepository,
  mutation: PendingSleepMutationPayload,
): Promise<void> {
  if (mutation.operation === "delete") {
    await repository.deleteSleepEntry(mutation.payload.id);
    return;
  }

  if (!isSleepEntry(mutation.payload)) {
    throw new Error("Invalid sleep payload");
  }

  const entry = mutation.payload;
  const input = createSleepEntry(entry);

  if (isActiveSleepEntry(entry)) {
    const activeEntry = await repository.getActiveSleepEntry();
    if (activeEntry && activeEntry.id !== entry.id) {
      throw new OfflineSleepMutationConflictError(activeEntry);
    }
  }

  if (mutation.operation === "create") {
    await repository.createSleepEntryWithId(entry);
    return;
  }

  await repository.updateSleepEntry(entry.id, input);
}

function isSleepEntry(value: SleepEntry | { id: string }): value is SleepEntry {
  return "kind" in value && "startedAt" in value && "endedAt" in value;
}
