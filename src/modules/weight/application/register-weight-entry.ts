import { createWeightEntry, NewWeightEntry, WeightEntry } from "../domain/weight-entry";
import { WeightRepository } from "./weight-repository";

export async function registerWeightEntry(
  repository: WeightRepository,
  input: NewWeightEntry,
): Promise<WeightEntry> {
  return repository.createWeightEntry(createWeightEntry(input));
}
