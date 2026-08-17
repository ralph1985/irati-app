import { describe, expect, it, vi } from "vitest";
import { ActiveSleepEntryConflictError, registerSleepEntry } from "./create-sleep-entry";
import type { SleepRepository } from "./sleep-repository";

const activeEntry = {
  createdAt: "2026-08-17T09:00:00.000Z",
  endedAt: null,
  id: "active-entry",
  kind: "nap" as const,
  startedAt: "2026-08-17T09:00:00.000Z",
  updatedAt: "2026-08-17T09:00:00.000Z",
};

describe("registerSleepEntry", () => {
  it("does not create a second active sleep entry", async () => {
    const repository = {
      createSleepEntry: vi.fn(),
      getActiveSleepEntry: vi.fn().mockResolvedValue(activeEntry),
    } satisfies Pick<SleepRepository, "createSleepEntry" | "getActiveSleepEntry">;

    await expect(
      registerSleepEntry(repository, {
        endedAt: null,
        kind: "night",
        startedAt: "2026-08-17T20:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(ActiveSleepEntryConflictError);
    expect(repository.createSleepEntry).not.toHaveBeenCalled();
  });
});
