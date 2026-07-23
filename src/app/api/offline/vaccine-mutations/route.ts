import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import {
  applyOfflineVaccineMutation,
  OfflineVaccineMutationConflictError,
  type OfflineVaccineMutationRepository,
} from "@/modules/vaccines/application/apply-offline-vaccine-mutation";
import type { PendingVaccineMutation as PendingVaccineMutationPayload } from "@/modules/vaccines/application/vaccine-offline-conflicts";
import type {
  AppliedVaccineDose,
  PlannedVaccineDose,
} from "@/modules/vaccines/domain/vaccine-calendar";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import type { Database } from "@/shared/infrastructure/supabase/database.types";
import type { PendingVaccineMutation } from "@/shared/infrastructure/offline/irati-offline-db";

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mutation = await request.json().catch(() => null);

  if (!isPendingVaccineMutation(mutation)) {
    return NextResponse.json({ error: "Invalid mutation" }, { status: 400 });
  }

  try {
    await applyOfflineVaccineMutation(
      new SupabaseOfflineVaccineMutationRepository(createServerSupabaseClient()),
      mutation,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OfflineVaccineMutationConflictError) {
      return NextResponse.json({ conflict: error.code, error: "Manual conflict" }, { status: 409 });
    }

    return NextResponse.json({ error: "Mutation rejected" }, { status: 422 });
  }
}

class SupabaseOfflineVaccineMutationRepository implements OfflineVaccineMutationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async readRemoteState(mutation: PendingVaccineMutationPayload): Promise<{
    application: AppliedVaccineDose | null;
    plannedDose: PlannedVaccineDose | null;
  }> {
    const [plannedDose, application] = await Promise.all([
      this.readPlannedDose(getPlannedDoseId(mutation)),
      this.readAppliedDose(mutation),
    ]);

    return { application, plannedDose };
  }

  async updatePlannedVaccineDose(id: string, dose: Omit<PlannedVaccineDose, "id">): Promise<void> {
    const { error } = await this.supabase
      .from("planned_vaccine_doses")
      .update({
        age_label: dose.ageLabel,
        dose_label: dose.doseLabel,
        notes: dose.notes,
        planned_date: dose.plannedDate,
        updated_at: new Date().toISOString(),
        vaccine_name: dose.vaccineName,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }

  async upsertAppliedVaccineDose(id: string, dose: Omit<AppliedVaccineDose, "id">): Promise<void> {
    const { error } = await this.supabase.from("applied_vaccine_doses").upsert({
      id,
      applied_on: dose.appliedOn,
      dose_label: dose.doseLabel,
      lot: dose.lot,
      notes: dose.notes,
      place: dose.place,
      planned_dose_id: dose.plannedDoseId,
      updated_at: new Date().toISOString(),
      vaccine_name: dose.vaccineName,
    });

    if (error) {
      throw error;
    }
  }

  async updateAppliedVaccineDose(id: string, dose: Omit<AppliedVaccineDose, "id">): Promise<void> {
    const { error } = await this.supabase
      .from("applied_vaccine_doses")
      .update({
        applied_on: dose.appliedOn,
        dose_label: dose.doseLabel,
        lot: dose.lot,
        notes: dose.notes,
        place: dose.place,
        planned_dose_id: dose.plannedDoseId,
        updated_at: new Date().toISOString(),
        vaccine_name: dose.vaccineName,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }

  async deleteAppliedVaccineDose(id: string): Promise<void> {
    const { error } = await this.supabase.from("applied_vaccine_doses").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  private async readPlannedDose(id: string): Promise<PlannedVaccineDose | null> {
    const { data, error } = await this.supabase
      .from("planned_vaccine_doses")
      .select("id,vaccine_name,dose_label,planned_date,age_label,notes")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapPlannedDose(data) : null;
  }

  private async readAppliedDose(
    mutation: PendingVaccineMutationPayload,
  ): Promise<AppliedVaccineDose | null> {
    if (mutation.operation === "updatePlanned") {
      return null;
    }

    const query = this.supabase
      .from("applied_vaccine_doses")
      .select("id,planned_dose_id,applied_on,vaccine_name,dose_label,place,lot,notes");

    const { data, error } =
      mutation.operation === "markApplied"
        ? await query.eq("planned_dose_id", mutation.payload.plannedDoseId).maybeSingle()
        : await query.eq("id", getApplicationId(mutation)).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapAppliedDose(data) : null;
  }
}

function isPendingVaccineMutation(value: unknown): value is PendingVaccineMutation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const mutation = value as PendingVaccineMutation;

  return (
    mutation.entity === "vaccine" &&
    ["updatePlanned", "markApplied", "updateApplication", "reopen"].includes(mutation.operation) &&
    typeof mutation.id === "string" &&
    typeof mutation.createdAt === "string" &&
    typeof mutation.payload === "object" &&
    mutation.payload !== null &&
    isPendingVaccineMutationPayload(mutation)
  );
}

function isPendingVaccineMutationPayload(
  mutation: PendingVaccineMutation,
): mutation is PendingVaccineMutation {
  if (mutation.operation === "updatePlanned") {
    return (
      typeof mutation.payload.id === "string" &&
      isPlannedDose(mutation.payload.basePlannedDose) &&
      isNewPlannedDose(mutation.payload.dose)
    );
  }

  if (mutation.operation === "markApplied") {
    return (
      typeof mutation.payload.applicationId === "string" &&
      typeof mutation.payload.plannedDoseId === "string" &&
      isNewAppliedDose(mutation.payload.dose)
    );
  }

  if (mutation.operation === "updateApplication") {
    return (
      typeof mutation.payload.id === "string" &&
      typeof mutation.payload.plannedDoseId === "string" &&
      isAppliedDose(mutation.payload.baseApplication) &&
      isNewAppliedDose(mutation.payload.dose)
    );
  }

  return (
    typeof mutation.payload.applicationId === "string" &&
    typeof mutation.payload.plannedDoseId === "string" &&
    isAppliedDose(mutation.payload.baseApplication)
  );
}

function isPlannedDose(value: unknown): value is PlannedVaccineDose {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as PlannedVaccineDose).id === "string" &&
    isNewPlannedDose(value)
  );
}

function isNewPlannedDose(value: unknown): value is Omit<PlannedVaccineDose, "id"> {
  const dose = value as Omit<PlannedVaccineDose, "id">;

  return (
    !!value &&
    typeof value === "object" &&
    typeof dose.vaccineName === "string" &&
    typeof dose.doseLabel === "string" &&
    typeof dose.plannedDate === "string" &&
    isDateString(dose.plannedDate) &&
    (dose.ageLabel === null || typeof dose.ageLabel === "string") &&
    (dose.notes === null || typeof dose.notes === "string")
  );
}

function isAppliedDose(value: unknown): value is AppliedVaccineDose {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as AppliedVaccineDose).id === "string" &&
    isNewAppliedDose(value)
  );
}

function isNewAppliedDose(value: unknown): value is Omit<AppliedVaccineDose, "id"> {
  const dose = value as Omit<AppliedVaccineDose, "id">;

  return (
    !!value &&
    typeof value === "object" &&
    (dose.plannedDoseId === null || typeof dose.plannedDoseId === "string") &&
    typeof dose.appliedOn === "string" &&
    isDateString(dose.appliedOn) &&
    typeof dose.vaccineName === "string" &&
    typeof dose.doseLabel === "string" &&
    typeof dose.place === "string" &&
    (dose.lot === null || typeof dose.lot === "string") &&
    (dose.notes === null || typeof dose.notes === "string")
  );
}

function getPlannedDoseId(mutation: PendingVaccineMutationPayload): string {
  if (mutation.operation === "updatePlanned") {
    return mutation.payload.id;
  }

  return mutation.payload.plannedDoseId;
}

function getApplicationId(mutation: PendingVaccineMutationPayload): string {
  if (mutation.operation === "markApplied") {
    return mutation.payload.applicationId;
  }

  if (mutation.operation === "updateApplication") {
    return mutation.payload.id;
  }

  if (mutation.operation === "updatePlanned") {
    throw new Error("Planned vaccine mutations do not have an application id");
  }

  return mutation.payload.applicationId;
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
    appliedOn: row.applied_on,
    doseLabel: row.dose_label,
    id: row.id,
    lot: row.lot,
    notes: row.notes,
    place: row.place,
    plannedDoseId: row.planned_dose_id,
    vaccineName: row.vaccine_name,
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
    ageLabel: row.age_label,
    doseLabel: row.dose_label,
    id: row.id,
    notes: row.notes,
    plannedDate: row.planned_date,
    vaccineName: row.vaccine_name,
  };
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
