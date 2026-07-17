import { VaccinePlanRepository } from "./vaccine-plan-repository";

export async function listPlannedVaccineDoses(repository: VaccinePlanRepository) {
  return repository.listPlannedVaccineDoses();
}
