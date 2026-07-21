import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { listVaccinePlan } from "@/modules/vaccines/application/list-vaccine-plan";
import { groupPlannedVaccineDosesByAge } from "@/modules/vaccines/application/vaccine-plan-views";
import { madridVaccineCalendarSource } from "@/modules/vaccines/domain/vaccine-calendar";
import { CachedVaccinePlanReadRepository } from "@/modules/vaccines/infrastructure/cached-vaccine-plan-read-repository";
import { PlannedVaccineList } from "@/modules/vaccines/ui/planned-vaccine-list";
import { ToastFeedback, ToastFeedbackMessage } from "@/shared/ui/toast-feedback";
import Link from "next/link";
import {
  markVaccineDoseAppliedAction,
  reopenPlannedVaccineDoseAction,
  updateAppliedVaccineDoseAction,
  updatePlannedVaccineDoseAction,
} from "./actions";
import styles from "./page.module.css";

type VaccinesPageProps = {
  searchParams: Promise<{
    applied?: string;
    applicationUpdated?: string;
    error?: string;
    reopened?: string;
    updated?: string;
    vista?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  validation: "Revisa la vacuna, la dosis y la fecha planificada.",
  save: "No se pudo guardar la planificacion. Prueba otra vez.",
  load: "No se pudo cargar el calendario de vacunas.",
  "application-validation": "Revisa fecha, lugar, vacuna y dosis de la aplicacion.",
  "application-save": "No se pudo guardar la vacuna aplicada. Prueba otra vez.",
  reopen: "No se pudo volver la vacuna a pendiente. Prueba otra vez.",
};

export default async function VaccinesPage({ searchParams }: VaccinesPageProps) {
  const { applied, applicationUpdated, error, reopened, updated, vista } = await searchParams;

  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { plan, loadError } = await getVaccinePlan();
  const currentError = error ?? loadError;
  const view = vista === "timeline" ? "timeline" : "status";
  const feedbackMessages: ToastFeedbackMessage[] = [
    ...(updated
      ? [{ id: "updated", text: "Planificacion actualizada.", variant: "success" as const }]
      : []),
    ...(applied
      ? [{ id: "applied", text: "Vacuna marcada como aplicada.", variant: "success" as const }]
      : []),
    ...(applicationUpdated
      ? [
          {
            id: "application-updated",
            text: "Datos de aplicacion actualizados.",
            variant: "success" as const,
          },
        ]
      : []),
    ...(reopened
      ? [{ id: "reopened", text: "Vacuna devuelta a pendiente.", variant: "success" as const }]
      : []),
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
          Calendario 2026 de la Comunidad de Madrid. Las fechas iniciales estan calculadas desde el
          nacimiento de Irati y se pueden ajustar manualmente.
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

        <nav className={styles.viewSwitch} aria-label="Vista de vacunas">
          <Link aria-current={view === "status" ? "page" : undefined} href="/vacunas">
            Por estado
          </Link>
          <Link
            aria-current={view === "timeline" ? "page" : undefined}
            href="/vacunas?vista=timeline"
          >
            Linea temporal
          </Link>
        </nav>

        <ToastFeedback messages={feedbackMessages} />

        <PlannedVaccineList
          groups={plan.groups}
          markAppliedAction={markVaccineDoseAppliedAction}
          reopenAction={reopenPlannedVaccineDoseAction}
          timelineGroups={groupPlannedVaccineDosesByAge(plan.doses)}
          updateAction={updatePlannedVaccineDoseAction}
          updateApplicationAction={updateAppliedVaccineDoseAction}
          view={view}
        />
      </section>
    </main>
  );
}

async function getVaccinePlan() {
  try {
    const plan = await listVaccinePlan(new CachedVaccinePlanReadRepository(), new Date());

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
