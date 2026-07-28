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
    const age = calculateAge(iratiProfile, new Date("2027-09-15T23:00:00Z"));

    expect(age).toEqual({
      days: 13,
      hours: 2,
      minutes: 58,
      months: 2,
      seconds: 0,
      years: 1,
    });
    expect(formatAge(iratiProfile, new Date("2027-09-15T23:00:00Z"))).toBe(
      "1 año, 2 meses, 13 días, 2 horas, 58 minutos y 0 segundos",
    );
  });

  it("does not complete the birth day before the birth time in Madrid", () => {
    expect(calculateAge(iratiProfile, new Date("2026-07-02T19:59:00Z"))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      months: 0,
      seconds: 0,
      years: 0,
    });
    expect(calculateAge(iratiProfile, new Date("2026-07-02T20:00:00Z"))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      months: 0,
      seconds: 0,
      years: 0,
    });
    expect(calculateAge(iratiProfile, new Date("2026-07-02T20:02:00Z"))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      months: 0,
      seconds: 0,
      years: 0,
    });
    expect(calculateAge(iratiProfile, new Date("2026-07-03T20:02:00Z"))).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
      months: 0,
      seconds: 0,
      years: 0,
    });
  });

  it("does not return a negative age before birth", () => {
    expect(calculateAge(iratiProfile, new Date("2026-07-01T12:00:00Z"))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      months: 0,
      seconds: 0,
      years: 0,
    });
  });

  it("includes the elapsed time since the birth hour", () => {
    expect(calculateAge(iratiProfile, new Date("2026-07-03T20:03:04Z"))).toEqual({
      days: 1,
      hours: 0,
      minutes: 1,
      months: 0,
      seconds: 4,
      years: 0,
    });
  });
});
