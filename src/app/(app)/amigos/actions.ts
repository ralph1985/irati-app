"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { createFriendEntry } from "@/modules/friends/application/create-friend-entry";
import { renameFriendGroup } from "@/modules/friends/application/rename-friend-group";
import { updateFriendEntry } from "@/modules/friends/application/update-friend-entry";
import {
  FriendEntryValidationError,
  normalizeFriendEntryInput,
} from "@/modules/friends/domain/friend-entry";
import { SupabaseFriendRepository } from "@/modules/friends/infrastructure/supabase-friend-repository";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";

export async function createFriendEntryAction(formData: FormData): Promise<void> {
  await requireSession();
  const repository = newRepository();

  try {
    const input = readFriendEntryInput(formData);
    const entries = await repository.listFriendEntries();
    const sortOrder =
      entries.reduce((maximum, entry) => Math.max(maximum, entry.sortOrder), 0) + 10;

    await createFriendEntry(repository, {
      ...input,
      id: crypto.randomUUID(),
      sortOrder,
    });
  } catch (error) {
    redirect(
      `/amigos?error=${error instanceof FriendEntryValidationError ? "validation" : "save"}`,
    );
  }

  invalidateFriendReads();
  redirect("/amigos?created=1");
}

export async function updateFriendEntryAction(formData: FormData): Promise<void> {
  await requireSession();
  const repository = newRepository();

  try {
    const id = readRequiredValue(formData, "id");
    await updateFriendEntry(repository, id, readFriendEntryInput(formData));
  } catch (error) {
    redirect(
      `/amigos?error=${error instanceof FriendEntryValidationError ? "validation" : "save"}`,
    );
  }

  invalidateFriendReads();
  redirect("/amigos?updated=1");
}

export async function renameFriendGroupAction(formData: FormData): Promise<void> {
  await requireSession();
  const repository = newRepository();

  try {
    const currentLabel = readRequiredValue(formData, "currentLabel");
    const nextLabel = readRequiredValue(formData, "nextLabel");
    const entries = await repository.listFriendEntries();
    const hasConflictingGroup = entries.some(
      (entry) => entry.groupLabel === nextLabel && entry.groupLabel !== currentLabel,
    );

    if (hasConflictingGroup) {
      throw new FriendEntryValidationError(["Ya existe un grupo con ese nombre."]);
    }

    await renameFriendGroup(repository, currentLabel, nextLabel);
  } catch (error) {
    redirect(
      `/amigos?error=${error instanceof FriendEntryValidationError ? "validation" : "save"}`,
    );
  }

  invalidateFriendReads();
  redirect("/amigos?groupUpdated=1");
}

function readFriendEntryInput(formData: FormData) {
  return normalizeFriendEntryInput({
    adultsLabel: String(formData.get("adultsLabel") ?? ""),
    childrenLabel: String(formData.get("childrenLabel") ?? ""),
    groupLabel: String(formData.get("groupLabel") ?? ""),
  });
}

function readRequiredValue(formData: FormData, name: string): string {
  const value = String(formData.get(name) ?? "").trim();

  if (!value) {
    throw new FriendEntryValidationError([`Falta el campo ${name}.`]);
  }

  return value;
}

async function requireSession(): Promise<void> {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }
}

function newRepository(): SupabaseFriendRepository {
  return new SupabaseFriendRepository(createServerSupabaseClient());
}

function invalidateFriendReads(): void {
  updateTag(CACHE_TAGS.friends);
  revalidatePath("/amigos");
}
