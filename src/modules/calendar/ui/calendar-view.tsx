"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import {
  readCalendarSnapshot,
  replaceCalendarSnapshot,
} from "@/shared/infrastructure/offline/irati-offline-db";
import type { CalendarEvent, CalendarSnapshot } from "@/modules/calendar/domain/calendar-event";
import { filterCalendarEvents } from "@/modules/calendar/domain/calendar-event";
import styles from "./calendar-view.module.css";

type CalendarViewProps = {
  googleUrl: string | null;
  initialError: string | null;
  initialSnapshot: CalendarSnapshot | null;
};

type ViewMode = "agenda" | "month";

export function CalendarView({ googleUrl, initialError, initialSnapshot }: CalendarViewProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [error, setError] = useState(initialError);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [includePastEvents, setIncludePastEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const localSnapshot = await readCalendarSnapshot();

      if (!active) {
        return;
      }

      if (initialSnapshot) {
        await replaceCalendarSnapshot(initialSnapshot);
      } else if (localSnapshot) {
        setSnapshot(localSnapshot);
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [initialSnapshot]);

  async function refresh() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/calendar", { cache: "no-store" });
      const result = (await response.json()) as {
        error: string | null;
        snapshot: CalendarSnapshot | null;
      };

      if (!response.ok || !result.snapshot) {
        setError(result.error ?? "unavailable");
        return;
      }

      setSnapshot(result.snapshot);
      setError(null);
      await replaceCalendarSnapshot(result.snapshot);
    } catch {
      setError("unavailable");
    } finally {
      setIsRefreshing(false);
    }
  }

  const events = snapshot?.events ?? [];
  const visibleEvents = filterCalendarEvents(events, { includePast: includePastEvents });
  const hasPastEvents = visibleEvents.length < events.length;
  const hasStaleData = Boolean(error && snapshot);

  return (
    <>
      <section className={styles.panel} aria-labelledby="calendar-view-title">
        <div className={styles.toolbar}>
          <div className={styles.segmentedControl} aria-label="Cambiar vista">
            <button
              aria-pressed={viewMode === "agenda"}
              className={viewMode === "agenda" ? styles.selected : undefined}
              onClick={() => setViewMode("agenda")}
              type="button"
            >
              Agenda
            </button>
            <button
              aria-pressed={viewMode === "month"}
              className={viewMode === "month" ? styles.selected : undefined}
              onClick={() => setViewMode("month")}
              type="button"
            >
              Mes
            </button>
          </div>
          <button
            className={styles.refreshButton}
            disabled={isRefreshing}
            onClick={refresh}
            type="button"
          >
            {isRefreshing ? "Actualizando…" : "Actualizar"}
          </button>
          {hasPastEvents || includePastEvents ? (
            <button
              className={styles.pastButton}
              onClick={() => setIncludePastEvents((current) => !current)}
              type="button"
            >
              {includePastEvents ? "Ocultar pasados" : "Mostrar pasados"}
            </button>
          ) : null}
        </div>

        {hasStaleData ? (
          <p className={styles.warning} role="status">
            No se pudo actualizar. Mostrando la última copia del{" "}
            {formatDateTime(snapshot!.fetchedAt)}.
          </p>
        ) : null}

        {!snapshot && error ? (
          <div className={styles.emptyState} role="status">
            <strong>No podemos cargar el calendario</strong>
            <p>Comprueba la conexión o vuelve a intentarlo.</p>
            <button className={styles.primaryButton} onClick={refresh} type="button">
              Intentar de nuevo
            </button>
          </div>
        ) : null}

        {snapshot && visibleEvents.length === 0 ? (
          <p className={styles.emptyState}>
            {events.length > 0
              ? "No hay eventos próximos. Puedes mostrar los eventos pasados."
              : "No hay eventos en el mes actual ni en los próximos tres meses."}
          </p>
        ) : null}

        {snapshot && visibleEvents.length > 0 && viewMode === "agenda" ? (
          <Agenda events={visibleEvents} onSelect={setSelectedEvent} />
        ) : null}

        {snapshot && visibleEvents.length > 0 && viewMode === "month" ? (
          <MonthCalendar events={visibleEvents} onSelect={setSelectedEvent} />
        ) : null}

        {snapshot ? (
          <p className={styles.updatedAt}>
            Última actualización: {formatDateTime(snapshot.fetchedAt)}
          </p>
        ) : null}
      </section>

      {googleUrl ? (
        <a className={styles.googleLink} href={googleUrl}>
          Abrir el calendario de Google
        </a>
      ) : null}

      {selectedEvent ? (
        <BottomSheet
          ariaLabel="Detalle del evento"
          labelledBy="calendar-event-title"
          onClose={() => setSelectedEvent(null)}
          styles={styles}
        >
          <div className={styles.sheetContent}>
            <p className={styles.sheetKicker}>Evento</p>
            <h2 id="calendar-event-title">{selectedEvent.title}</h2>
            <dl className={styles.details}>
              <div>
                <dt>Cuándo</dt>
                <dd>{formatEventDate(selectedEvent)}</dd>
              </div>
              {selectedEvent.location ? (
                <div>
                  <dt>Dónde</dt>
                  <dd>{selectedEvent.location}</dd>
                </div>
              ) : null}
              {selectedEvent.description ? (
                <div>
                  <dt>Notas</dt>
                  <dd>{selectedEvent.description}</dd>
                </div>
              ) : null}
            </dl>
            {selectedEvent.googleUrl ? (
              <a className={styles.primaryButton} href={selectedEvent.googleUrl}>
                Abrir en Google Calendar
              </a>
            ) : null}
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}

function Agenda({
  events,
  onSelect,
}: {
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
}) {
  const groups = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const key = event.startsAt.slice(0, 10);
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    }

    return [...grouped.entries()];
  }, [events]);

  return (
    <div className={styles.agenda}>
      {groups.map(([date, dateEvents]) => (
        <section className={styles.day} key={date}>
          <h2>{formatDayHeading(date)}</h2>
          <ul>
            {dateEvents.map((event) => (
              <li key={event.id}>
                <button
                  className={styles.eventButton}
                  onClick={() => onSelect(event)}
                  type="button"
                >
                  <span className={styles.eventTime}>{formatEventTime(event)}</span>
                  <span className={styles.eventBody}>
                    <strong>{event.title}</strong>
                    {event.location ? <small>{event.location}</small> : null}
                  </span>
                  <span aria-hidden="true" className={styles.chevron}>
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MonthCalendar({
  events,
  onSelect,
}: {
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
}) {
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const days = useMemo(() => buildMonthDays(year, month), [month, year]);
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const key = event.startsAt.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), event]);
    }

    return map;
  }, [events]);

  function moveMonth(offset: number) {
    const next = new Date(year, month + offset, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  }

  return (
    <div className={styles.monthView}>
      <div className={styles.monthHeader}>
        <button aria-label="Mes anterior" onClick={() => moveMonth(-1)} type="button">
          ‹
        </button>
        <h2>
          {new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
            new Date(year, month, 1),
          )}
        </h2>
        <button aria-label="Mes siguiente" onClick={() => moveMonth(1)} type="button">
          ›
        </button>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {(["L", "M", "X", "J", "V", "S", "D"] as const).map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className={styles.monthGrid}>
        {days.map((day) => {
          const dayEvents = eventMap.get(day.key) ?? [];

          return (
            <div
              className={`${styles.monthDay} ${day.inMonth ? "" : styles.outsideMonth}`}
              key={day.key}
            >
              <span>{day.day}</span>
              {dayEvents.slice(0, 2).map((event) => (
                <button
                  key={event.id}
                  onClick={() => onSelect(event)}
                  type="button"
                  title={event.title}
                >
                  {event.title}
                </button>
              ))}
              {dayEvents.length > 2 ? <small>+{dayEvents.length - 2} más</small> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - startOffset + 1);
    return {
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      key: toDateKey(date),
    };
  }).slice(0, Math.ceil((startOffset + daysInMonth) / 7) * 7);
}

function formatEventDate(event: CalendarEvent): string {
  if (event.isAllDay) {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "full" }).format(new Date(event.startsAt));
  }

  return new Intl.DateTimeFormat("es-ES", { dateStyle: "full", timeStyle: "short" }).format(
    new Date(event.startsAt),
  );
}

function formatEventTime(event: CalendarEvent): string {
  if (event.isAllDay) {
    return "Todo el día";
  }

  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(event.startsAt),
  );
}

function formatDayHeading(date: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "full" }).format(
    new Date(`${date}T12:00:00`),
  );
}

function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(date),
  );
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
