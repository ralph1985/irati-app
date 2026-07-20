"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { deleteWeightEntry } from "@/modules/weight/application/delete-weight-entry";
import { registerWeightEntry } from "@/modules/weight/application/register-weight-entry";
import { updateWeightEntry } from "@/modules/weight/application/update-weight-entry";
import { isWeightPlace, WeightEntryValidationError } from "@/modules/weight/domain/weight-entry";
import { SupabaseWeightRepository } from "@/modules/weight/infrastructure/supabase-weight-repository";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";

export async function createWeightEntryAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  const measuredOn = String(formData.get("measuredOn") ?? "");
  const rawWeightGrams = Number(formData.get("weightGrams"));
  const rawPlace = String(formData.get("place") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const successPath = getCreateWeightSuccessPath(formData);
  const validationErrorPath = getCreateWeightErrorPath(formData, "validation");
  const saveErrorPath = getCreateWeightErrorPath(formData, "save");

  if (!isWeightPlace(rawPlace)) {
    redirect(validationErrorPath);
  }

  try {
    await registerWeightEntry(new SupabaseWeightRepository(createServerSupabaseClient()), {
      measuredOn,
      weightGrams: rawWeightGrams,
      place: rawPlace,
      notes,
    });
  } catch (error) {
    if (error instanceof WeightEntryValidationError) {
      redirect(validationErrorPath);
    }

    redirect(saveErrorPath);
  }

  invalidateWeightReads();
  redirect(successPath);
}

export async function updateWeightEntryAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  const id = String(formData.get("id") ?? "");
  const measuredOn = String(formData.get("measuredOn") ?? "");
  const rawWeightGrams = Number(formData.get("weightGrams"));
  const rawPlace = String(formData.get("place") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!isWeightPlace(rawPlace)) {
    redirect("/peso?error=validation");
  }

  try {
    await updateWeightEntry(new SupabaseWeightRepository(createServerSupabaseClient()), id, {
      measuredOn,
      weightGrams: rawWeightGrams,
      place: rawPlace,
      notes,
    });
  } catch (error) {
    if (error instanceof WeightEntryValidationError) {
      redirect("/peso?error=validation");
    }

    redirect("/peso?error=save");
  }

  invalidateWeightReads();
  redirect("/peso?updated=1");
}

export async function deleteWeightEntryAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  try {
    await deleteWeightEntry(
      new SupabaseWeightRepository(createServerSupabaseClient()),
      String(formData.get("id") ?? ""),
    );
  } catch {
    redirect("/peso?error=delete");
  }

  invalidateWeightReads();
  redirect("/peso?deleted=1");
}

function invalidateWeightReads() {
  updateTag(CACHE_TAGS.weightEntries);
  revalidatePath("/peso");
  revalidatePath("/");
}

function getCreateWeightSuccessPath(formData: FormData): string {
  return formData.get("returnTo") === "/" ? "/?weightCreated=1" : "/peso?created=1";
}

function getCreateWeightErrorPath(formData: FormData, error: "save" | "validation"): string {
  return formData.get("returnTo") === "/" ? `/?error=weight-${error}` : `/peso?error=${error}`;
}
