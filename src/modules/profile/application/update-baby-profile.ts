import { BabyProfile, BabyProfileUpdate, createBabyProfileUpdate } from "../domain/baby-profile";
import { ProfileRepository } from "./profile-repository";

export async function updateBabyProfile(
  repository: Pick<ProfileRepository, "updateBabyProfile">,
  profile: BabyProfileUpdate,
): Promise<BabyProfile> {
  return repository.updateBabyProfile(createBabyProfileUpdate(profile));
}
