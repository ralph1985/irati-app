import Link from "next/link";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import {
  filterWeightEntries,
  formatWeightFilterLabel,
  isWeightFilter,
  weightFilterValues,
} from "@/modules/weight/application/weight-filter";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { listWeightEntries } from "@/modules/weight/application/list-weight-entries";
import { CachedWeightReadRepository } from "@/modules/weight/infrastructure/cached-weight-repository";
import { WeightChart } from "@/modules/weight/ui/weight-chart";
import { WeightCreateSheet } from "@/modules/weight/ui/weight-create-sheet";
import { WeightHistory } from "@/modules/weight/ui/weight-history";
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
  save: "No se pudo guardar el peso. Prueba otra vez.",
  delete: "No se pudo borrar el peso. Prueba otra vez.",
  load: "No se pudo cargar el historico de pesos.",
};

export default async function WeightPage({ searchParams }: WeightPageProps) {
  const { created, deleted, error, lugar, updated } = await searchParams;

  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { entries, loadError } = await getWeightEntries();
  const currentError = error ?? loadError;
  const activeFilter = isWeightFilter(lugar) ? lugar : "all";
  const filteredEntries = filterWeightEntries(entries, activeFilter);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p>Peso</p>
          <h1>Registro de peso</h1>
        </header>

        {created || updated || deleted || currentError ? (
          <section className={styles.feedback} aria-live="polite">
            {created ? <p className={styles.success}>Peso guardado.</p> : null}
            {updated ? <p className={styles.success}>Peso actualizado.</p> : null}
            {deleted ? <p className={styles.success}>Peso borrado.</p> : null}
            {currentError ? <p className={styles.error}>{errorMessages[currentError]}</p> : null}
          </section>
        ) : null}

        <section className={styles.panel} aria-labelledby="chart-title">
          <div className={styles.sectionTitle}>
            <h2 id="chart-title">Evolucion</h2>
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

          <WeightChart entries={filteredEntries} />
        </section>

        <section className={styles.panel} aria-labelledby="history-title">
          <div className={styles.sectionTitle}>
            <h2 id="history-title">Historico</h2>
            <span>{filteredEntries.length} registros</span>
          </div>

          <WeightHistory
            deleteAction={deleteWeightEntryAction}
            entries={filteredEntries}
            updateAction={updateWeightEntryAction}
          />
        </section>
      </main>

      <nav className={styles.nav} aria-label="Navegacion principal">
        <Link href="/">Inicio</Link>
        <Link aria-current="page" href="/peso">
          Peso
        </Link>
        <Link href="/vacunas">Vacunas</Link>
        <Link href="/ajustes">Ajustes</Link>
      </nav>
      <WeightCreateSheet action={createWeightEntryAction} styles={styles} />
    </div>
  );
}

async function getWeightEntries() {
  try {
    const entries = await listWeightEntries(new CachedWeightReadRepository());

    return { entries, loadError: undefined };
  } catch {
    return { entries: [], loadError: "load" };
  }
}
