import { WeightEntry } from "../domain/weight-entry";
import { WeightRepository } from "./weight-repository";

type WeightReadRepository = Pick<WeightRepository, "listWeightEntries">;

export async function listWeightEntries(repository: WeightReadRepository): Promise<WeightEntry[]> {
  return repository.listWeightEntries();
}
