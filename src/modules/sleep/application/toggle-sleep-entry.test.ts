import { describe, expect, it, vi } from "vitest";
import { toggleSleepEntry } from "./toggle-sleep-entry";
import type { SleepRepository } from "./sleep-repository";

const activeEntry = {
  createdAt: "2026-08-29T07:00:00.000Z",
  endedAt: null,
  id: "sleep-1",
  kind: "nap" as const,
  startedAt: "2026-08-29T07:00:00.000Z",
  updatedAt: "2026-08-29T07:00:00.000Z",
};

describe("toggleSleepEntry", () => {
  it("starts a nap when there is no active sleep", async () => {
    const createdEntry = { ...activeEntry, id: "sleep-2", kind: "night" as const };
    const repository = {
      createSleepEntry: vi.fn().mockResolvedValue(createdEntry),
      getActiveSleepEntry: vi.fn().mockResolvedValue(null),
      updateSleepEntry: vi.fn(),
    } satisfies Pick<
      SleepRepository,
      "createSleepEntry" | "getActiveSleepEntry" | "updateSleepEntry"
    >;

    await expect(
      toggleSleepEntry(repository, "night", "2026-08-29T22:00:00.000Z"),
    ).resolves.toEqual({
      action: "started",
      entry: createdEntry,
    });
    expect(repository.createSleepEntry).toHaveBeenCalledWith({
      endedAt: null,
      kind: "night",
      startedAt: "2026-08-29T22:00:00.000Z",
    });
  });

  it("finishes the active sleep without creating another entry", async () => {
    const finishedEntry = {
      ...activeEntry,
      endedAt: "2026-08-29T08:30:00.000Z",
      updatedAt: "2026-08-29T08:30:00.000Z",
    };
    const repository = {
      createSleepEntry: vi.fn(),
      getActiveSleepEntry: vi.fn().mockResolvedValue(activeEntry),
      updateSleepEntry: vi.fn().mockResolvedValue(finishedEntry),
    } satisfies Pick<
      SleepRepository,
      "createSleepEntry" | "getActiveSleepEntry" | "updateSleepEntry"
    >;

    await expect(
      toggleSleepEntry(repository, "night", "2026-08-29T08:30:00.000Z"),
    ).resolves.toEqual({
      action: "stopped",
      entry: finishedEntry,
    });
    expect(repository.updateSleepEntry).toHaveBeenCalledWith("sleep-1", {
      endedAt: "2026-08-29T08:30:00.000Z",
      kind: "nap",
      startedAt: "2026-08-29T07:00:00.000Z",
    });
    expect(repository.createSleepEntry).not.toHaveBeenCalled();
  });
});
