import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { formatBirthDate } from "@/modules/profile/domain/baby-profile";
import { CachedProfileRepository } from "@/modules/profile/infrastructure/cached-profile-repository";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { listVaccinePlan } from "@/modules/vaccines/application/list-vaccine-plan";
import { VaccineAlert } from "@/modules/vaccines/application/vaccine-alerts";
import { CachedVaccinePlanReadRepository } from "@/modules/vaccines/infrastructure/cached-vaccine-plan-read-repository";
import { listWeightEntries } from "@/modules/weight/application/list-weight-entries";
import { CachedWeightReadRepository } from "@/modules/weight/infrastructure/cached-weight-repository";
import Link from "next/link";
import styles from "./page.module.css";

type HomeProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { error } = await searchParams;

  if (!(await hasValidSession())) {
    return <LoginScreen error={error} />;
  }

  const { profile, source } = await getBabyProfile(new CachedProfileRepository());
  const weightResult = await getLatestWeight(new CachedWeightReadRepository());
  const vaccinePlan = await getVaccinePlan(new CachedVaccinePlanReadRepository());

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

      <section className={styles.summary} aria-label="Resumen inicial">
        <article>
          <span>Peso</span>
          <strong>
            {weightResult.latestWeight
              ? `${weightResult.latestWeight.weightGrams.toLocaleString("es-ES")} g`
              : "Sin registros"}
          </strong>
        </article>
        <article>
          <span>Vacunas</span>
          <strong>{formatVaccineSummary(vaccinePlan.summary)}</strong>
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
    const [latestWeight] = await listWeightEntries(repository);

    return { latestWeight, loadError: false };
  } catch {
    return { latestWeight: undefined, loadError: true };
  }
}

async function getVaccinePlan(repository: CachedVaccinePlanReadRepository): Promise<{
  alerts: VaccineAlert[];
  summary: {
    total: number;
    retrasada: number;
    proxima: number;
    pendiente: number;
    aplicada: number;
  };
  loadError: boolean;
}> {
  try {
    return {
      ...(await listVaccinePlan(repository, new Date())),
      loadError: false,
    };
  } catch {
    return {
      alerts: [],
      summary: {
        total: 0,
        retrasada: 0,
        proxima: 0,
        pendiente: 0,
        aplicada: 0,
      },
      loadError: true,
    };
  }
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

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
