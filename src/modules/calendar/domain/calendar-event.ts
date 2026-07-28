export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  location: string | null;
  description: string | null;
  googleUrl: string | null;
};

export type CalendarSnapshot = {
  events: CalendarEvent[];
  fetchedAt: string;
};

export function getCalendarRange(referenceDate = new Date()): { from: Date; to: Date } {
  const from = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const to = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 4,
    0,
    23,
    59,
    59,
    999,
  );

  return { from, to };
}

export function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt) || a.title.localeCompare(b.title),
  );
}

export function filterCalendarEvents(
  events: CalendarEvent[],
  options: { includePast: boolean; now?: Date },
): CalendarEvent[] {
  if (options.includePast) {
    return events;
  }

  const now = options.now ?? new Date();
  return events.filter((event) => new Date(event.endsAt) >= now);
}

export function normalizeGoogleCalendarUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const calendarId =
      url.hostname === "calendar.google.com" && url.pathname === "/calendar/embed"
        ? url.searchParams.get("src")
        : null;

    return calendarId
      ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`
      : value;
  } catch {
    return value;
  }
}
