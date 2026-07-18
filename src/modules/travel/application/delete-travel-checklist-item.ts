import { TravelChecklistRepository } from "./travel-checklist-repository";

export async function deleteTravelChecklistItem(
  repository: Pick<TravelChecklistRepository, "deleteTravelChecklistItem">,
  id: string,
) {
  return repository.deleteTravelChecklistItem(id);
}
