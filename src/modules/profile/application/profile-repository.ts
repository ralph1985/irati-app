import { BabyProfile } from "../domain/baby-profile";

export type ProfileRepository = {
  getBabyProfile(): Promise<BabyProfile | null>;
};
