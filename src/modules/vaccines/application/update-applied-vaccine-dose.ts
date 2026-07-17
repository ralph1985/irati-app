import { createAppliedVaccineDose, NewAppliedVaccineDose } from "../domain/vaccine-calendar";
import { VaccinePlanRepository } from "./vaccine-plan-repository";

export async function updateAppliedVaccineDose(
  repository: VaccinePlanRepository,
  id: string,
  input: NewAppliedVaccineDose,
) {
  if (!id) {
    throw new Error("Missing applied vaccine dose id");
  }

  return repository.updateAppliedVaccineDose(id, createAppliedVaccineDose(input));
}
