import { describe, expect, it, vi } from "vitest";
import {
  filterCalendarEvents,
  getCalendarRange,
  normalizeGoogleCalendarUrl,
  sortCalendarEvents,
} from "../domain/calendar-event";

describe("calendar range", () => {
  it("starts at the current month and ends after three following months", () => {
    const { from, to } = getCalendarRange(new Date(2026, 6, 28));

    expect(from).toEqual(new Date(2026, 6, 1));
    expect(to).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999));
  });
});

describe("calendar events", () => {
  it("sorts events by start and then title", () => {
    const events = sortCalendarEvents([
      {
        id: "2",
        title: "B",
        startsAt: "2026-08-01T10:00:00.000Z",
        endsAt: "",
        isAllDay: false,
        location: null,
        description: null,
        googleUrl: null,
      },
      {
        id: "1",
        title: "A",
        startsAt: "2026-08-01T10:00:00.000Z",
        endsAt: "",
        isAllDay: false,
        location: null,
        description: null,
        googleUrl: null,
      },
    ]);

    expect(events.map((event) => event.title)).toEqual(["A", "B"]);
  });

  it("hides completed events unless requested", () => {
    const events = [
      {
        id: "past",
        title: "Pasado",
        startsAt: "2026-07-27T10:00:00.000Z",
        endsAt: "2026-07-27T11:00:00.000Z",
        isAllDay: false,
        location: null,
        description: null,
        googleUrl: null,
      },
      {
        id: "future",
        title: "Futuro",
        startsAt: "2026-07-29T10:00:00.000Z",
        endsAt: "2026-07-29T11:00:00.000Z",
        isAllDay: false,
        location: null,
        description: null,
        googleUrl: null,
      },
    ];

    expect(
      filterCalendarEvents(events, {
        includePast: false,
        now: new Date("2026-07-28T12:00:00.000Z"),
      }),
    ).toHaveLength(1);
    expect(filterCalendarEvents(events, { includePast: true })).toHaveLength(2);
  });

  it("turns an embed URL into a Google Calendar app-compatible URL", () => {
    expect(
      normalizeGoogleCalendarUrl(
        "https://calendar.google.com/calendar/embed?src=irati%40group.calendar.google.com&ctz=Europe%2FMadrid",
      ),
    ).toBe("https://calendar.google.com/calendar/u/0/r?cid=irati%40group.calendar.google.com");
  });

  it("reports missing feed configuration", async () => {
    vi.stubEnv("IRATI_GOOGLE_CALENDAR_ICAL_URL", "");
    const { loadCalendarFeed } = await import("./calendar-feed");

    await expect(loadCalendarFeed()).resolves.toMatchObject({ error: "missing-config" });
  });

  it("loads events and expands recurring entries inside the configured range", async () => {
    vi.stubEnv("IRATI_GOOGLE_CALENDAR_ICAL_URL", "https://calendar.test/irati.ics");
    vi.stubEnv("IRATI_GOOGLE_CALENDAR_WEB_URL", "https://calendar.google.com/calendar/u/0/r");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            [
              "BEGIN:VCALENDAR",
              "VERSION:2.0",
              "BEGIN:VEVENT",
              "UID:checkup-1",
              "DTSTART:20260730T100000Z",
              "DTEND:20260730T110000Z",
              "SUMMARY:Revision de Irati",
              "LOCATION:Pediatra",
              "RRULE:FREQ=WEEKLY;COUNT=2",
              "END:VEVENT",
              "END:VCALENDAR",
            ].join("\r\n"),
            { status: 200 },
          ),
        ),
    );

    const { loadCalendarFeed } = await import("./calendar-feed");
    const result = await loadCalendarFeed(new Date(2026, 6, 28));

    expect(result.error).toBeNull();
    expect(result.snapshot?.events).toHaveLength(2);
    expect(result.snapshot?.events[0]).toMatchObject({
      location: "Pediatra",
      title: "Revision de Irati",
    });
  });
});
