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
  TravelChecklistReorder,
  TravelChecklistCategory,
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

  const repository = newRepository();

  try {
    await createTravelChecklistItem(repository, {
      label: String(formData.get("label") ?? ""),
      category,
      sortOrder: await getNextSortOrder(repository, category),
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

  const repository = newRepository();
  const currentSortOrder = Number(formData.get("sortOrder") ?? 0);
  const previousCategory = String(formData.get("previousCategory") ?? "");
  const sortOrder =
    previousCategory === category && Number.isInteger(currentSortOrder)
      ? currentSortOrder
      : await getNextSortOrder(repository, category);

  try {
    await updateTravelChecklistItem(repository, String(formData.get("id") ?? ""), {
      label: String(formData.get("label") ?? ""),
      category,
      sortOrder,
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

export async function reorderTravelChecklistItemsAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  const rawItems = String(formData.get("items") ?? "");
  const items = parseTravelChecklistReorder(rawItems);

  if (!items) {
    return;
  }

  const { error } = await createServerSupabaseClient().rpc("reorder_travel_checklist_items", {
    p_items: items,
  });

  if (error) {
    throw error;
  }

  invalidateTravelChecklistReads();
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

async function getNextSortOrder(
  repository: Pick<SupabaseTravelChecklistRepository, "listTravelChecklistItems">,
  category: TravelChecklistCategory,
): Promise<number> {
  const items = await repository.listTravelChecklistItems();
  const lastSortOrder = items
    .filter((item) => item.category === category)
    .reduce((maxSortOrder, item) => Math.max(maxSortOrder, item.sortOrder), 0);

  return lastSortOrder + 10;
}

function invalidateTravelChecklistReads() {
  updateTag(CACHE_TAGS.travelChecklistItems);
  revalidatePath("/viaje");
}

function parseTravelChecklistReorder(rawItems: string): TravelChecklistReorder[] | null {
  try {
    const value: unknown = JSON.parse(rawItems);

    if (!Array.isArray(value) || value.length > 100) {
      return null;
    }

    if (
      !value.every(
        (item) =>
          Boolean(item) &&
          typeof item === "object" &&
          "id" in item &&
          typeof item.id === "string" &&
          "category" in item &&
          typeof item.category === "string" &&
          isTravelChecklistCategory(item.category) &&
          "sortOrder" in item &&
          Number.isInteger(item.sortOrder) &&
          item.sortOrder >= 10 &&
          item.sortOrder <= 1000,
      )
    ) {
      return null;
    }

    return value as TravelChecklistReorder[];
  } catch {
    return null;
  }
}
