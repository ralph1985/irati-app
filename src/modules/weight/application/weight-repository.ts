import { NewWeightEntry, WeightEntry } from "../domain/weight-entry";

export type WeightRepository = {
  listWeightEntries(): Promise<WeightEntry[]>;
  createWeightEntry(entry: NewWeightEntry): Promise<WeightEntry>;
  updateWeightEntry(id: string, entry: NewWeightEntry): Promise<WeightEntry>;
  deleteWeightEntry(id: string): Promise<void>;
};
