import { BabyProfile, BabyProfileUpdate } from "../domain/baby-profile";

export type ProfileRepository = {
  getBabyProfile(): Promise<BabyProfile | null>;
  updateBabyProfile(profile: BabyProfileUpdate): Promise<BabyProfile>;
};
