const CALENDAR_TIME_ZONE = "Europe/Madrid";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: CALENDAR_TIME_ZONE,
  year: "numeric",
});

export function formatCalendarDayHeading(date: string, now = new Date()): string {
  const dateKey = date.slice(0, 10);
  const context = getRelativeDayLabel(dateKey, getDateKey(now));
  const fullDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    timeZone: CALENDAR_TIME_ZONE,
    weekday: "long",
  }).format(new Date(`${dateKey}T12:00:00`));

  return context ? `${context} · ${fullDate}` : fullDate;
}

export function formatCalendarEventDate(
  startsAt: string,
  isAllDay: boolean,
  now = new Date(),
): string {
  const dateKey = getDateKey(new Date(startsAt));
  const context = getRelativeDayLabel(dateKey, getDateKey(now));
  const date = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: CALENDAR_TIME_ZONE,
  }).format(new Date(startsAt));

  if (isAllDay) {
    return context ? `${context} · ${date}` : date;
  }

  const time = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CALENDAR_TIME_ZONE,
  }).format(new Date(startsAt));

  return context ? `${context} · ${date}, ${time}` : `${date}, ${time}`;
}

function getRelativeDayLabel(dateKey: string, todayKey: string): string | null {
  const difference = Math.round(
    (Date.parse(`${dateKey}T12:00:00Z`) - Date.parse(`${todayKey}T12:00:00Z`)) /
      (24 * 60 * 60 * 1000),
  );

  if (difference === 0) {
    return "Hoy";
  }

  if (difference === 1) {
    return "Mañana";
  }

  return null;
}

function getDateKey(date: Date): string {
  return dayKeyFormatter.format(date).replaceAll("/", "-");
}
