import { PlannedVaccineDoseWithStatus } from "@/modules/vaccines/domain/vaccine-calendar";
import { WeightTrendSummary } from "@/modules/weight/application/weight-trend-summary";

export type HomeAgendaItem = {
  date: string;
  detail: string;
  href: string;
  id: string;
  kind: "overdue" | "today" | "upcoming" | "weight";
  title: string;
};

export type HomeReviewPrompt = {
  detail: string;
  href: string;
  kind: "overdue-vaccine" | "upcoming-vaccine" | "weight";
  title: string;
} | null;

export type HomeAgenda = {
  items: HomeAgendaItem[];
  reviewPrompt: HomeReviewPrompt;
};

type BuildHomeAgendaInput = {
  today: Date;
  vaccineDoses: PlannedVaccineDoseWithStatus[];
  weightSummary: WeightTrendSummary;
};

const UPCOMING_DAYS = 30;
const SOON_VACCINE_DAYS = 14;
const WEIGHT_REVIEW_DAYS = 7;

export function buildHomeAgenda({
  today,
  vaccineDoses,
  weightSummary,
}: BuildHomeAgendaInput): HomeAgenda {
  const todayIso = toIsoDate(today);
  const vaccineItems: HomeAgendaItem[] = [];

  for (const dose of vaccineDoses.filter((candidate) => candidate.status !== "aplicada")) {
    const daysUntil = daysBetween(todayIso, dose.plannedDate);

    if (daysUntil > UPCOMING_DAYS) {
      continue;
    }

    vaccineItems.push({
      date: dose.plannedDate,
      detail: `${dose.doseLabel}${dose.ageLabel ? ` · ${dose.ageLabel}` : ""}`,
      href: "/vacunas",
      id: `vaccine-${dose.id}`,
      kind: daysUntil < 0 ? "overdue" : daysUntil === 0 ? "today" : "upcoming",
      title: dose.vaccineName,
    });
  }

  const weightItem = buildWeightAgendaItem(weightSummary, todayIso);
  const items = [...vaccineItems, ...(weightItem ? [weightItem] : [])].sort(compareAgendaItems);

  return {
    items,
    reviewPrompt: buildReviewPrompt({ todayIso, vaccineDoses, weightSummary }),
  };
}

function buildWeightAgendaItem(
  weightSummary: WeightTrendSummary,
  todayIso: string,
): HomeAgendaItem | null {
  if (!weightSummary.latest || weightSummary.daysSinceLatest === null) {
    return null;
  }

  if (weightSummary.daysSinceLatest !== 0 && weightSummary.daysSinceLatest < WEIGHT_REVIEW_DAYS) {
    return null;
  }

  return {
    date: weightSummary.latest.measuredOn,
    detail:
      weightSummary.daysSinceLatest === 0
        ? "Registrado hoy"
        : `Último control hace ${weightSummary.daysSinceLatest} día${
            weightSummary.daysSinceLatest === 1 ? "" : "s"
          }`,
    href: "/peso",
    id: `weight-${weightSummary.latest.id}-${todayIso}`,
    kind: "weight",
    title: weightSummary.daysSinceLatest === 0 ? "Peso actualizado" : "Revisar peso",
  };
}

function buildReviewPrompt({
  todayIso,
  vaccineDoses,
  weightSummary,
}: {
  todayIso: string;
  vaccineDoses: PlannedVaccineDoseWithStatus[];
  weightSummary: WeightTrendSummary;
}): HomeReviewPrompt {
  const overdueDose = vaccineDoses
    .filter((dose) => dose.status === "retrasada")
    .sort(compareDosesByDate)[0];

  if (overdueDose) {
    return {
      detail: `${overdueDose.doseLabel}, prevista el ${formatDate(overdueDose.plannedDate)}`,
      href: "/vacunas",
      kind: "overdue-vaccine",
      title: `${overdueDose.vaccineName} retrasada`,
    };
  }

  const soonDose = vaccineDoses
    .filter((dose) => {
      const daysUntil = daysBetween(todayIso, dose.plannedDate);

      return dose.status !== "aplicada" && daysUntil >= 0 && daysUntil <= SOON_VACCINE_DAYS;
    })
    .sort(compareDosesByDate)[0];

  if (soonDose) {
    return {
      detail: `${soonDose.doseLabel}, prevista el ${formatDate(soonDose.plannedDate)}`,
      href: "/vacunas",
      kind: "upcoming-vaccine",
      title: `${soonDose.vaccineName} próxima`,
    };
  }

  if (
    weightSummary.latest &&
    weightSummary.daysSinceLatest !== null &&
    weightSummary.daysSinceLatest >= WEIGHT_REVIEW_DAYS
  ) {
    return {
      detail: `Último control hace ${weightSummary.daysSinceLatest} día${
        weightSummary.daysSinceLatest === 1 ? "" : "s"
      }`,
      href: "/peso",
      kind: "weight",
      title: "Revisar peso",
    };
  }

  return null;
}

function compareAgendaItems(left: HomeAgendaItem, right: HomeAgendaItem): number {
  const priority = getAgendaPriority(left.kind) - getAgendaPriority(right.kind);

  if (priority !== 0) {
    return priority;
  }

  return left.date.localeCompare(right.date);
}

function getAgendaPriority(kind: HomeAgendaItem["kind"]): number {
  const priorities: Record<HomeAgendaItem["kind"], number> = {
    overdue: 0,
    today: 1,
    upcoming: 2,
    weight: 3,
  };

  return priorities[kind];
}

function compareDosesByDate(
  left: PlannedVaccineDoseWithStatus,
  right: PlannedVaccineDoseWithStatus,
): number {
  const dateComparison = left.plannedDate.localeCompare(right.plannedDate);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return left.vaccineName.localeCompare(right.vaccineName, "es");
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
