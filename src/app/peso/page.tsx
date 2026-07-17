import Link from "next/link";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { listWeightEntries } from "@/modules/weight/application/list-weight-entries";
import { SupabaseWeightRepository } from "@/modules/weight/infrastructure/supabase-weight-repository";
import { WeightHistory } from "@/modules/weight/ui/weight-history";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
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
  const { created, deleted, error, updated } = await searchParams;

  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { entries, loadError } = await getWeightEntries();
  const currentError = error ?? loadError;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p>Peso</p>
          <h1>Registro de peso</h1>
        </header>

        <section className={styles.panel} aria-labelledby="new-weight-title">
          <h2 id="new-weight-title">Nuevo peso</h2>
          <form className={styles.form} action={createWeightEntryAction}>
            <label>
              Fecha
              <input name="measuredOn" required type="date" />
            </label>

            <label>
              Gramos
              <input
                inputMode="numeric"
                min="1000"
                max="20000"
                name="weightGrams"
                required
                type="number"
              />
            </label>

            <label>
              Lugar
              <select name="place" required defaultValue="pediatra">
                <option value="hospital">Hospital</option>
                <option value="pediatra">Pediatra</option>
                <option value="farmacia">Farmacia</option>
              </select>
            </label>

            <label className={styles.full}>
              Notas
              <textarea name="notes" rows={3} />
            </label>

            {created ? <p className={styles.success}>Peso guardado.</p> : null}
            {updated ? <p className={styles.success}>Peso actualizado.</p> : null}
            {deleted ? <p className={styles.success}>Peso borrado.</p> : null}
            {currentError ? <p className={styles.error}>{errorMessages[currentError]}</p> : null}

            <button type="submit">Guardar peso</button>
          </form>
        </section>

        <section className={styles.panel} aria-labelledby="history-title">
          <div className={styles.sectionTitle}>
            <h2 id="history-title">Historico</h2>
            <span>{entries.length} registros</span>
          </div>

          <WeightHistory
            deleteAction={deleteWeightEntryAction}
            entries={entries}
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
    </div>
  );
}

async function getWeightEntries() {
  try {
    const entries = await listWeightEntries(
      new SupabaseWeightRepository(createServerSupabaseClient()),
    );

    return { entries, loadError: undefined };
  } catch {
    return { entries: [], loadError: "load" };
  }
}
