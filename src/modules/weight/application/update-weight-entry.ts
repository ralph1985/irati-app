import { createWeightEntry, NewWeightEntry, WeightEntry } from "../domain/weight-entry";
import { WeightRepository } from "./weight-repository";

export async function updateWeightEntry(
  repository: WeightRepository,
  id: string,
  input: NewWeightEntry,
): Promise<WeightEntry> {
  if (!id) {
    throw new Error("Missing weight entry id");
  }

  return repository.updateWeightEntry(id, createWeightEntry(input));
}
