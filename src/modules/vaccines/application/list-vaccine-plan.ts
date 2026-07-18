import {
  assignPlannedVaccineDoseStatuses,
  groupPlannedVaccineDosesByStatus,
} from "../domain/vaccine-calendar";
import { buildVaccineAlerts } from "./vaccine-alerts";
import { VaccinePlanRepository } from "./vaccine-plan-repository";

type VaccinePlanReadRepository = Pick<
  VaccinePlanRepository,
  "listAppliedVaccineDoses" | "listPlannedVaccineDoses"
>;

export async function listVaccinePlan(repository: VaccinePlanReadRepository, today: Date) {
  const [plannedDoses, appliedDoses] = await Promise.all([
    repository.listPlannedVaccineDoses(),
    repository.listAppliedVaccineDoses(),
  ]);
  const doses = assignPlannedVaccineDoseStatuses(plannedDoses, appliedDoses, today);

  return {
    alerts: buildVaccineAlerts(doses),
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
