import { createPlannedVaccineDose, NewPlannedVaccineDose } from "../domain/vaccine-calendar";
import { VaccinePlanRepository } from "./vaccine-plan-repository";

export async function updatePlannedVaccineDose(
  repository: VaccinePlanRepository,
  id: string,
  input: NewPlannedVaccineDose,
) {
  if (!id) {
    throw new Error("Missing planned vaccine dose id");
  }

  return repository.updatePlannedVaccineDose(id, createPlannedVaccineDose(input));
}
