"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import type { SleepEntry } from "../domain/sleep-entry";
import styles from "@/app/(app)/sueno/page.module.css";

type SleepAction = (formData: FormData) => void | Promise<void>;

type SleepViewProps = {
  createAction?: SleepAction;
  deleteAction?: SleepAction;
  entries?: SleepEntry[];
  updateAction?: SleepAction;
};

type SheetState =
  | { mode: "closed" }
  | { kind: SleepEntry["kind"]; mode: "start" }
  | { mode: "finish"; entry: SleepEntry }
  | { mode: "manual" }
  | { entry: SleepEntry; mode: "edit" }
  | { entry: SleepEntry; mode: "delete" };

export function SleepView({
  createAction,
  deleteAction,
  entries = [],
  updateAction,
}: SleepViewProps) {
  const [sheetState, setSheetState] = useState<SheetState>({ mode: "closed" });
  const [now, setNow] = useState(() => new Date());
  const activeEntry = entries.find((entry) => entry.endedAt === null) ?? null;
  const completedEntries = useMemo(
    () => entries.filter((entry) => entry.endedAt !== null),
    [entries],
  );
  const todayEntries = completedEntries.filter((entry) => isToday(entry.startedAt));
  const dayGroups = groupByDay(completedEntries);
  const lastEnd = completedEntries[0]?.endedAt;

  useEffect(() => {
    if (!activeEntry) {
      return;
    }

    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, [activeEntry]);

  async function submit(action: SleepAction | undefined, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) {
      return;
    }

    setSheetState({ mode: "closed" });
    const formData = new FormData(event.currentTarget);
    const startedAt = readLocalDateTime(formData, "startedOn", "startedTime");
    const endedAt = readLocalDateTime(formData, "endedOn", "endedTime");

    if (startedAt) {
      formData.set("startedAt", startedAt);
    }

    formData.set("endedAt", endedAt ?? "");
    await action(formData);
  }

  return (
    <>
      <section className={styles.panel} aria-labelledby="sleep-now-title">
        <div className={styles.sectionTitle}>
          <h2 id="sleep-now-title">Ahora</h2>
          <span>{formatLongDate(now)}</span>
        </div>

        {activeEntry ? (
          <div className={styles.activeCard}>
            <div>
              <p>{activeEntry.kind === "nap" ? "Siesta en curso" : "Noche en curso"}</p>
              <h3>Durmiendo desde {formatTime(activeEntry.startedAt)}</h3>
            </div>
            <output aria-live="polite" className={styles.timer}>
              {formatLiveDuration(new Date(activeEntry.startedAt), now)}
            </output>
            <button
              className={styles.secondaryButton}
              onClick={() => setSheetState({ entry: activeEntry, mode: "finish" })}
              type="button"
            >
              Finalizar sueño
            </button>
          </div>
        ) : (
          <>
            <div className={styles.awakeCard}>
              <strong>
                {lastEnd ? `Despierta desde las ${formatTime(lastEnd)}` : "Despierta"}
              </strong>
              <span className={styles.sleepMeta}>
                {lastEnd
                  ? "Cuando vuelva a dormirse, inicia un nuevo descanso."
                  : "Aún no hay descansos anotados."}
              </span>
            </div>
            <div className={styles.startButtons}>
              <button
                className={styles.startButton}
                onClick={() => setSheetState({ kind: "nap", mode: "start" })}
                type="button"
              >
                Iniciar siesta
              </button>
              <button
                className={styles.startButton}
                onClick={() => setSheetState({ kind: "night", mode: "start" })}
                type="button"
              >
                Iniciar noche
              </button>
            </div>
          </>
        )}
        <button
          className={styles.manualButton}
          onClick={() => setSheetState({ mode: "manual" })}
          type="button"
        >
          Añadir descanso manualmente
        </button>
      </section>

      <section className={styles.panel} aria-labelledby="today-title">
        <div className={styles.sectionTitle}>
          <h2 id="today-title">Resumen de hoy</h2>
          <span>{todayEntries.length} descansos</span>
        </div>
        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span>Tiempo dormido</span>
            <strong>{formatTotalDuration(todayEntries)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Siestas</span>
            <strong>{todayEntries.filter((entry) => entry.kind === "nap").length}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Sueño nocturno</span>
            <strong>
              {formatTotalDuration(todayEntries.filter((entry) => entry.kind === "night"))}
            </strong>
          </article>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="history-title">
        <div className={styles.sectionTitle}>
          <h2 id="history-title">Historial</h2>
          <span>{completedEntries.length} registros</span>
        </div>
        {dayGroups.length ? (
          <ol className={styles.history}>
            {dayGroups.map((group) => (
              <li className={styles.dayGroup} key={group.day}>
                <div className={styles.dayHeader}>
                  <h3>{formatDay(group.day)}</h3>
                  <span>{formatTotalDuration(group.entries)}</span>
                </div>
                <div className={styles.dayEntries}>
                  {group.entries.map((entry) => (
                    <article className={styles.entry} data-kind={entry.kind} key={entry.id}>
                      <div className={styles.entryBody}>
                        <strong className={styles.entryTitle}>
                          {entry.kind === "nap" ? "Siesta" : "Noche"}
                        </strong>
                        <span className={styles.sleepMeta}>
                          {formatTime(entry.startedAt)} –{" "}
                          {entry.endedAt ? formatTime(entry.endedAt) : "en curso"} ·{" "}
                          {formatDurationEntry(entry)}
                        </span>
                      </div>
                      <div className={styles.entryActions}>
                        <button
                          aria-label={`Editar ${entry.kind === "nap" ? "siesta" : "noche"} de ${formatDay(entry.startedAt)}`}
                          className={styles.iconButton}
                          onClick={() => setSheetState({ entry, mode: "edit" })}
                          type="button"
                        >
                          <EditIcon />
                        </button>
                        <button
                          aria-label={`Borrar ${entry.kind === "nap" ? "siesta" : "noche"} de ${formatDay(entry.startedAt)}`}
                          className={`${styles.iconButton} ${styles.deleteButton}`}
                          onClick={() => setSheetState({ entry, mode: "delete" })}
                          type="button"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>
            Los descansos que termines aparecerán aquí, ordenados por día.
          </p>
        )}
      </section>

      <SleepSheets
        createAction={createAction}
        deleteAction={deleteAction}
        onClose={() => setSheetState({ mode: "closed" })}
        onSubmit={submit}
        state={sheetState}
        updateAction={updateAction}
      />
    </>
  );
}

function SleepSheets({
  createAction,
  deleteAction,
  onClose,
  onSubmit,
  state,
  updateAction,
}: {
  createAction?: SleepAction;
  deleteAction?: SleepAction;
  onClose: () => void;
  onSubmit: (action: SleepAction | undefined, event: FormEvent<HTMLFormElement>) => Promise<void>;
  state: SheetState;
  updateAction?: SleepAction;
}) {
  if (state.mode === "closed") return null;
  if (state.mode === "start")
    return (
      <SleepFormSheet
        action={createAction}
        defaultKind={state.kind}
        onClose={onClose}
        onSubmit={onSubmit}
        startingOnly
        title={`Iniciar ${state.kind === "nap" ? "siesta" : "noche"}`}
      />
    );
  if (state.mode === "manual")
    return (
      <SleepFormSheet
        action={createAction}
        onClose={onClose}
        onSubmit={onSubmit}
        title="Añadir descanso"
      />
    );
  if (state.mode === "finish")
    return (
      <SleepFormSheet
        action={updateAction}
        entry={state.entry}
        onClose={onClose}
        onSubmit={onSubmit}
        title="Finalizar sueño"
        finishOnly
      />
    );
  if (state.mode === "edit")
    return (
      <SleepFormSheet
        action={updateAction}
        entry={state.entry}
        onClose={onClose}
        onSubmit={onSubmit}
        title="Editar descanso"
      />
    );

  return (
    <BottomSheet
      ariaLabel="Cerrar borrado de descanso"
      labelledBy="delete-sleep-title"
      onClose={onClose}
      styles={styles}
    >
      <form className={styles.sheetBody} onSubmit={(event) => onSubmit(deleteAction, event)}>
        <div className={styles.sheetHeader}>
          <p>Sueño</p>
          <h2 id="delete-sleep-title">¿Borrar descanso?</h2>
        </div>
        <p>Este registro se eliminará del historial.</p>
        <input name="id" type="hidden" value={state.entry.id} />
        <div className={styles.sheetActions}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className={styles.primaryButton} type="submit">
            Borrar
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

function SleepFormSheet({
  action,
  defaultKind = "nap",
  entry,
  finishOnly = false,
  onClose,
  onSubmit,
  startingOnly = false,
  title,
}: {
  action?: SleepAction;
  defaultKind?: SleepEntry["kind"];
  entry?: SleepEntry;
  finishOnly?: boolean;
  onClose: () => void;
  onSubmit: (action: SleepAction | undefined, event: FormEvent<HTMLFormElement>) => Promise<void>;
  startingOnly?: boolean;
  title: string;
}) {
  const [kind, setKind] = useState<SleepEntry["kind"]>(entry?.kind ?? defaultKind);
  const now = new Date();
  const start = entry ? new Date(entry.startedAt) : now;
  const end = entry?.endedAt ? new Date(entry.endedAt) : now;
  return (
    <BottomSheet
      ariaLabel={`Cerrar ${title.toLowerCase()}`}
      labelledBy="sleep-form-title"
      onClose={onClose}
      styles={styles}
    >
      <form className={styles.sheetBody} onSubmit={(event) => onSubmit(action, event)}>
        <div className={styles.sheetHeader}>
          <p>Sueño</p>
          <h2 id="sleep-form-title">{title}</h2>
        </div>
        {entry ? <input name="id" type="hidden" value={entry.id} /> : null}
        {entry && finishOnly ? (
          <input name="startedAt" type="hidden" value={entry.startedAt} />
        ) : null}
        <input name="kind" type="hidden" value={kind} />
        {!finishOnly ? (
          <div className={styles.kindChoices}>
            <button aria-pressed={kind === "nap"} onClick={() => setKind("nap")} type="button">
              Siesta
            </button>
            <button aria-pressed={kind === "night"} onClick={() => setKind("night")} type="button">
              Noche
            </button>
          </div>
        ) : null}
        <div className={styles.sheetFields}>
          {!finishOnly ? (
            <>
              <label>
                Fecha de inicio
                <input defaultValue={dateValue(start)} name="startedOn" required type="date" />
              </label>
              <label>
                Hora de inicio
                <input defaultValue={timeValue(start)} name="startedTime" required type="time" />
              </label>
            </>
          ) : null}
          {!startingOnly ? (
            <>
              <label>
                Fecha de finalización
                <input defaultValue={dateValue(end)} name="endedOn" required type="date" />
              </label>
              <label>
                Hora de finalización
                <input defaultValue={timeValue(end)} name="endedTime" required type="time" />
              </label>
            </>
          ) : null}
        </div>
        <div className={styles.sheetActions}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className={styles.primaryButton} type="submit">
            {finishOnly ? "Finalizar" : startingOnly ? "Iniciar" : "Guardar"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

function groupByDay(entries: SleepEntry[]) {
  const groups = new Map<string, SleepEntry[]>();
  for (const entry of entries) {
    const day = dateValue(new Date(entry.startedAt));
    groups.set(day, [...(groups.get(day) ?? []), entry]);
  }
  return [...groups].map(([day, groupedEntries]) => ({ day, entries: groupedEntries }));
}
function isToday(date: string) {
  return dateValue(new Date(date)) === dateValue(new Date());
}
function formatDuration(start: Date, end: Date) {
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}
function formatLiveDuration(start: Date, end: Date) {
  const seconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1_000));
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours} h ${String(minutes).padStart(2, "0")} min ${String(remainingSeconds).padStart(2, "0")} s`;
}
function formatDurationEntry(entry: SleepEntry) {
  return entry.endedAt
    ? formatDuration(new Date(entry.startedAt), new Date(entry.endedAt))
    : "En curso";
}
function formatTotalDuration(entries: SleepEntry[]) {
  const minutes = entries.reduce(
    (total, entry) =>
      total +
      (entry.endedAt
        ? Math.max(
            0,
            (new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime()) / 60000,
          )
        : 0),
    0,
  );
  return `${Math.floor(minutes / 60)} h ${String(Math.round(minutes % 60)).padStart(2, "0")} min`;
}
function formatTime(date: string) {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(date),
  );
}
function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);
}
function formatDay(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date.slice(0, 10)}T12:00:00`));
}
function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function timeValue(date: Date) {
  return date.toTimeString().slice(0, 5);
}

function readLocalDateTime(formData: FormData, dateField: string, timeField: string) {
  const date = String(formData.get(dateField) ?? "");
  const time = String(formData.get(timeField) ?? "");

  if (!date || !time) {
    return null;
  }

  return new Date(`${date}T${time}`).toISOString();
}
function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m4 16.5-.5 4 4-.5L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.8 6.7 3.5 3.5" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}
