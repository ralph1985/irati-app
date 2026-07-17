import { describe, expect, it } from "vitest";
import { calculateAgeInDays, iratiProfile } from "./baby-profile";

describe("calculateAgeInDays", () => {
  it("calculates Irati age from the configured birth date", () => {
    expect(calculateAgeInDays(iratiProfile, new Date("2026-07-17T12:00:00Z"))).toBe(15);
  });

  it("does not return negative ages", () => {
    expect(calculateAgeInDays(iratiProfile, new Date("2026-07-01T12:00:00Z"))).toBe(0);
  });
});
