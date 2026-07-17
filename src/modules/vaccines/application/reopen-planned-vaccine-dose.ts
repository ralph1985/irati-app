import { VaccinePlanRepository } from "./vaccine-plan-repository";

export async function reopenPlannedVaccineDose(
  repository: VaccinePlanRepository,
  applicationId: string,
) {
  if (!applicationId) {
    throw new Error("Missing applied vaccine dose id");
  }

  await repository.deleteAppliedVaccineDose(applicationId);
}
