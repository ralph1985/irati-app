"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { registerSleepEntry } from "@/modules/sleep/application/create-sleep-entry";
import { deleteSleepEntry } from "@/modules/sleep/application/delete-sleep-entry";
import { updateSleepEntry } from "@/modules/sleep/application/update-sleep-entry";
import { isSleepKind, SleepEntryValidationError } from "@/modules/sleep/domain/sleep-entry";
import { SupabaseSleepRepository } from "@/modules/sleep/infrastructure/supabase-sleep-repository";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";

export async function createSleepEntryAction(formData: FormData) {
  await requireSession();

  try {
    await registerSleepEntry(
      new SupabaseSleepRepository(createServerSupabaseClient()),
      readSleepEntry(formData),
    );
  } catch (error) {
    redirect(`/sueno?error=${error instanceof SleepEntryValidationError ? "validation" : "save"}`);
  }

  invalidateSleepReads();
  redirect("/sueno?created=1");
}

export async function updateSleepEntryAction(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");

  try {
    await updateSleepEntry(
      new SupabaseSleepRepository(createServerSupabaseClient()),
      id,
      readSleepEntry(formData),
    );
  } catch (error) {
    redirect(`/sueno?error=${error instanceof SleepEntryValidationError ? "validation" : "save"}`);
  }

  invalidateSleepReads();
  redirect("/sueno?updated=1");
}

export async function deleteSleepEntryAction(formData: FormData) {
  await requireSession();

  try {
    await deleteSleepEntry(
      new SupabaseSleepRepository(createServerSupabaseClient()),
      String(formData.get("id") ?? ""),
    );
  } catch {
    redirect("/sueno?error=delete");
  }

  invalidateSleepReads();
  redirect("/sueno?deleted=1");
}

async function requireSession() {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }
}

function readSleepEntry(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const startedAt = String(formData.get("startedAt") ?? "");
  const endedAt = String(formData.get("endedAt") ?? "").trim();

  if (!isSleepKind(kind)) {
    throw new SleepEntryValidationError(["El tipo de sueño no es válido."]);
  }

  return { endedAt: endedAt || null, kind, startedAt };
}

function invalidateSleepReads() {
  updateTag(CACHE_TAGS.sleepEntries);
  revalidatePath("/sueno");
}
