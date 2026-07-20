import {
  PlannedVaccineDoseWithStatus,
  VaccineDoseStatus,
  vaccineDoseStatuses,
} from "../domain/vaccine-calendar";

export type VaccineTimelineGroup = {
  ageLabel: string;
  doses: PlannedVaccineDoseWithStatus[];
  plannedDate: string;
};

export function groupPlannedVaccineDosesByAge(
  doses: PlannedVaccineDoseWithStatus[],
): VaccineTimelineGroup[] {
  const groups = new Map<string, PlannedVaccineDoseWithStatus[]>();

  for (const dose of [...doses].sort(compareDoses)) {
    const ageLabel = dose.ageLabel || "Sin edad definida";
    groups.set(ageLabel, [...(groups.get(ageLabel) ?? []), dose]);
  }

  return [...groups.entries()]
    .map(([ageLabel, groupDoses]) => ({
      ageLabel,
      doses: groupDoses,
      plannedDate: groupDoses[0]?.plannedDate ?? "",
    }))
    .sort((left, right) => left.plannedDate.localeCompare(right.plannedDate));
}

export function selectNextActionableVaccineDose(
  doses: PlannedVaccineDoseWithStatus[],
): PlannedVaccineDoseWithStatus | null {
  const priorities: VaccineDoseStatus[] = ["retrasada", "proxima", "pendiente"];

  for (const status of priorities) {
    const dose = doses.filter((candidate) => candidate.status === status).sort(compareDoses)[0];

    if (dose) {
      return dose;
    }
  }

  return null;
}

function compareDoses(
  left: PlannedVaccineDoseWithStatus,
  right: PlannedVaccineDoseWithStatus,
): number {
  const dateComparison = left.plannedDate.localeCompare(right.plannedDate);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  const statusComparison =
    vaccineDoseStatuses.indexOf(left.status) - vaccineDoseStatuses.indexOf(right.status);

  if (statusComparison !== 0) {
    return statusComparison;
  }

  return left.vaccineName.localeCompare(right.vaccineName, "es");
}
