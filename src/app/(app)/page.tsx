import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { formatBirthDate } from "@/modules/profile/domain/baby-profile";
import { CachedProfileRepository } from "@/modules/profile/infrastructure/cached-profile-repository";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { buildHomeAgenda, HomeAgenda } from "@/modules/home/application/home-agenda";
import { listVaccinePlan } from "@/modules/vaccines/application/list-vaccine-plan";
import { VaccineAlert } from "@/modules/vaccines/application/vaccine-alerts";
import { selectNextActionableVaccineDose } from "@/modules/vaccines/application/vaccine-plan-views";
import { PlannedVaccineDoseWithStatus } from "@/modules/vaccines/domain/vaccine-calendar";
import { CachedVaccinePlanReadRepository } from "@/modules/vaccines/infrastructure/cached-vaccine-plan-read-repository";
import { listWeightEntries } from "@/modules/weight/application/list-weight-entries";
import {
  buildWeightTrendSummary,
  WeightTrendSummary,
} from "@/modules/weight/application/weight-trend-summary";
import { CachedWeightReadRepository } from "@/modules/weight/infrastructure/cached-weight-repository";
import { ToastFeedback, ToastFeedbackMessage } from "@/shared/ui/toast-feedback";
import Link from "next/link";
import { createWeightEntryAction } from "./peso/actions";
import { markVaccineDoseAppliedAction } from "./vacunas/actions";
import { HomeQuickActions } from "./_components/home-quick-actions";
import styles from "./page.module.css";

type HomeProps = {
  searchParams: Promise<{
    error?: string;
    vaccineApplied?: string;
    weightCreated?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { error, vaccineApplied, weightCreated } = await searchParams;

  if (!(await hasValidSession())) {
    return <LoginScreen error={error} />;
  }

  const { profile, source } = await getBabyProfile(new CachedProfileRepository());
  const weightResult = await getLatestWeight(new CachedWeightReadRepository());
  const vaccinePlan = await getVaccinePlan(new CachedVaccinePlanReadRepository());
  const homeAgenda = buildHomeAgenda({
    today: new Date(),
    vaccineDoses: vaccinePlan.doses,
    weightSummary: weightResult.summary,
  });
  const feedbackMessages: ToastFeedbackMessage[] = [
    ...(error
      ? [{ id: `error-${error}`, text: getHomeErrorMessage(error), variant: "error" as const }]
      : []),
    ...(weightCreated
      ? [{ id: "weight-created", text: "Peso guardado.", variant: "success" as const }]
      : []),
    ...(vaccineApplied
      ? [
          {
            id: "vaccine-applied",
            text: "Vacuna marcada como aplicada.",
            variant: "success" as const,
          },
        ]
      : []),
  ];

  return (
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="home-title">
        <p className={styles.kicker}>App privada familiar</p>
        <h1 id="home-title">{profile.name}</h1>
        <p className={styles.birthDate}>Nacida el {formatBirthDate(profile)}</p>
        {source === "fallback" ? (
          <p className={styles.dataNotice}>Mostrando datos locales temporales.</p>
        ) : null}
        {weightResult.loadError || vaccinePlan.loadError ? (
          <p className={styles.dataNotice}>Algunos datos no se pudieron cargar.</p>
        ) : null}
        <ToastFeedback messages={feedbackMessages} />
      </section>

      <section className={styles.alerts} aria-labelledby="vaccine-alerts-title">
        <div className={styles.sectionTitle}>
          <h2 id="vaccine-alerts-title">Avisos</h2>
          <Link href="/vacunas">Ver vacunas</Link>
        </div>

        {vaccinePlan.alerts.length > 0 ? (
          <ol>
            {vaccinePlan.alerts.slice(0, 3).map((alert) => (
              <li data-kind={alert.kind} key={alert.id}>
                <div>
                  <strong>{alert.title}</strong>
                  <span>{alert.detail}</span>
                </div>
                <time dateTime={alert.plannedDate}>{formatDate(alert.plannedDate)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <p>Sin vacunas proximas ni retrasadas.</p>
        )}
      </section>

      <HomeQuickActions
        createWeightAction={createWeightEntryAction}
        markAppliedAction={markVaccineDoseAppliedAction}
        nextDose={vaccinePlan.nextDose}
      />

      <ReviewSoon agenda={homeAgenda} />

      <AgendaNext30Days agenda={homeAgenda} />

      <section className={styles.summary} aria-label="Resumen inicial">
        <article>
          <span>Peso</span>
          <strong>
            {weightResult.summary.latest
              ? `${weightResult.summary.latest.weightGrams.toLocaleString("es-ES")} g`
              : "Sin registros"}
          </strong>
        </article>
        <article>
          <span>Ultimo control</span>
          <strong>{formatLatestWeightMeta(weightResult.summary)}</strong>
        </article>
        <article>
          <span>Cambio</span>
          <strong>{formatWeightTrend(weightResult.summary)}</strong>
        </article>
        <article>
          <span>Vacunas</span>
          <strong>{formatVaccineSummary(vaccinePlan.summary)}</strong>
        </article>
        <article>
          <span>Proxima accion</span>
          <strong>{formatNextVaccineDose(vaccinePlan.nextDose)}</strong>
        </article>
        <article>
          <span>CIPA</span>
          <strong>{profile.cipa ?? "Sin anotar"}</strong>
        </article>
      </section>

      <form action="/logout" method="post" suppressHydrationWarning>
        <button className={styles.logout} type="submit">
          Salir
        </button>
      </form>
    </main>
  );
}

async function getLatestWeight(repository: CachedWeightReadRepository) {
  try {
    const entries = await listWeightEntries(repository);

    return { summary: buildWeightTrendSummary(entries, new Date()), loadError: false };
  } catch {
    return { summary: buildWeightTrendSummary([], new Date()), loadError: true };
  }
}

async function getVaccinePlan(repository: CachedVaccinePlanReadRepository): Promise<{
  alerts: VaccineAlert[];
  doses: PlannedVaccineDoseWithStatus[];
  summary: {
    total: number;
    retrasada: number;
    proxima: number;
    pendiente: number;
    aplicada: number;
  };
  nextDose: PlannedVaccineDoseWithStatus | null;
  loadError: boolean;
}> {
  try {
    const plan = await listVaccinePlan(repository, new Date());

    return {
      ...plan,
      nextDose: selectNextActionableVaccineDose(plan.doses),
      loadError: false,
    };
  } catch {
    return {
      alerts: [],
      doses: [],
      summary: {
        total: 0,
        retrasada: 0,
        proxima: 0,
        pendiente: 0,
        aplicada: 0,
      },
      nextDose: null,
      loadError: true,
    };
  }
}

function ReviewSoon({ agenda }: { agenda: HomeAgenda }) {
  if (!agenda.reviewPrompt) {
    return (
      <section className={styles.reviewSoon} data-kind="calm" aria-labelledby="review-title">
        <div>
          <span>Revisar pronto</span>
          <h2 id="review-title">Todo tranquilo</h2>
          <p>Sin vacunas urgentes ni peso pendiente de revisar.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.reviewSoon}
      data-kind={agenda.reviewPrompt.kind}
      aria-labelledby="review-title"
    >
      <div>
        <span>Revisar pronto</span>
        <h2 id="review-title">{agenda.reviewPrompt.title}</h2>
        <p>{agenda.reviewPrompt.detail}</p>
      </div>
      <Link href={agenda.reviewPrompt.href}>Ver</Link>
    </section>
  );
}

function AgendaNext30Days({ agenda }: { agenda: HomeAgenda }) {
  return (
    <section className={styles.agenda} aria-labelledby="agenda-title">
      <div className={styles.sectionTitle}>
        <h2 id="agenda-title">Proximos 30 dias</h2>
        <Link href="/vacunas">Ver calendario</Link>
      </div>

      {agenda.items.length > 0 ? (
        <ol>
          {agenda.items.slice(0, 5).map((item) => (
            <li data-kind={item.kind} key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <Link href={item.href}>{formatDate(item.date)}</Link>
            </li>
          ))}
        </ol>
      ) : (
        <p>Sin tareas previstas en los proximos 30 dias.</p>
      )}
    </section>
  );
}

function formatVaccineSummary(summary: {
  retrasada: number;
  proxima: number;
  pendiente: number;
}): string {
  if (summary.retrasada > 0) {
    return `${summary.retrasada} retrasada${summary.retrasada === 1 ? "" : "s"}`;
  }

  if (summary.proxima > 0) {
    return `${summary.proxima} proxima${summary.proxima === 1 ? "" : "s"}`;
  }

  return `${summary.pendiente} pendiente${summary.pendiente === 1 ? "" : "s"}`;
}

function formatLatestWeightMeta(summary: WeightTrendSummary): string {
  if (!summary.latest) {
    return "Sin registros";
  }

  const dayLabel =
    summary.daysSinceLatest === 0
      ? "hoy"
      : `hace ${summary.daysSinceLatest} dia${summary.daysSinceLatest === 1 ? "" : "s"}`;

  return `${formatDate(summary.latest.measuredOn)}, ${dayLabel}`;
}

function formatWeightTrend(summary: WeightTrendSummary): string {
  if (!summary.latest || !summary.previous || summary.differenceGrams === null) {
    return "Sin comparativa";
  }

  const sign = summary.differenceGrams > 0 ? "+" : "";
  const average =
    summary.averageGramsPerDay === null
      ? ""
      : ` · ${sign}${summary.averageGramsPerDay.toLocaleString("es-ES")} g/dia`;

  return `${sign}${summary.differenceGrams.toLocaleString("es-ES")} g${average}`;
}

function formatNextVaccineDose(dose: PlannedVaccineDoseWithStatus | null): string {
  if (!dose) {
    return "Sin pendientes";
  }

  return `${dose.vaccineName}, ${formatDate(dose.plannedDate)}`;
}

function getHomeErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    "application-save": "No se pudo registrar la vacuna desde Inicio. Prueba de nuevo.",
    "application-validation": "Revisa fecha, lugar, vacuna y dosis antes de guardar.",
    session: "La sesion ha caducado. Entra de nuevo para continuar.",
    "weight-save": "No se pudo guardar el peso.",
    "weight-validation": "Revisa la fecha, el peso y el lugar.",
  };

  return messages[error] ?? "No se pudo completar la accion.";
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
