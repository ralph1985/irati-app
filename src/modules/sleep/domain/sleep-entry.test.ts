import { describe, expect, it } from "vitest";
import {
  createSleepEntry,
  getSleepDurationMinutes,
  isActiveSleepEntry,
  SleepEntryValidationError,
} from "./sleep-entry";

describe("SleepEntry", () => {
  it("accepts an active nap", () => {
    expect(
      createSleepEntry({ endedAt: null, kind: "nap", startedAt: "2026-08-17T09:00:00.000Z" }),
    ).toEqual({ endedAt: null, kind: "nap", startedAt: "2026-08-17T09:00:00.000Z" });
  });

  it("normalizes PostgreSQL timestamp offsets before updating an active entry", () => {
    expect(
      createSleepEntry({
        endedAt: "2026-08-17T09:45:00+00:00",
        kind: "nap",
        startedAt: "2026-08-17T09:00:00+00:00",
      }),
    ).toEqual({
      endedAt: "2026-08-17T09:45:00.000Z",
      kind: "nap",
      startedAt: "2026-08-17T09:00:00.000Z",
    });
  });

  it("rejects an end before its start", () => {
    expect(() =>
      createSleepEntry({
        endedAt: "2026-08-17T09:00:00.000Z",
        kind: "night",
        startedAt: "2026-08-17T10:00:00.000Z",
      }),
    ).toThrow(SleepEntryValidationError);
  });

  it("derives active state and completed duration", () => {
    expect(isActiveSleepEntry({ endedAt: null })).toBe(true);
    expect(
      getSleepDurationMinutes({
        endedAt: "2026-08-17T10:35:00.000Z",
        startedAt: "2026-08-17T09:00:00.000Z",
      }),
    ).toBe(95);
  });
});
