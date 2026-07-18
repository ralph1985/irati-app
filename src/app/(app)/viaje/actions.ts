"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createTravelChecklistItem } from "@/modules/travel/application/create-travel-checklist-item";
import { deleteTravelChecklistItem } from "@/modules/travel/application/delete-travel-checklist-item";
import { resetTravelChecklist } from "@/modules/travel/application/reset-travel-checklist";
import { setTravelChecklistItemPacked } from "@/modules/travel/application/set-travel-checklist-item-packed";
import { updateTravelChecklistItem } from "@/modules/travel/application/update-travel-checklist-item";
import {
  isTravelChecklistCategory,
  TravelChecklistItemValidationError,
} from "@/modules/travel/domain/travel-checklist-item";
import { SupabaseTravelChecklistRepository } from "@/modules/travel/infrastructure/supabase-travel-checklist-repository";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";

export async function createTravelChecklistItemAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  const category = String(formData.get("category") ?? "");

  if (!isTravelChecklistCategory(category)) {
    redirect("/viaje?error=validation");
  }

  try {
    await createTravelChecklistItem(newRepository(), {
      label: String(formData.get("label") ?? ""),
      category,
      sortOrder: Number(formData.get("sortOrder") ?? 1000),
      notes: String(formData.get("notes") ?? ""),
    });
  } catch (error) {
    if (error instanceof TravelChecklistItemValidationError) {
      redirect("/viaje?error=validation");
    }

    redirect("/viaje?error=save");
  }

  invalidateTravelChecklistReads();
  redirect("/viaje?created=1");
}

export async function updateTravelChecklistItemAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  const category = String(formData.get("category") ?? "");

  if (!isTravelChecklistCategory(category)) {
    redirect("/viaje?error=validation");
  }

  try {
    await updateTravelChecklistItem(newRepository(), String(formData.get("id") ?? ""), {
      label: String(formData.get("label") ?? ""),
      category,
      sortOrder: Number(formData.get("sortOrder") ?? 1000),
      isPacked: formData.get("isPacked") === "true",
      notes: String(formData.get("notes") ?? ""),
    });
  } catch (error) {
    if (error instanceof TravelChecklistItemValidationError) {
      redirect("/viaje?error=validation");
    }

    redirect("/viaje?error=save");
  }

  invalidateTravelChecklistReads();
  redirect("/viaje?updated=1");
}

export async function setTravelChecklistItemPackedAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  try {
    await setTravelChecklistItemPacked(
      newRepository(),
      String(formData.get("id") ?? ""),
      formData.get("isPacked") === "true",
    );
  } catch {
    redirect("/viaje?error=save");
  }

  invalidateTravelChecklistReads();
  redirect("/viaje");
}

export async function deleteTravelChecklistItemAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  try {
    await deleteTravelChecklistItem(newRepository(), String(formData.get("id") ?? ""));
  } catch {
    redirect("/viaje?error=delete");
  }

  invalidateTravelChecklistReads();
  redirect("/viaje?deleted=1");
}

export async function resetTravelChecklistAction() {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  try {
    await resetTravelChecklist(newRepository());
  } catch {
    redirect("/viaje?error=reset");
  }

  invalidateTravelChecklistReads();
  redirect("/viaje?reset=1");
}

function newRepository() {
  return new SupabaseTravelChecklistRepository(createServerSupabaseClient());
}

function invalidateTravelChecklistReads() {
  updateTag(CACHE_TAGS.travelChecklistItems);
  revalidatePath("/viaje");
}
