import Link from "next/link";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { CachedProfileRepository } from "@/modules/profile/infrastructure/cached-profile-repository";
import { CachedGrowthReadRepository } from "@/modules/growth/infrastructure/cached-growth-repository";
import { GrowthChart } from "@/modules/growth/ui/growth-chart";
import { GrowthCreateSheet } from "@/modules/growth/ui/growth-create-sheet";
import { GrowthHistory } from "@/modules/growth/ui/growth-history";
import type { GrowthEntry, GrowthMetric } from "@/modules/growth/application/growth-chart-series";
import { ToastFeedback, type ToastFeedbackMessage } from "@/shared/ui/toast-feedback";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import {
  createGrowthEntryAction,
  deleteGrowthEntryAction,
  updateGrowthEntryAction,
} from "./actions";
import styles from "../peso/page.module.css";

type GrowthPageProps = {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    tipo?: string;
    updated?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  validation: "Revisa la fecha, la medida y el lugar.",
  save: "No pudimos guardar la medida. Prueba otra vez.",
  delete: "No pudimos borrar la medida. Prueba otra vez.",
  load: "No pudimos cargar las medidas.",
};

export default async function GrowthPage({ searchParams }: GrowthPageProps) {
  const { created, deleted, error, tipo, updated } = await searchParams;

  if (!(await hasValidSession())) return <LoginScreen />;

  const [{ heightEntries, headCircumferenceEntries }, { profile }] = await Promise.all([
    new CachedGrowthReadRepository().listGrowthEntries(),
    getBabyProfile(new CachedProfileRepository()),
  ]);
  const metric: GrowthMetric = tipo === "cabeza" ? "headCircumference" : "height";
  const entries: GrowthEntry[] = metric === "height" ? heightEntries : headCircumferenceEntries;
  const title = metric === "height" ? "Altura" : "Perímetro craneal";
  const feedbackMessages: ToastFeedbackMessage[] = [
    ...(created
      ? [{ id: "created", text: `${title} guardada.`, variant: "success" as const }]
      : []),
    ...(updated
      ? [{ id: "updated", text: `${title} actualizada.`, variant: "success" as const }]
      : []),
    ...(deleted ? [{ id: "deleted", text: `${title} borrada.`, variant: "success" as const }] : []),
    ...(error
      ? [
          {
            id: `error-${error}`,
            text: errorMessages[error] ?? errorMessages.save,
            variant: "error" as const,
          },
        ]
      : []),
  ];

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <p>Medidas</p>
          <h1>Medidas de Irati</h1>
        </header>

        <ToastFeedback messages={feedbackMessages} offset="floatingAction" />

        <section className={styles.panel} aria-labelledby="metric-tabs-title">
          <div className={styles.sectionTitle}>
            <h2 id="metric-tabs-title">Crecimiento</h2>
            <span>{entries.length} registros</span>
          </div>
          <div className={styles.filters} aria-label="Tipo de medida">
            <Link
              aria-current={metric === "height" ? "page" : undefined}
              href="/medidas?tipo=altura"
            >
              Altura
            </Link>
            <Link
              aria-current={metric === "headCircumference" ? "page" : undefined}
              href="/medidas?tipo=cabeza"
            >
              Cabeza
            </Link>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="chart-title">
          <div className={styles.sectionTitle}>
            <h2 id="chart-title">Evolución</h2>
            <span>{title}</span>
          </div>
          {profile ? (
            <GrowthChart
              birthDate={profile.birthDate}
              entries={entries}
              metric={metric}
              title={title}
            />
          ) : null}
        </section>

        <section className={styles.panel} aria-labelledby="history-title">
          <div className={styles.sectionTitle}>
            <h2 id="history-title">Histórico</h2>
            <span>{entries.length} registros</span>
          </div>
          <GrowthTrendPanel entries={entries} metric={metric} />
          <GrowthHistory
            deleteAction={deleteGrowthEntryAction}
            entries={entries}
            metric={metric}
            updateAction={updateGrowthEntryAction}
          />
        </section>
      </main>

      <GrowthCreateSheet action={createGrowthEntryAction} metric={metric} />
    </>
  );
}

function GrowthTrendPanel({ entries, metric }: { entries: GrowthEntry[]; metric: GrowthMetric }) {
  const sorted = [...entries].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn));
  const latest = sorted[0];
  const previous = sorted[1];
  if (!latest) return null;

  const latestValue = getValue(latest, metric);
  const previousValue = previous ? getValue(previous, metric) : null;
  const difference = previousValue === null ? null : latestValue - previousValue;

  return (
    <div
      className={styles.trendSummary}
      aria-label={`Resumen de ${metric === "height" ? "altura" : "perímetro craneal"}`}
    >
      <article>
        <span>Última</span>
        <strong>{latestValue} cm</strong>
      </article>
      <article>
        <span>Fecha</span>
        <strong>{formatDate(latest.measuredOn)}</strong>
      </article>
      <article>
        <span>Cambio</span>
        <strong>
          {difference === null ? "Sin comparación" : `${difference > 0 ? "+" : ""}${difference} cm`}
        </strong>
      </article>
    </div>
  );
}

function getValue(entry: GrowthEntry, metric: GrowthMetric): number {
  return metric === "height"
    ? (entry as Extract<GrowthEntry, { heightCm: number }>).heightCm
    : (entry as Extract<GrowthEntry, { headCircumferenceCm: number }>).headCircumferenceCm;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
