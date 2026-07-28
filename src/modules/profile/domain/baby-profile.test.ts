import { describe, expect, it } from "vitest";
import { calculateAge, calculateAgeInDays, formatAge, iratiProfile } from "./baby-profile";

describe("calculateAgeInDays", () => {
  it("calculates Irati age from the configured birth date", () => {
    expect(calculateAgeInDays(iratiProfile, new Date("2026-07-17T12:00:00Z"))).toBe(15);
  });

  it("does not return negative ages", () => {
    expect(calculateAgeInDays(iratiProfile, new Date("2026-07-01T12:00:00Z"))).toBe(0);
  });
});

describe("calculateAge", () => {
  it("calculates years, months and days", () => {
    const age = calculateAge(iratiProfile, new Date("2027-09-15T12:00:00Z"));

    expect(age).toEqual({ days: 13, months: 2, years: 1 });
    expect(formatAge(iratiProfile, new Date("2027-09-15T12:00:00Z"))).toBe(
      "1 año, 2 meses y 13 días",
    );
  });

  it("does not return a negative age before birth", () => {
    expect(calculateAge(iratiProfile, new Date("2026-07-01T12:00:00Z"))).toEqual({
      days: 0,
      months: 0,
      years: 0,
    });
  });
});
