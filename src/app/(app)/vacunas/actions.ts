"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { markVaccineDoseApplied } from "@/modules/vaccines/application/mark-vaccine-dose-applied";
import { reopenPlannedVaccineDose } from "@/modules/vaccines/application/reopen-planned-vaccine-dose";
import { updateAppliedVaccineDose } from "@/modules/vaccines/application/update-applied-vaccine-dose";
import { updatePlannedVaccineDose } from "@/modules/vaccines/application/update-planned-vaccine-dose";
import {
  AppliedVaccineDoseValidationError,
  PlannedVaccineDoseValidationError,
} from "@/modules/vaccines/domain/vaccine-calendar";
import { SupabaseVaccinePlanRepository } from "@/modules/vaccines/infrastructure/supabase-vaccine-plan-repository";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
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

  invalidateVaccineReads();
  redirect("/vacunas?updated=1");
}

export async function markVaccineDoseAppliedAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  try {
    await markVaccineDoseApplied(new SupabaseVaccinePlanRepository(createServerSupabaseClient()), {
      plannedDoseId: String(formData.get("plannedDoseId") ?? ""),
      appliedOn: String(formData.get("appliedOn") ?? ""),
      vaccineName: String(formData.get("vaccineName") ?? ""),
      doseLabel: String(formData.get("doseLabel") ?? ""),
      place: String(formData.get("place") ?? ""),
      lot: String(formData.get("lot") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
  } catch (error) {
    if (error instanceof AppliedVaccineDoseValidationError) {
      redirect("/vacunas?error=application-validation");
    }

    redirect("/vacunas?error=application-save");
  }

  invalidateVaccineReads();
  redirect("/vacunas?applied=1");
}

export async function updateAppliedVaccineDoseAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  try {
    await updateAppliedVaccineDose(
      new SupabaseVaccinePlanRepository(createServerSupabaseClient()),
      String(formData.get("applicationId") ?? ""),
      {
        plannedDoseId: String(formData.get("plannedDoseId") ?? ""),
        appliedOn: String(formData.get("appliedOn") ?? ""),
        vaccineName: String(formData.get("vaccineName") ?? ""),
        doseLabel: String(formData.get("doseLabel") ?? ""),
        place: String(formData.get("place") ?? ""),
        lot: String(formData.get("lot") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      },
    );
  } catch (error) {
    if (error instanceof AppliedVaccineDoseValidationError) {
      redirect("/vacunas?error=application-validation");
    }

    redirect("/vacunas?error=application-save");
  }

  invalidateVaccineReads();
  redirect("/vacunas?applicationUpdated=1");
}

export async function reopenPlannedVaccineDoseAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  try {
    await reopenPlannedVaccineDose(
      new SupabaseVaccinePlanRepository(createServerSupabaseClient()),
      String(formData.get("applicationId") ?? ""),
    );
  } catch {
    redirect("/vacunas?error=reopen");
  }

  invalidateVaccineReads();
  redirect("/vacunas?reopened=1");
}

function invalidateVaccineReads() {
  updateTag(CACHE_TAGS.vaccineAppliedDoses);
  updateTag(CACHE_TAGS.vaccinePlannedDoses);
  revalidatePath("/vacunas");
  revalidatePath("/");
}
