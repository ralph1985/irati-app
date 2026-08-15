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
  reorderTravelChecklistItems,
  TravelChecklistReorder,
  TravelStorageReorder,
  TravelChecklistItem,
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
      storageLocationId: String(formData.get("storageLocationId") ?? "") || null,
      storageSortOrder: await getNextStorageSortOrder(
        repository,
        String(formData.get("storageLocationId") ?? "") || null,
      ),
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

  try {
    const currentItems = await repository.listTravelChecklistItems();
    const categories = await repository.listTravelChecklistCategories();
    const currentItem = currentItems.find((item) => item.id === String(formData.get("id") ?? ""));
    const storageLocationId = String(formData.get("storageLocationId") ?? "") || null;
    const targetItems = currentItems.filter(
      (item) => item.category === category && item.id !== currentItem?.id,
    );
    const requestedPosition = Number(formData.get("position") ?? 0);
    const targetIndex = Number.isInteger(requestedPosition)
      ? Math.max(0, Math.min(requestedPosition - 1, targetItems.length))
      : targetItems.length;
    const reorderedItems = currentItem
      ? reorderTravelChecklistItems(currentItems, currentItem.id, category, targetIndex, categories)
      : currentItems;
    const reorderedItem = reorderedItems.find((item) => item.id === currentItem?.id);

    await updateTravelChecklistItem(repository, String(formData.get("id") ?? ""), {
      label: String(formData.get("label") ?? ""),
      category,
      sortOrder: reorderedItem?.sortOrder ?? targetIndex * 10 + 10,
      isPacked: formData.get("isPacked") === "true",
      notes: String(formData.get("notes") ?? ""),
      storageLocationId,
      storageSortOrder:
        currentItem?.storageLocationId === storageLocationId
          ? (currentItem.storageSortOrder ?? null)
          : await getNextStorageSortOrder(repository, storageLocationId),
    });
    if (reorderedItems.length > 0) {
      await persistTravelChecklistReorder(reorderedItems);
    }
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

export async function reorderTravelChecklistItemsByLocationAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  const items = parseTravelStorageReorder(String(formData.get("items") ?? ""));

  if (!items) {
    return;
  }

  const { error } = await createServerSupabaseClient().rpc(
    "reorder_travel_checklist_items_by_location",
    { p_items: items },
  );

  if (error) {
    throw error;
  }

  invalidateTravelChecklistReads();
}

async function persistTravelChecklistReorder(items: TravelChecklistItem[]) {
  const { error } = await createServerSupabaseClient().rpc("reorder_travel_checklist_items", {
    p_items: items.map(({ id, category, sortOrder }) => ({ id, category, sortOrder })),
  });

  if (error) {
    throw error;
  }
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

export async function createTravelChecklistCategoryAction(formData: FormData) {
  if (!(await hasValidSession())) redirect("/?error=session");
  try {
    await newRepository().createTravelChecklistCategory(String(formData.get("label") ?? ""));
  } catch {
    redirect("/viaje?error=save");
  }
  invalidateTravelChecklistReads();
  redirect("/viaje?updated=1");
}

export async function updateTravelChecklistCategoryAction(formData: FormData) {
  if (!(await hasValidSession())) redirect("/?error=session");
  try {
    await newRepository().updateTravelChecklistCategory(
      String(formData.get("slug") ?? ""),
      String(formData.get("label") ?? ""),
      Number(formData.get("sortOrder") ?? 0),
    );
  } catch {
    redirect("/viaje?error=save");
  }
  invalidateTravelChecklistReads();
  redirect("/viaje?updated=1");
}

export async function deleteTravelChecklistCategoryAction(formData: FormData) {
  if (!(await hasValidSession())) redirect("/?error=session");
  try {
    await newRepository().deleteTravelChecklistCategory(String(formData.get("slug") ?? ""));
  } catch {
    redirect("/viaje?error=delete");
  }
  invalidateTravelChecklistReads();
  redirect("/viaje?updated=1");
}

export async function createTravelStorageLocationAction(formData: FormData) {
  if (!(await hasValidSession())) redirect("/?error=session");
  try {
    await newRepository().createTravelStorageLocation({
      label: String(formData.get("label") ?? "").trim(),
      parentId: String(formData.get("parentId") ?? "") || null,
      sortOrder: Number(formData.get("sortOrder") ?? 10),
    });
  } catch {
    redirect("/viaje?error=save");
  }
  invalidateTravelChecklistReads();
  redirect("/viaje?updated=1");
}

export async function updateTravelStorageLocationAction(formData: FormData) {
  if (!(await hasValidSession())) redirect("/?error=session");
  try {
    await newRepository().updateTravelStorageLocation(String(formData.get("id") ?? ""), {
      label: String(formData.get("label") ?? "").trim(),
      parentId: String(formData.get("parentId") ?? "") || null,
      sortOrder: Number(formData.get("sortOrder") ?? 10),
    });
  } catch {
    redirect("/viaje?error=save");
  }
  invalidateTravelChecklistReads();
  redirect("/viaje?updated=1");
}

export async function deleteTravelStorageLocationAction(formData: FormData) {
  if (!(await hasValidSession())) redirect("/?error=session");
  try {
    await newRepository().deleteTravelStorageLocation(String(formData.get("id") ?? ""));
  } catch {
    redirect("/viaje?error=delete");
  }
  invalidateTravelChecklistReads();
  redirect("/viaje?updated=1");
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

async function getNextStorageSortOrder(
  repository: Pick<SupabaseTravelChecklistRepository, "listTravelChecklistItems">,
  storageLocationId: string | null,
): Promise<number | null> {
  if (!storageLocationId) return null;

  const items = await repository.listTravelChecklistItems();
  const lastStorageSortOrder = items
    .filter((item) => item.storageLocationId === storageLocationId)
    .reduce((maxSortOrder, item) => Math.max(maxSortOrder, item.storageSortOrder ?? 0), 0);

  return lastStorageSortOrder + 10;
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

function parseTravelStorageReorder(rawItems: string): TravelStorageReorder[] | null {
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
          "storageLocationId" in item &&
          (item.storageLocationId === null || typeof item.storageLocationId === "string") &&
          "storageSortOrder" in item &&
          (item.storageSortOrder === null ||
            (Number.isInteger(item.storageSortOrder) &&
              typeof item.storageSortOrder === "number" &&
              item.storageSortOrder >= 0 &&
              item.storageSortOrder <= 10000)),
      )
    ) {
      return null;
    }

    return value as TravelStorageReorder[];
  } catch {
    return null;
  }
}
