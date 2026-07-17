import { WeightEntry } from "../domain/weight-entry";
import { WeightRepository } from "./weight-repository";

export async function listWeightEntries(repository: WeightRepository): Promise<WeightEntry[]> {
  return repository.listWeightEntries();
}
