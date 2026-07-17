import { SupabaseClient } from "@supabase/supabase-js";
import { VaccinePlanRepository } from "../application/vaccine-plan-repository";
import { NewPlannedVaccineDose, PlannedVaccineDose } from "../domain/vaccine-calendar";
import { Database } from "@/shared/infrastructure/supabase/database.types";

export class SupabaseVaccinePlanRepository implements VaccinePlanRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listPlannedVaccineDoses(): Promise<PlannedVaccineDose[]> {
    const { data, error } = await this.supabase
      .from("planned_vaccine_doses")
      .select("id,vaccine_name,dose_label,planned_date,age_label,notes")
      .order("planned_date", { ascending: true })
      .order("vaccine_name", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapPlannedDose);
  }

  async updatePlannedVaccineDose(
    id: string,
    dose: NewPlannedVaccineDose,
  ): Promise<PlannedVaccineDose> {
    const { data, error } = await this.supabase
      .from("planned_vaccine_doses")
      .update({
        vaccine_name: dose.vaccineName,
        dose_label: dose.doseLabel,
        planned_date: dose.plannedDate,
        age_label: dose.ageLabel,
        notes: dose.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,vaccine_name,dose_label,planned_date,age_label,notes")
      .single();

    if (error) {
      throw error;
    }

    return mapPlannedDose(data);
  }
}

function mapPlannedDose(row: {
  id: string;
  vaccine_name: string;
  dose_label: string;
  planned_date: string;
  age_label: string | null;
  notes: string | null;
}): PlannedVaccineDose {
  return {
    id: row.id,
    vaccineName: row.vaccine_name,
    doseLabel: row.dose_label,
    plannedDate: row.planned_date,
    ageLabel: row.age_label,
    notes: row.notes,
  };
}
