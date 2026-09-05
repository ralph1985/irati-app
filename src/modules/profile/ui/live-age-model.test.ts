import { describe, expect, it } from "vitest";
import { getAgeUnits } from "./live-age-model";

describe("getAgeUnits", () => {
  it("keeps the main age units prominent and the clock details secondary", () => {
    const units = getAgeUnits({ years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6 });

    expect(units.map(({ key, emphasis }) => [key, emphasis])).toEqual([
      ["years", "primary"],
      ["months", "primary"],
      ["days", "primary"],
      ["hours", "secondary"],
      ["minutes", "secondary"],
      ["seconds", "secondary"],
    ]);
  });

  it("uses singular labels only for one", () => {
    const units = getAgeUnits({ years: 1, months: 1, days: 1, hours: 1, minutes: 1, seconds: 1 });

    expect(units.map(({ label }) => label)).toEqual([
      "año",
      "mes",
      "día",
      "hora",
      "minuto",
      "segundo",
    ]);
  });
});
