import { WeightRepository } from "./weight-repository";

export async function deleteWeightEntry(repository: WeightRepository, id: string): Promise<void> {
  if (!id) {
    throw new Error("Missing weight entry id");
  }

  await repository.deleteWeightEntry(id);
}
