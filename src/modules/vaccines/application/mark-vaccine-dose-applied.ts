import { createAppliedVaccineDose, NewAppliedVaccineDose } from "../domain/vaccine-calendar";
import { VaccinePlanRepository } from "./vaccine-plan-repository";

export async function markVaccineDoseApplied(
  repository: VaccinePlanRepository,
  input: NewAppliedVaccineDose,
) {
  return repository.createAppliedVaccineDose(createAppliedVaccineDose(input));
}
