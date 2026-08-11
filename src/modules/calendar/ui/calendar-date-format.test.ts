import { describe, expect, it } from "vitest";
import { formatCalendarDayHeading, formatCalendarEventDate } from "./calendar-date-format";

describe("calendar date formatting", () => {
  const now = new Date("2026-08-11T10:00:00+02:00");

  it("keeps the full day while identifying today", () => {
    expect(formatCalendarDayHeading("2026-08-11", now)).toBe("Hoy · martes, 11 de agosto");
  });

  it("identifies tomorrow and keeps an event time", () => {
    expect(formatCalendarEventDate("2026-08-12T16:30:00.000Z", false, now)).toBe(
      "Mañana · 12 ago, 18:30",
    );
  });

  it("uses the regular date for events further away", () => {
    expect(formatCalendarEventDate("2026-08-20T10:00:00.000Z", true, now)).toBe("20 ago");
  });
});
