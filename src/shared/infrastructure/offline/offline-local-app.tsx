"use client";

import { useEffect, useMemo, useState } from "react";
import { buildHomeAgenda } from "@/modules/home/application/home-agenda";
import type { CalendarSnapshot } from "@/modules/calendar/domain/calendar-event";
import { CalendarView } from "@/modules/calendar/ui/calendar-view";
import { formatBirthDate, formatBirthTime } from "@/modules/profile/domain/baby-profile";
import { LiveAge } from "@/modules/profile/ui/live-age";
import {
  calculateTravelChecklistProgress,
  groupTravelChecklistItems,
} from "@/modules/travel/domain/travel-checklist-item";
import { TravelChecklistView } from "@/modules/travel/ui/travel-checklist-view";
import { buildVaccineAlerts } from "@/modules/vaccines/application/vaccine-alerts";
import {
  groupPlannedVaccineDosesByAge,
  selectNextActionableVaccineDose,
} from "@/modules/vaccines/application/vaccine-plan-views";
import {
  assignPlannedVaccineDoseStatuses,
  groupPlannedVaccineDosesByStatus,
  madridVaccineCalendarSource,
  vaccineDoseStatuses,
  type PlannedVaccineDoseWithStatus,
} from "@/modules/vaccines/domain/vaccine-calendar";
import { PlannedVaccineList } from "@/modules/vaccines/ui/planned-vaccine-list";
import {
  filterWeightEntries,
  formatWeightFilterLabel,
  isWeightFilter,
  type WeightFilter,
  weightFilterValues,
} from "@/modules/weight/application/weight-filter";
import { buildWeightTrendSummary } from "@/modules/weight/application/weight-trend-summary";
import { WeightChart } from "@/modules/weight/ui/weight-chart";
import { WeightCreateSheet } from "@/modules/weight/ui/weight-create-sheet";
import { WeightHistory } from "@/modules/weight/ui/weight-history";
import {
  listPendingTravelMutations,
  listPendingVaccineMutations,
  listPendingWeightMutations,
  readOfflineSnapshot,
  readCalendarSnapshot,
  readSyncMetadata,
  type OfflineSnapshot,
  type SyncMetadata,
} from "./irati-offline-db";
import localStyles from "./offline-local-app.module.css";
import homeStyles from "../../../app/(app)/page.module.css";
import travelStyles from "../../../app/(app)/viaje/page.module.css";
import vaccineStyles from "../../../app/(app)/vacunas/page.module.css";
import weightStyles from "../../../app/(app)/peso/page.module.css";
import calendarPageStyles from "../../../app/(app)/calendario/page.module.css";

type OfflineRoute = "/" | "/peso" | "/vacunas" | "/viaje" | "/calendario" | "/ajustes";

const noopAction = async () => {};

const tabs: Array<{ href: OfflineRoute; label: string }> = [
  { href: "/", label: "Inicio" },
  { href: "/peso", label: "Peso" },
  { href: "/vacunas", label: "Vacunas" },
  { href: "/viaje", label: "Viaje" },
  { href: "/calendario", label: "Calendario" },
  { href: "/ajustes", label: "Ajustes" },
];

export function OfflineLocalApp() {
  const [snapshot, setSnapshot] = useState<OfflineSnapshot | null>(null);
  const [metadata, setMetadata] = useState<SyncMetadata | null>(null);
  const [calendarSnapshot, setCalendarSnapshot] = useState<CalendarSnapshot | null>(null);
  const [route, setRoute] = useState<OfflineRoute>("/");
  const [search, setSearch] = useState("");
  const [pendingCounts, setPendingCounts] = useState({
    travel: 0,
    vaccines: 0,
    weight: 0,
  });

  useEffect(() => {
    let isActive = true;

    function refreshRoute() {
      setRoute(toOfflineRoute(window.location.pathname));
      setSearch(window.location.search);
    }

    async function refreshLocalData() {
      const [nextSnapshot, nextMetadata, nextCalendarSnapshot, weight, travel, vaccines] =
        await Promise.all([
          readOfflineSnapshot(),
          readSyncMetadata(),
          readCalendarSnapshot(),
          listPendingWeightMutations(),
          listPendingTravelMutations(),
          listPendingVaccineMutations(),
        ]);

      if (!isActive) {
        return;
      }

      setSnapshot(nextSnapshot);
      setMetadata(nextMetadata);
      setCalendarSnapshot(nextCalendarSnapshot);
      setPendingCounts({
        travel: travel.length,
        vaccines: vaccines.length,
        weight: weight.length,
      });
    }

    refreshRoute();
    void refreshLocalData();

    window.addEventListener("popstate", refreshRoute);
    window.addEventListener("irati-offline-sync-updated", refreshLocalData);
    window.addEventListener("irati-offline-weight-updated", refreshLocalData);
    window.addEventListener("irati-offline-travel-updated", refreshLocalData);
    window.addEventListener("irati-offline-vaccines-updated", refreshLocalData);

    return () => {
      isActive = false;
      window.removeEventListener("popstate", refreshRoute);
      window.removeEventListener("irati-offline-sync-updated", refreshLocalData);
      window.removeEventListener("irati-offline-weight-updated", refreshLocalData);
      window.removeEventListener("irati-offline-travel-updated", refreshLocalData);
      window.removeEventListener("irati-offline-vaccines-updated", refreshLocalData);
    };
  }, []);

  if (!snapshot || !metadata) {
    return <main className={localStyles.loading}>Cargando copia local...</main>;
  }

  if (!metadata.offlineAccessGranted || !metadata.lastSuccessfulSyncAt || !snapshot.profile) {
    return (
      <main className={localStyles.blocked}>
        <section className={localStyles.blockedPanel} aria-labelledby="offline-blocked-title">
          <p>Offline</p>
          <h1 id="offline-blocked-title">Sin copia local</h1>
          <p>
            Abre Irati con conexion y sesion valida para preparar este dispositivo antes de usarla
            offline.
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className={localStyles.page}>
      <p className={localStyles.offlineNotice}>
        Datos locales. Ultima sincronizacion: {formatDateTime(metadata.lastSuccessfulSyncAt)}.
      </p>
      <div className={localStyles.view}>
        {renderRoute(route, search, snapshot, metadata, pendingCounts, calendarSnapshot)}
      </div>
      <nav className={localStyles.nav} aria-label="Navegacion offline">
        {tabs.map((tab) => (
          <a aria-current={route === tab.href ? "page" : undefined} href={tab.href} key={tab.href}>
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function renderRoute(
  route: OfflineRoute,
  search: string,
  snapshot: OfflineSnapshot,
  metadata: SyncMetadata,
  pendingCounts: { travel: number; vaccines: number; weight: number },
  calendarSnapshot: CalendarSnapshot | null,
) {
  switch (route) {
    case "/peso":
      return <OfflineWeightScreen search={search} snapshot={snapshot} />;
    case "/vacunas":
      return <OfflineVaccinesScreen search={search} snapshot={snapshot} />;
    case "/viaje":
      return <OfflineTravelScreen snapshot={snapshot} />;
    case "/calendario":
      return <OfflineCalendarScreen snapshot={calendarSnapshot} />;
    case "/ajustes":
      return (
        <OfflineSettingsScreen
          metadata={metadata}
          pendingCounts={pendingCounts}
          snapshot={snapshot}
        />
      );
    case "/":
      return <OfflineHomeScreen snapshot={snapshot} />;
  }
}

function OfflineCalendarScreen({ snapshot }: { snapshot: CalendarSnapshot | null }) {
  return (
    <main className={calendarPageStyles.main}>
      <header className={calendarPageStyles.header}>
        <p>Calendario</p>
        <h1>Agenda de Irati</h1>
      </header>
      <CalendarView initialError={snapshot ? null : "offline"} initialSnapshot={snapshot} />
    </main>
  );
}

function OfflineHomeScreen({ snapshot }: { snapshot: OfflineSnapshot }) {
  const plan = buildOfflineVaccinePlan(snapshot);
  const weightSummary = buildWeightTrendSummary(snapshot.weightEntries, new Date());
  const agenda = buildHomeAgenda({
    today: new Date(),
    vaccineDoses: plan.doses,
    weightSummary,
  });
  const alerts = buildVaccineAlerts(plan.doses);

  return (
    <main className={homeStyles.main}>
      <section className={homeStyles.hero} aria-labelledby="home-title">
        <p className={homeStyles.kicker}>Hoy</p>
        <h1 id="home-title">{snapshot.profile?.name}</h1>
        {snapshot.profile ? (
          <>
            <p className={homeStyles.birthDate}>
              Nacida el {formatBirthDate(snapshot.profile)} a las{" "}
              {formatBirthTime(snapshot.profile)}
            </p>
            <p className={homeStyles.age}>
              Edad: <LiveAge initialNow={new Date().toISOString()} profile={snapshot.profile} />
            </p>
          </>
        ) : null}
        <p className={homeStyles.dataNotice}>Usando copia local del dispositivo.</p>
      </section>

      <section className={homeStyles.alerts} aria-labelledby="vaccine-alerts-title">
        <div className={homeStyles.sectionTitle}>
          <h2 id="vaccine-alerts-title">Avisos</h2>
          <a href="/vacunas">Ver vacunas</a>
        </div>
        {alerts.length > 0 ? (
          <ol>
            {alerts.slice(0, 3).map((alert) => (
              <li data-kind={alert.kind} key={alert.id}>
                <div>
                  <strong>{alert.title}</strong>
                  <span>{alert.detail}</span>
                </div>
                <time dateTime={alert.plannedDate}>{formatShortDate(alert.plannedDate)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <p>No hay vacunas que revisar ahora.</p>
        )}
      </section>

      <section className={homeStyles.summary} aria-label="Resumen inicial">
        <article>
          <span>Peso</span>
          <strong>
            {weightSummary.latest
              ? `${weightSummary.latest.weightGrams.toLocaleString("es-ES")} g`
              : "Aun sin pesos"}
          </strong>
        </article>
        <article>
          <span>Vacunas</span>
          <strong>{formatVaccineSummary(plan.summary)}</strong>
        </article>
        <article>
          <span>Proxima accion</span>
          <strong>{formatNextVaccineDose(selectNextActionableVaccineDose(plan.doses))}</strong>
        </article>
        <article>
          <span>Viaje</span>
          <strong>{formatTravelProgress(snapshot)}</strong>
        </article>
      </section>

      {agenda.items.length > 0 ? (
        <section className={homeStyles.agenda} aria-labelledby="agenda-title">
          <div className={homeStyles.sectionTitle}>
            <h2 id="agenda-title">Proximos 30 dias</h2>
            <a href="/vacunas">Ver calendario</a>
          </div>
          <ol>
            {agenda.items.slice(0, 5).map((item) => (
              <li data-kind={item.kind} key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <a href={item.href}>{formatShortDate(item.date)}</a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}

function OfflineWeightScreen({ search, snapshot }: { search: string; snapshot: OfflineSnapshot }) {
  const activeFilterParam = new URLSearchParams(search).get("lugar");
  const activeFilter: WeightFilter =
    activeFilterParam && isWeightFilter(activeFilterParam) ? activeFilterParam : "all";
  const filteredEntries = filterWeightEntries(snapshot.weightEntries, activeFilter);
  const trendSummary = buildWeightTrendSummary(filteredEntries, new Date());

  return (
    <>
      <main className={weightStyles.main}>
        <header className={weightStyles.header}>
          <p>Peso</p>
          <h1>Pesos de Irati</h1>
        </header>

        <section className={weightStyles.panel} aria-labelledby="chart-title">
          <div className={weightStyles.sectionTitle}>
            <h2 id="chart-title">Evolucion</h2>
            <span>{formatWeightFilterLabel(activeFilter)}</span>
          </div>

          <div className={weightStyles.filters} aria-label="Filtrar pesos por lugar">
            {weightFilterValues.map((filter) => (
              <a
                aria-current={filter === activeFilter ? "page" : undefined}
                href={filter === "all" ? "/peso" : `/peso?lugar=${filter}`}
                key={filter}
              >
                {formatWeightFilterLabel(filter)}
              </a>
            ))}
          </div>

          {snapshot.profile ? (
            <WeightChart birthDate={snapshot.profile.birthDate} entries={filteredEntries} />
          ) : null}
        </section>

        <section className={weightStyles.panel} aria-labelledby="history-title">
          <div className={weightStyles.sectionTitle}>
            <h2 id="history-title">Historico</h2>
            <span>{filteredEntries.length} registros</span>
          </div>

          <WeightTrendPanel summary={trendSummary} />

          <WeightHistory
            deleteAction={noopAction}
            entries={filteredEntries}
            updateAction={noopAction}
          />
        </section>
      </main>

      <WeightCreateSheet action={noopAction} styles={weightStyles} />
    </>
  );
}

function OfflineVaccinesScreen({
  search,
  snapshot,
}: {
  search: string;
  snapshot: OfflineSnapshot;
}) {
  const plan = buildOfflineVaccinePlan(snapshot);
  const view = new URLSearchParams(search).get("vista") === "timeline" ? "timeline" : "status";

  return (
    <main className={vaccineStyles.main}>
      <header className={vaccineStyles.header}>
        <p>Vacunas</p>
        <h1>Vacunas de Irati</h1>
      </header>

      <section className={vaccineStyles.panel} aria-labelledby="source-title">
        <div className={vaccineStyles.sectionTitle}>
          <h2 id="source-title">Fuente verificada</h2>
          <span>{madridVaccineCalendarSource.verifiedOn}</span>
        </div>
        <p className={vaccineStyles.copy}>
          Calendario guardado en este dispositivo desde la ultima sincronizacion.
        </p>
      </section>

      <section className={vaccineStyles.panel} aria-labelledby="planned-doses-title">
        <div className={vaccineStyles.sectionTitle}>
          <h2 id="planned-doses-title">Dosis planificadas</h2>
          <span>{plan.summary.total} dosis</span>
        </div>

        <div className={vaccineStyles.statusSummary} aria-label="Resumen por estado">
          {vaccineDoseStatuses.map((status) => (
            <article data-status={status} key={status}>
              <span>{formatVaccineStatusPlural(status)}</span>
              <strong>{plan.summary[status]}</strong>
            </article>
          ))}
        </div>

        <nav className={vaccineStyles.viewSwitch} aria-label="Vista de vacunas">
          <a aria-current={view === "status" ? "page" : undefined} href="/vacunas">
            Por estado
          </a>
          <a aria-current={view === "timeline" ? "page" : undefined} href="/vacunas?vista=timeline">
            Linea temporal
          </a>
        </nav>

        <PlannedVaccineList
          groups={plan.groups}
          markAppliedAction={noopAction}
          reopenAction={noopAction}
          timelineGroups={groupPlannedVaccineDosesByAge(plan.doses)}
          updateAction={noopAction}
          updateApplicationAction={noopAction}
          view={view}
        />
      </section>
    </main>
  );
}

function OfflineTravelScreen({ snapshot }: { snapshot: OfflineSnapshot }) {
  const checklist = useMemo(() => {
    const categories = snapshot.travelChecklistCategories ?? [];
    const locations = snapshot.travelStorageLocations ?? [];
    const groups = groupTravelChecklistItems(snapshot.travelChecklistItems, categories);

    return {
      categories,
      locations,
      groups,
      locationGroups: [],
      progress: calculateTravelChecklistProgress(snapshot.travelChecklistItems),
    };
  }, [
    snapshot.travelChecklistCategories,
    snapshot.travelChecklistItems,
    snapshot.travelStorageLocations,
  ]);

  return (
    <main className={travelStyles.main}>
      <header className={travelStyles.header}>
        <p>Viaje</p>
        <h1>Maleta de Irati</h1>
      </header>

      <TravelChecklistView
        checklist={checklist}
        createAction={noopAction}
        deleteAction={noopAction}
        resetAction={noopAction}
        setPackedAction={noopAction}
        updateAction={noopAction}
        showOrganizationPanel={false}
      />
    </main>
  );
}

function OfflineSettingsScreen({
  metadata,
  pendingCounts,
  snapshot,
}: {
  metadata: SyncMetadata;
  pendingCounts: { travel: number; vaccines: number; weight: number };
  snapshot: OfflineSnapshot;
}) {
  const totalPending = pendingCounts.travel + pendingCounts.vaccines + pendingCounts.weight;

  return (
    <main className={localStyles.settingsMain}>
      <header className={localStyles.settingsHeader}>
        <p>Ajustes</p>
        <h1>Datos y acceso</h1>
      </header>

      <section className={localStyles.settingsPanel} aria-labelledby="profile-title">
        <div className={localStyles.settingsTitle}>
          <h2 id="profile-title">Perfil de Irati</h2>
          <span>Local</span>
        </div>
        <dl className={localStyles.details}>
          <div>
            <dt>Nombre</dt>
            <dd>{snapshot.profile?.name ?? "Sin copia"}</dd>
          </div>
          <div>
            <dt>Nacimiento</dt>
            <dd>{snapshot.profile ? formatBirthDate(snapshot.profile) : "Sin copia"}</dd>
          </div>
          <div>
            <dt>CIPA</dt>
            <dd>{snapshot.profile?.cipa ?? "Sin registrar"}</dd>
          </div>
        </dl>
      </section>

      <section className={localStyles.settingsPanel} aria-labelledby="sync-title">
        <div className={localStyles.settingsTitle}>
          <h2 id="sync-title">Sincronizacion</h2>
          <span>{totalPending > 0 ? `${totalPending} pendientes` : "Sin pendientes"}</span>
        </div>
        <dl className={localStyles.details}>
          <div>
            <dt>Ultima copia</dt>
            <dd>
              {metadata.lastSuccessfulSyncAt
                ? formatDateTime(metadata.lastSuccessfulSyncAt)
                : "Sin preparar"}
            </dd>
          </div>
          <div>
            <dt>Peso</dt>
            <dd>{pendingCounts.weight}</dd>
          </div>
          <div>
            <dt>Viaje</dt>
            <dd>{pendingCounts.travel}</dd>
          </div>
          <div>
            <dt>Vacunas</dt>
            <dd>{pendingCounts.vaccines}</dd>
          </div>
        </dl>
        {metadata.lastError ? (
          <p className={localStyles.settingsCopy}>{metadata.lastError}</p>
        ) : null}
      </section>

      <section className={localStyles.settingsPanel} aria-labelledby="backup-title">
        <div className={localStyles.settingsTitle}>
          <h2 id="backup-title">Copias de seguridad</h2>
          <span>No disponible</span>
        </div>
        <p className={localStyles.settingsCopy}>
          El estado de backup necesita conexion con el servidor.
        </p>
      </section>
    </main>
  );
}

function WeightTrendPanel({ summary }: { summary: ReturnType<typeof buildWeightTrendSummary> }) {
  if (!summary.latest) {
    return null;
  }

  return (
    <div className={weightStyles.trendSummary} aria-label="Resumen de peso">
      <article>
        <span>Ultimo</span>
        <strong>{summary.latest.weightGrams.toLocaleString("es-ES")} g</strong>
      </article>
      <article>
        <span>Hace</span>
        <strong>
          {summary.daysSinceLatest} dia{summary.daysSinceLatest === 1 ? "" : "s"}
        </strong>
      </article>
      <article>
        <span>Cambio</span>
        <strong>{formatWeightTrend(summary)}</strong>
      </article>
    </div>
  );
}

function buildOfflineVaccinePlan(snapshot: OfflineSnapshot) {
  const doses = assignPlannedVaccineDoseStatuses(
    snapshot.plannedVaccineDoses,
    snapshot.appliedVaccineDoses,
    new Date(),
  );
  const groups = groupPlannedVaccineDosesByStatus(doses);
  const summary = {
    total: doses.length,
    retrasada: groups.retrasada.length,
    proxima: groups.proxima.length,
    pendiente: groups.pendiente.length,
    aplicada: groups.aplicada.length,
  };

  return { doses, groups, summary };
}

function toOfflineRoute(pathname: string): OfflineRoute {
  if (
    pathname === "/peso" ||
    pathname === "/vacunas" ||
    pathname === "/viaje" ||
    pathname === "/calendario" ||
    pathname === "/ajustes"
  ) {
    return pathname;
  }

  return "/";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
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

function formatVaccineStatusPlural(
  status: keyof ReturnType<typeof buildOfflineVaccinePlan>["summary"],
): string {
  switch (status) {
    case "retrasada":
      return "Retrasadas";
    case "proxima":
      return "Proximas";
    case "pendiente":
      return "Pendientes";
    case "aplicada":
      return "Aplicadas";
    case "total":
      return "Total";
  }
}

function formatNextVaccineDose(dose: PlannedVaccineDoseWithStatus | null): string {
  if (!dose) {
    return "Nada pendiente";
  }

  return `${dose.vaccineName}, ${formatShortDate(dose.plannedDate)}`;
}

function formatTravelProgress(snapshot: OfflineSnapshot): string {
  const progress = calculateTravelChecklistProgress(snapshot.travelChecklistItems);

  if (progress.total === 0) {
    return "Sin lista";
  }

  return `${progress.packed}/${progress.total} preparado`;
}

function formatWeightTrend(summary: ReturnType<typeof buildWeightTrendSummary>): string {
  if (!summary.latest || !summary.previous || summary.differenceGrams === null) {
    return "Sin comparacion";
  }

  const sign = summary.differenceGrams > 0 ? "+" : "";

  return `${sign}${summary.differenceGrams.toLocaleString("es-ES")} g`;
}
