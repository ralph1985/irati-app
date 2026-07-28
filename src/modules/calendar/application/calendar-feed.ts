import ical, { type CalendarResponse, type VEvent } from "node-ical";
import {
  buildGoogleCalendarEventUrl,
  getCalendarRange,
  normalizeGoogleCalendarUrl,
  sortCalendarEvents,
  type CalendarEvent,
  type CalendarSnapshot,
} from "../domain/calendar-event";

export type CalendarFeedResult =
  | { snapshot: CalendarSnapshot; error: null; googleUrl: string | null }
  | { snapshot: null; error: string; googleUrl: string | null };

export async function loadCalendarFeed(referenceDate = new Date()): Promise<CalendarFeedResult> {
  const icalUrl = process.env.IRATI_GOOGLE_CALENDAR_ICAL_URL;
  const googleUrl = normalizeGoogleCalendarUrl(process.env.IRATI_GOOGLE_CALENDAR_WEB_URL ?? null);

  if (!icalUrl) {
    return { error: "missing-config", googleUrl, snapshot: null };
  }

  try {
    const response = await fetch(icalUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return { error: "unavailable", googleUrl, snapshot: null };
    }

    const calendar = ical.parseICS(await response.text());
    const { from, to } = getCalendarRange(referenceDate);
    const events = parseEvents(calendar, from, to, googleUrl);

    return {
      error: null,
      googleUrl,
      snapshot: {
        events: sortCalendarEvents(events),
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch {
    return { error: "unavailable", googleUrl, snapshot: null };
  }
}

function parseEvents(
  calendar: CalendarResponse,
  from: Date,
  to: Date,
  googleUrl: string | null,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const component of Object.values(calendar)) {
    if (!component || component.type !== "VEVENT") {
      continue;
    }

    const event = component as VEvent;
    const instances = event.rrule
      ? ical.expandRecurringEvent(event, {
          from: event.start < from ? event.start : from,
          to,
          expandOngoing: true,
        })
      : [
          {
            end: event.end ?? event.start,
            event,
            isAllDay: event.datetype === "date",
            isOverride: false,
            isRecurring: false,
            start: event.start,
          },
        ];

    for (const instance of instances) {
      if (instance.start > to) {
        continue;
      }

      const instanceEvent = instance.event;
      events.push({
        description: readText(instanceEvent.description),
        endsAt: instance.end.toISOString(),
        googleUrl:
          readText(instanceEvent.url) ??
          buildGoogleCalendarEventUrl(instanceEvent.uid, googleUrl) ??
          googleUrl,
        id: `${event.uid}-${instance.start.toISOString()}`,
        isAllDay: "isAllDay" in instance ? instance.isAllDay : instanceEvent.datetype === "date",
        location: readText(instanceEvent.location),
        startsAt: instance.start.toISOString(),
        title: readText(instanceEvent.summary) ?? "Evento sin título",
      });
    }
  }

  return events;
}

function readText(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (value && typeof value === "object" && "val" in value) {
    const text = (value as { val?: unknown }).val;
    return typeof text === "string" ? text.trim() || null : null;
  }

  return null;
}
