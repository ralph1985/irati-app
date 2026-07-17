import Link from "next/link";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { listPlannedVaccineDoses } from "@/modules/vaccines/application/list-planned-vaccine-doses";
import { madridVaccineCalendarSource } from "@/modules/vaccines/domain/vaccine-calendar";
import { SupabaseVaccinePlanRepository } from "@/modules/vaccines/infrastructure/supabase-vaccine-plan-repository";
import { PlannedVaccineList } from "@/modules/vaccines/ui/planned-vaccine-list";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import { updatePlannedVaccineDoseAction } from "./actions";
import styles from "./page.module.css";

type VaccinesPageProps = {
  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  validation: "Revisa la vacuna, la dosis y la fecha planificada.",
  save: "No se pudo guardar la planificacion. Prueba otra vez.",
  load: "No se pudo cargar el calendario de vacunas.",
};

export default async function VaccinesPage({ searchParams }: VaccinesPageProps) {
  const { error, updated } = await searchParams;

  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { doses, loadError } = await getPlannedDoses();
  const currentError = error ?? loadError;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p>Vacunas</p>
          <h1>Calendario de Irati</h1>
        </header>

        <section className={styles.panel} aria-labelledby="source-title">
          <div className={styles.sectionTitle}>
            <h2 id="source-title">Fuente verificada</h2>
            <span>{madridVaccineCalendarSource.verifiedOn}</span>
          </div>
          <p className={styles.copy}>
            Calendario 2026 de la Comunidad de Madrid. Las fechas iniciales estan calculadas desde
            el nacimiento de Irati y se pueden ajustar manualmente.
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="planned-doses-title">
          <div className={styles.sectionTitle}>
            <h2 id="planned-doses-title">Dosis planificadas</h2>
            <span>{doses.length} dosis</span>
          </div>

          {updated ? <p className={styles.success}>Planificacion actualizada.</p> : null}
          {currentError ? <p className={styles.error}>{errorMessages[currentError]}</p> : null}

          <PlannedVaccineList doses={doses} updateAction={updatePlannedVaccineDoseAction} />
        </section>
      </main>

      <nav className={styles.nav} aria-label="Navegacion principal">
        <Link href="/">Inicio</Link>
        <Link href="/peso">Peso</Link>
        <Link aria-current="page" href="/vacunas">
          Vacunas
        </Link>
        <Link href="/ajustes">Ajustes</Link>
      </nav>
    </div>
  );
}

async function getPlannedDoses() {
  try {
    const doses = await listPlannedVaccineDoses(
      new SupabaseVaccinePlanRepository(createServerSupabaseClient()),
    );

    return { doses, loadError: undefined };
  } catch {
    return { doses: [], loadError: "load" };
  }
}
