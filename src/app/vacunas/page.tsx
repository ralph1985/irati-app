import Link from "next/link";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { listVaccinePlan } from "@/modules/vaccines/application/list-vaccine-plan";
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

  const { plan, loadError } = await getVaccinePlan();
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
            <span>{plan.summary.total} dosis</span>
          </div>

          <div className={styles.statusSummary} aria-label="Resumen por estado">
            <article data-status="retrasada">
              <span>Retrasadas</span>
              <strong>{plan.summary.retrasada}</strong>
            </article>
            <article data-status="proxima">
              <span>Proximas</span>
              <strong>{plan.summary.proxima}</strong>
            </article>
            <article data-status="pendiente">
              <span>Pendientes</span>
              <strong>{plan.summary.pendiente}</strong>
            </article>
            <article data-status="aplicada">
              <span>Aplicadas</span>
              <strong>{plan.summary.aplicada}</strong>
            </article>
          </div>

          {updated ? <p className={styles.success}>Planificacion actualizada.</p> : null}
          {currentError ? <p className={styles.error}>{errorMessages[currentError]}</p> : null}

          <PlannedVaccineList groups={plan.groups} updateAction={updatePlannedVaccineDoseAction} />
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

async function getVaccinePlan() {
  try {
    const plan = await listVaccinePlan(
      new SupabaseVaccinePlanRepository(createServerSupabaseClient()),
      new Date(),
    );

    return { plan, loadError: undefined };
  } catch {
    return {
      plan: {
        doses: [],
        groups: {
          retrasada: [],
          proxima: [],
          pendiente: [],
          aplicada: [],
        },
        summary: {
          total: 0,
          retrasada: 0,
          proxima: 0,
          pendiente: 0,
          aplicada: 0,
        },
      },
      loadError: "load",
    };
  }
}
