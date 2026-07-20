"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { updateBabyProfile } from "@/modules/profile/application/update-baby-profile";
import { BabyProfileValidationError } from "@/modules/profile/domain/baby-profile";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import { CACHE_TAGS } from "@/shared/infrastructure/cache/cache-tags";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";

export async function updateBabyProfileAction(formData: FormData) {
  if (!(await hasValidSession())) {
    redirect("/?error=session");
  }

  try {
    await updateBabyProfile(new SupabaseProfileRepository(createServerSupabaseClient()), {
      cipa: String(formData.get("cipa") ?? ""),
    });
  } catch (error) {
    if (error instanceof BabyProfileValidationError) {
      redirect("/ajustes?error=validation");
    }

    redirect("/ajustes?error=save");
  }

  updateTag(CACHE_TAGS.profile);
  revalidatePath("/ajustes");
  revalidatePath("/");
  redirect("/ajustes?updated=1");
}
