"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { updatePlannedVaccineDose } from "@/modules/vaccines/application/update-planned-vaccine-dose";
import { PlannedVaccineDoseValidationError } from "@/modules/vaccines/domain/vaccine-calendar";
import { SupabaseVaccinePlanRepository } from "@/modules/vaccines/infrastructure/supabase-vaccine-plan-repository";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";

export async function updatePlannedVaccineDoseAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  try {
    await updatePlannedVaccineDose(
      new SupabaseVaccinePlanRepository(createServerSupabaseClient()),
      String(formData.get("id") ?? ""),
      {
        vaccineName: String(formData.get("vaccineName") ?? ""),
        doseLabel: String(formData.get("doseLabel") ?? ""),
        plannedDate: String(formData.get("plannedDate") ?? ""),
        ageLabel: String(formData.get("ageLabel") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      },
    );
  } catch (error) {
    if (error instanceof PlannedVaccineDoseValidationError) {
      redirect("/vacunas?error=validation");
    }

    redirect("/vacunas?error=save");
  }

  revalidatePath("/vacunas");
  revalidatePath("/");
  redirect("/vacunas?updated=1");
}
