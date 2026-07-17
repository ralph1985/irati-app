import {
  AppliedVaccineDose,
  NewPlannedVaccineDose,
  PlannedVaccineDose,
} from "../domain/vaccine-calendar";

export type VaccinePlanRepository = {
  listPlannedVaccineDoses(): Promise<PlannedVaccineDose[]>;
  listAppliedVaccineDoses(): Promise<AppliedVaccineDose[]>;
  updatePlannedVaccineDose(id: string, dose: NewPlannedVaccineDose): Promise<PlannedVaccineDose>;
};
