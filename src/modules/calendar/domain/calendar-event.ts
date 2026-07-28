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
