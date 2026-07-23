import Link from "next/link";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { CachedProfileRepository } from "@/modules/profile/infrastructure/cached-profile-repository";
import {
  filterWeightEntries,
  formatWeightFilterLabel,
  isWeightFilter,
  weightFilterValues,
} from "@/modules/weight/application/weight-filter";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { listWeightEntries } from "@/modules/weight/application/list-weight-entries";
import {
  buildWeightTrendSummary,
  WeightTrendSummary,
} from "@/modules/weight/application/weight-trend-summary";
import { CachedWeightReadRepository } from "@/modules/weight/infrastructure/cached-weight-repository";
import { WeightChart } from "@/modules/weight/ui/weight-chart";
import { WeightCreateSheet } from "@/modules/weight/ui/weight-create-sheet";
import { WeightHistory } from "@/modules/weight/ui/weight-history";
import { ToastFeedback, ToastFeedbackMessage } from "@/shared/ui/toast-feedback";
import {
  createWeightEntryAction,
  deleteWeightEntryAction,
  updateWeightEntryAction,
} from "./actions";
import styles from "./page.module.css";

type WeightPageProps = {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    lugar?: string;
    updated?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  validation: "Revisa la fecha, el peso y el lugar.",
  save: "No pudimos guardar el peso. Prueba otra vez.",
  delete: "No pudimos borrar el peso. Prueba otra vez.",
  load: "No pudimos cargar el histórico de pesos.",
};

export default async function WeightPage({ searchParams }: WeightPageProps) {
  const { created, deleted, error, lugar, updated } = await searchParams;

  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const [{ entries, loadError }, { profile }] = await Promise.all([
    getWeightEntries(),
    getBabyProfile(new CachedProfileRepository()),
  ]);
  const currentError = error ?? loadError;
  const activeFilter = isWeightFilter(lugar) ? lugar : "all";
  const filteredEntries = filterWeightEntries(entries, activeFilter);
  const trendSummary = buildWeightTrendSummary(filteredEntries, new Date());
  const feedbackMessages: ToastFeedbackMessage[] = [
    ...(created ? [{ id: "created", text: "Peso guardado.", variant: "success" as const }] : []),
    ...(updated ? [{ id: "updated", text: "Peso actualizado.", variant: "success" as const }] : []),
    ...(deleted ? [{ id: "deleted", text: "Peso borrado.", variant: "success" as const }] : []),
    ...(currentError
      ? [
          {
            id: `error-${currentError}`,
            text: errorMessages[currentError],
            variant: "error" as const,
          },
        ]
      : []),
  ];

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <p>Peso</p>
          <h1>Pesos de Irati</h1>
        </header>

        <ToastFeedback messages={feedbackMessages} offset="floatingAction" />

        <section className={styles.panel} aria-labelledby="chart-title">
          <div className={styles.sectionTitle}>
            <h2 id="chart-title">Evolución</h2>
            <span>{formatWeightFilterLabel(activeFilter)}</span>
          </div>

          <div className={styles.filters} aria-label="Filtrar pesos por lugar">
            {weightFilterValues.map((filter) => (
              <Link
                aria-current={filter === activeFilter ? "page" : undefined}
                href={filter === "all" ? "/peso" : `/peso?lugar=${filter}`}
                key={filter}
              >
                {formatWeightFilterLabel(filter)}
              </Link>
            ))}
          </div>

          <WeightChart birthDate={profile.birthDate} entries={filteredEntries} />
        </section>

        <section className={styles.panel} aria-labelledby="history-title">
          <div className={styles.sectionTitle}>
            <h2 id="history-title">Histórico</h2>
            <span>{filteredEntries.length} registros</span>
          </div>

          <WeightTrendPanel summary={trendSummary} />

          <WeightHistory
            deleteAction={deleteWeightEntryAction}
            entries={filteredEntries}
            updateAction={updateWeightEntryAction}
          />
        </section>
      </main>

      <WeightCreateSheet action={createWeightEntryAction} styles={styles} />
    </>
  );
}

function WeightTrendPanel({ summary }: { summary: WeightTrendSummary }) {
  if (!summary.latest) {
    return null;
  }

  return (
    <div className={styles.trendSummary} aria-label="Resumen de peso">
      <article>
        <span>Último</span>
        <strong>{summary.latest.weightGrams.toLocaleString("es-ES")} g</strong>
      </article>
      <article>
        <span>Hace</span>
        <strong>
          {summary.daysSinceLatest} día{summary.daysSinceLatest === 1 ? "" : "s"}
        </strong>
      </article>
      <article>
        <span>Cambio</span>
        <strong>{formatWeightTrend(summary)}</strong>
      </article>
    </div>
  );
}

function formatWeightTrend(summary: WeightTrendSummary): string {
  if (!summary.previous || summary.differenceGrams === null) {
    return "Sin comparación";
  }

  const sign = summary.differenceGrams > 0 ? "+" : "";

  return `${sign}${summary.differenceGrams.toLocaleString("es-ES")} g`;
}

async function getWeightEntries() {
  try {
    const entries = await listWeightEntries(new CachedWeightReadRepository());

    return { entries, loadError: undefined };
  } catch {
    return { entries: [], loadError: "load" };
  }
}
