"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { deleteWeightEntry } from "@/modules/weight/application/delete-weight-entry";
import { registerWeightEntry } from "@/modules/weight/application/register-weight-entry";
import { updateWeightEntry } from "@/modules/weight/application/update-weight-entry";
import { isWeightPlace, WeightEntryValidationError } from "@/modules/weight/domain/weight-entry";
import { SupabaseWeightRepository } from "@/modules/weight/infrastructure/supabase-weight-repository";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";

export async function createWeightEntryAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  const measuredOn = String(formData.get("measuredOn") ?? "");
  const rawWeightGrams = Number(formData.get("weightGrams"));
  const rawPlace = String(formData.get("place") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!isWeightPlace(rawPlace)) {
    redirect("/peso?error=validation");
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
      redirect("/peso?error=validation");
    }

    redirect("/peso?error=save");
  }

  revalidatePath("/peso");
  revalidatePath("/");
  redirect("/peso?created=1");
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

  revalidatePath("/peso");
  revalidatePath("/");
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

  revalidatePath("/peso");
  revalidatePath("/");
  redirect("/peso?deleted=1");
}
