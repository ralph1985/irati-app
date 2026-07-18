import { TravelChecklistRepository } from "./travel-checklist-repository";

export async function setTravelChecklistItemPacked(
  repository: Pick<TravelChecklistRepository, "setTravelChecklistItemPacked">,
  id: string,
  isPacked: boolean,
) {
  return repository.setTravelChecklistItemPacked(id, isPacked);
}
