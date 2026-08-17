import { describe, expect, it, vi } from "vitest";
import {
  applyOfflineSleepMutation,
  OfflineSleepMutationConflictError,
  type OfflineSleepMutationRepository,
} from "./apply-offline-sleep-mutation";
import type { SleepEntry } from "../domain/sleep-entry";

const localActiveEntry: SleepEntry = {
  createdAt: "2026-08-17T09:00:00.000Z",
  endedAt: null,
  id: "local-active",
  kind: "nap",
  startedAt: "2026-08-17T09:00:00.000Z",
  updatedAt: "2026-08-17T09:00:00.000Z",
};

function repository(activeEntry: SleepEntry | null): OfflineSleepMutationRepository {
  return {
    createSleepEntryWithId: vi.fn(),
    deleteSleepEntry: vi.fn(),
    getActiveSleepEntry: vi.fn().mockResolvedValue(activeEntry),
    updateSleepEntry: vi.fn(),
  };
}

describe("applyOfflineSleepMutation", () => {
  it("requires manual resolution when a different remote sleep is active", async () => {
    const remoteActive = { ...localActiveEntry, id: "remote-active", kind: "night" as const };
    const sleepRepository = repository(remoteActive);

    await expect(
      applyOfflineSleepMutation(sleepRepository, {
        operation: "create",
        payload: localActiveEntry,
      }),
    ).rejects.toMatchObject({
      activeEntry: remoteActive,
      name: OfflineSleepMutationConflictError.name,
    });
    expect(sleepRepository.createSleepEntryWithId).not.toHaveBeenCalled();
  });

  it("updates the same active entry without a conflict", async () => {
    const sleepRepository = repository(localActiveEntry);

    await applyOfflineSleepMutation(sleepRepository, {
      operation: "update",
      payload: localActiveEntry,
    });

    expect(sleepRepository.updateSleepEntry).toHaveBeenCalledWith(
      "local-active",
      expect.objectContaining({ endedAt: null }),
    );
  });
});
