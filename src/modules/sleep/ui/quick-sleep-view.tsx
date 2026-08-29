"use client";

import { useEffect, useRef, useState } from "react";
import type { SleepEntry, SleepKind } from "../domain/sleep-entry";
import type { ToggleSleepResult } from "../application/toggle-sleep-entry";
import styles from "./quick-sleep-view.module.css";

type QuickSleepViewProps = {
  kind: SleepKind;
  offlineToggle?: (kind: SleepKind) => Promise<ToggleSleepResult>;
};

type ViewState =
  { status: "loading" } | { status: "error" } | { status: "success"; result: ToggleSleepResult };

export function QuickSleepView({ kind, offlineToggle }: QuickSleepViewProps) {
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const hasTriggered = useRef(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    async function toggle() {
      try {
        const nextResult = offlineToggle
          ? await offlineToggle(kind)
          : await toggleOnlineSleep(kind);
        setState({ result: nextResult, status: "success" });
      } catch {
        setState({ status: "error" });
      }
    }

    void toggle();
  }, [kind, offlineToggle]);

  useEffect(() => {
    if (state.status !== "success" || state.result.action !== "started") return;

    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, [state]);

  if (state.status === "loading") {
    return (
      <main className={styles.main} aria-busy="true">
        <div className={styles.card}>
          <span className={styles.spinner} aria-hidden="true" />
          <p className={styles.kicker}>Sueño</p>
          <h1>Registrando…</h1>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className={styles.main}>
        <div className={styles.card} role="alert">
          <p className={styles.kicker}>Sueño</p>
          <h1>No se pudo registrar</h1>
          <p className={styles.message}>Abre Sueño para revisar el estado y volver a intentarlo.</p>
          <a className={styles.backLink} href="/sueno">
            Abrir Sueño
          </a>
        </div>
      </main>
    );
  }

  const result = state.result;
  const isStarted = result.action === "started";
  const timer = isStarted
    ? formatDuration(new Date(result.entry.startedAt), now)
    : formatDuration(new Date(result.entry.startedAt), new Date(result.entry.endedAt!));

  return (
    <main className={styles.main} data-action={result.action}>
      <div className={styles.card}>
        <p className={styles.kicker}>{isStarted ? "Sueño iniciado" : "Sueño terminado"}</p>
        <h1>{formatKind(result.entry.kind)}</h1>
        <output aria-live="polite" className={styles.timer}>
          {timer}
        </output>
        <p className={styles.message}>
          {isStarted ? "Cronómetro en curso" : "Duración registrada"}
        </p>
      </div>
    </main>
  );
}

async function toggleOnlineSleep(kind: SleepKind): Promise<ToggleSleepResult> {
  const response = await fetch("/api/sueno/atajo", {
    body: JSON.stringify({ kind }),
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const result = (await response.json().catch(() => null)) as ToggleSleepResult | null;

  if (!response.ok || !result || !isToggleSleepResult(result)) {
    throw new Error("Quick sleep action failed");
  }

  return result;
}

function isToggleSleepResult(value: ToggleSleepResult): value is ToggleSleepResult {
  return (
    (value.action === "started" || value.action === "stopped") &&
    !!value.entry &&
    typeof value.entry.startedAt === "string" &&
    (value.entry.endedAt === null || typeof value.entry.endedAt === "string")
  );
}

function formatKind(kind: SleepEntry["kind"]): string {
  return kind === "nap" ? "Siesta" : "Noche";
}

function formatDuration(start: Date, end: Date): string {
  const seconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1_000));
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours} h ${String(minutes).padStart(2, "0")} min ${String(remainingSeconds).padStart(2, "0")} s`;
}
