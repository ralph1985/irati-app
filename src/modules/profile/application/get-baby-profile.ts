import { BabyProfile, iratiProfile } from "../domain/baby-profile";
import { ProfileRepository } from "./profile-repository";

export type GetBabyProfileResult = {
  profile: BabyProfile;
  source: "database" | "fallback";
};

export async function getBabyProfile(
  repository: Pick<ProfileRepository, "getBabyProfile">,
): Promise<GetBabyProfileResult> {
  const profile = await repository.getBabyProfile();

  if (!profile) {
    return {
      profile: iratiProfile,
      source: "fallback",
    };
  }

  return {
    profile,
    source: "database",
  };
}
