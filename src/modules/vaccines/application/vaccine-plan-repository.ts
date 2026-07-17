import {
  AppliedVaccineDose,
  NewAppliedVaccineDose,
  NewPlannedVaccineDose,
  PlannedVaccineDose,
} from "../domain/vaccine-calendar";

export type VaccinePlanRepository = {
  listPlannedVaccineDoses(): Promise<PlannedVaccineDose[]>;
  listAppliedVaccineDoses(): Promise<AppliedVaccineDose[]>;
  createAppliedVaccineDose(dose: NewAppliedVaccineDose): Promise<AppliedVaccineDose>;
  updateAppliedVaccineDose(id: string, dose: NewAppliedVaccineDose): Promise<AppliedVaccineDose>;
  deleteAppliedVaccineDose(id: string): Promise<void>;
  updatePlannedVaccineDose(id: string, dose: NewPlannedVaccineDose): Promise<PlannedVaccineDose>;
};
