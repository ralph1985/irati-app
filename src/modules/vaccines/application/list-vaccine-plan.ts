import {
  assignPlannedVaccineDoseStatuses,
  groupPlannedVaccineDosesByStatus,
} from "../domain/vaccine-calendar";
import { VaccinePlanRepository } from "./vaccine-plan-repository";

export async function listVaccinePlan(repository: VaccinePlanRepository, today: Date) {
  const [plannedDoses, appliedDoses] = await Promise.all([
    repository.listPlannedVaccineDoses(),
    repository.listAppliedVaccineDoses(),
  ]);
  const doses = assignPlannedVaccineDoseStatuses(plannedDoses, appliedDoses, today);

  return {
    doses,
    groups: groupPlannedVaccineDosesByStatus(doses),
    summary: {
      total: doses.length,
      retrasada: doses.filter((dose) => dose.status === "retrasada").length,
      proxima: doses.filter((dose) => dose.status === "proxima").length,
      pendiente: doses.filter((dose) => dose.status === "pendiente").length,
      aplicada: doses.filter((dose) => dose.status === "aplicada").length,
    },
  };
}
