import { SupabaseClient } from "@supabase/supabase-js";
import { VaccinePlanRepository } from "../application/vaccine-plan-repository";
import {
  AppliedVaccineDose,
  NewAppliedVaccineDose,
  NewPlannedVaccineDose,
  PlannedVaccineDose,
} from "../domain/vaccine-calendar";
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

  async listAppliedVaccineDoses(): Promise<AppliedVaccineDose[]> {
    const { data, error } = await this.supabase
      .from("applied_vaccine_doses")
      .select("id,planned_dose_id,applied_on,vaccine_name,dose_label,place,lot,notes")
      .order("applied_on", { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(mapAppliedDose);
  }

  async createAppliedVaccineDose(dose: NewAppliedVaccineDose): Promise<AppliedVaccineDose> {
    const { data, error } = await this.supabase
      .from("applied_vaccine_doses")
      .insert({
        planned_dose_id: dose.plannedDoseId,
        applied_on: dose.appliedOn,
        vaccine_name: dose.vaccineName,
        dose_label: dose.doseLabel,
        place: dose.place,
        lot: dose.lot,
        notes: dose.notes,
      })
      .select("id,planned_dose_id,applied_on,vaccine_name,dose_label,place,lot,notes")
      .single();

    if (error) {
      throw error;
    }

    return mapAppliedDose(data);
  }

  async updateAppliedVaccineDose(
    id: string,
    dose: NewAppliedVaccineDose,
  ): Promise<AppliedVaccineDose> {
    const { data, error } = await this.supabase
      .from("applied_vaccine_doses")
      .update({
        planned_dose_id: dose.plannedDoseId,
        applied_on: dose.appliedOn,
        vaccine_name: dose.vaccineName,
        dose_label: dose.doseLabel,
        place: dose.place,
        lot: dose.lot,
        notes: dose.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,planned_dose_id,applied_on,vaccine_name,dose_label,place,lot,notes")
      .single();

    if (error) {
      throw error;
    }

    return mapAppliedDose(data);
  }

  async deleteAppliedVaccineDose(id: string): Promise<void> {
    const { error } = await this.supabase.from("applied_vaccine_doses").delete().eq("id", id);

    if (error) {
      throw error;
    }
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

function mapAppliedDose(row: {
  id: string;
  planned_dose_id: string | null;
  applied_on: string;
  vaccine_name: string;
  dose_label: string;
  place: string;
  lot: string | null;
  notes: string | null;
}): AppliedVaccineDose {
  return {
    id: row.id,
    plannedDoseId: row.planned_dose_id,
    appliedOn: row.applied_on,
    vaccineName: row.vaccine_name,
    doseLabel: row.dose_label,
    place: row.place,
    lot: row.lot,
    notes: row.notes,
  };
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
