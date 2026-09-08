import { describe, expect, it } from "vitest";
import {
  createHeadCircumferenceEntry,
  createHeightEntry,
  GrowthEntryValidationError,
} from "./growth-entry";

describe("growth entries", () => {
  it("normalizes a valid height entry", () => {
    expect(
      createHeightEntry({
        heightCm: 57,
        measuredOn: "2026-09-08",
        notes: "  Pediatra  ",
        place: "pediatra",
      }),
    ).toEqual({
      heightCm: 57,
      measuredOn: "2026-09-08",
      notes: "Pediatra",
      place: "pediatra",
    });
  });

  it("accepts the initial head circumference entry", () => {
    expect(
      createHeadCircumferenceEntry({
        headCircumferenceCm: 39,
        measuredOn: "2026-09-08",
        notes: "",
        place: "pediatra",
      }),
    ).toMatchObject({ headCircumferenceCm: 39, notes: null });
  });

  it("rejects non-integer or out-of-range measurements", () => {
    expect(() =>
      createHeightEntry({ heightCm: 57.5, measuredOn: "2026-09-08", place: "pediatra" }),
    ).toThrow(GrowthEntryValidationError);
    expect(() =>
      createHeadCircumferenceEntry({
        headCircumferenceCm: 71,
        measuredOn: "2026-09-08",
        place: "pediatra",
      }),
    ).toThrow("entre 1 y 70");
  });
});
