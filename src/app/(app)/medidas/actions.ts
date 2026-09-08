"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import {
  deleteHeadCircumferenceEntry,
  deleteHeightEntry,
  registerHeadCircumferenceEntry,
  registerHeightEntry,
  updateHeadCircumferenceEntry,
  updateHeightEntry,
} from "@/modules/growth/application/growth-use-cases";
import {
  GrowthEntryValidationError,
  isMeasurementPlace,
  type MeasurementPlace,
} from "@/modules/growth/domain/growth-entry";
import { SupabaseGrowthRepository } from "@/modules/growth/infrastructure/supabase-growth-repository";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";

export async function createGrowthEntryAction(formData: FormData) {
  if (!(await hasValidSession())) redirect("/?error=session");

  const metric = String(formData.get("metric") ?? "");
  try {
    const repository = new SupabaseGrowthRepository(createServerSupabaseClient());
    if (metric === "height") await registerHeightEntry(repository, readHeightInput(formData));
    else if (metric === "headCircumference") {
      await registerHeadCircumferenceEntry(repository, readHeadCircumferenceInput(formData));
    } else redirect("/medidas?error=validation");
  } catch (error) {
    if (error instanceof GrowthEntryValidationError) redirect("/medidas?error=validation");
    redirect("/medidas?error=save");
  }

  invalidateGrowthReads();
  redirect(`/medidas?tipo=${metric === "headCircumference" ? "cabeza" : "altura"}&created=1`);
}

export async function updateGrowthEntryAction(formData: FormData) {
  if (!(await hasValidSession())) redirect("/?error=session");

  const metric = String(formData.get("metric") ?? "");
  const id = String(formData.get("id") ?? "");
  try {
    const repository = new SupabaseGrowthRepository(createServerSupabaseClient());
    if (metric === "height") await updateHeightEntry(repository, id, readHeightInput(formData));
    else if (metric === "headCircumference") {
      await updateHeadCircumferenceEntry(repository, id, readHeadCircumferenceInput(formData));
    } else redirect("/medidas?error=validation");
  } catch (error) {
    if (error instanceof GrowthEntryValidationError) redirect("/medidas?error=validation");
    redirect("/medidas?error=save");
  }

  invalidateGrowthReads();
  redirect(`/medidas?tipo=${metric === "headCircumference" ? "cabeza" : "altura"}&updated=1`);
}

export async function deleteGrowthEntryAction(formData: FormData) {
  if (!(await hasValidSession())) redirect("/?error=session");

  const metric = String(formData.get("metric") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    const repository = new SupabaseGrowthRepository(createServerSupabaseClient());
    if (metric === "height") await deleteHeightEntry(repository, id);
    else if (metric === "headCircumference") await deleteHeadCircumferenceEntry(repository, id);
    else redirect("/medidas?error=validation");
  } catch {
    redirect(`/medidas?tipo=${metric === "headCircumference" ? "cabeza" : "altura"}&error=delete`);
  }

  invalidateGrowthReads();
  redirect(`/medidas?tipo=${metric === "headCircumference" ? "cabeza" : "altura"}&deleted=1`);
}

function readHeightInput(formData: FormData) {
  return {
    measuredOn: String(formData.get("measuredOn") ?? ""),
    heightCm: Number(formData.get("heightCm")),
    notes: String(formData.get("notes") ?? ""),
    place: readPlace(formData),
  };
}

function readHeadCircumferenceInput(formData: FormData) {
  return {
    measuredOn: String(formData.get("measuredOn") ?? ""),
    headCircumferenceCm: Number(formData.get("headCircumferenceCm")),
    notes: String(formData.get("notes") ?? ""),
    place: readPlace(formData),
  };
}

function readPlace(formData: FormData): MeasurementPlace {
  const place = String(formData.get("place") ?? "");
  if (!isMeasurementPlace(place)) {
    throw new GrowthEntryValidationError(["El lugar no es válido."]);
  }
  return place;
}

function invalidateGrowthReads() {
  updateTag(CACHE_TAGS.growthEntries);
  revalidatePath("/medidas");
  revalidatePath("/");
}
