import { NewPlannedVaccineDose, PlannedVaccineDose } from "../domain/vaccine-calendar";

export type VaccinePlanRepository = {
  listPlannedVaccineDoses(): Promise<PlannedVaccineDose[]>;
  updatePlannedVaccineDose(id: string, dose: NewPlannedVaccineDose): Promise<PlannedVaccineDose>;
};
