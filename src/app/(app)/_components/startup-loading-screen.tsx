"use client";

import { useEffect, useState } from "react";
import styles from "./startup-loading-screen.module.css";

const MAX_PENDING_PROGRESS = 94;

export function StartupLoadingScreen() {
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= MAX_PENDING_PROGRESS) {
          return current;
        }

        const remaining = MAX_PENDING_PROGRESS - current;
        const step = Math.max(1, Math.ceil(remaining * 0.12));

        return Math.min(MAX_PENDING_PROGRESS, current + step);
      });
    }, 220);

    return () => window.clearInterval(timer);
  }, []);

  const status = getLoadingStatus(progress);

  return (
    <main className={styles.screen} aria-labelledby="startup-loading-title">
      <section className={styles.panel} aria-live="polite" aria-busy="true">
        <p className={styles.kicker}>Irati</p>
        <h1 id="startup-loading-title">Preparando la app</h1>
        <p className={styles.status}>{status}</p>

        <div className={styles.progressHeader}>
          <span>Carga estimada</span>
          <strong>{progress}%</strong>
        </div>
        <div
          aria-label={`Carga estimada ${progress}%`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className={styles.progressTrack}
          role="progressbar"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>
    </main>
  );
}

function getLoadingStatus(progress: number) {
  if (progress < 42) {
    return "Comprobando acceso...";
  }

  if (progress < 72) {
    return "Preparando datos familiares...";
  }

  return "Montando la pantalla...";
}
