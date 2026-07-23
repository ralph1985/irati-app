"use client";

import { useEffect, useState } from "react";
import styles from "./startup-loading-screen.module.css";

const loadingSteps = [
  { label: "Acceso", status: "Comprobando la sesión." },
  { label: "Peso", status: "Cargando el peso." },
  { label: "Vacunas", status: "Cargando el calendario." },
] as const;

export function StartupLoadingScreen() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % loadingSteps.length);
    }, 1100);

    return () => window.clearInterval(timer);
  }, []);

  const status = loadingSteps[activeStep].status;

  return (
    <main className={styles.screen} aria-labelledby="startup-loading-title">
      <section className={styles.panel} aria-live="polite" aria-busy="true">
        <div className={styles.brand}>
          <span aria-hidden="true">I</span>
          <p>Irati</p>
        </div>
        <h1 id="startup-loading-title">Preparando Irati</h1>
        <p className={styles.status}>{status}</p>

        <div className={styles.checks} aria-label="Qué se está preparando">
          {loadingSteps.map((step, index) => (
            <span data-active={index <= activeStep} key={step.label}>
              {step.label}
            </span>
          ))}
        </div>

        <div
          aria-label="Preparando la aplicación"
          className={styles.progressTrack}
          role="progressbar"
        >
          <span />
        </div>
      </section>
    </main>
  );
}
