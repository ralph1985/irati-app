import { TravelPackingStatus } from "../domain/travel-checklist-item";
import { TravelChecklistRepository } from "./travel-checklist-repository";

export async function setTravelChecklistItemPackingStatus(
  repository: Pick<TravelChecklistRepository, "setTravelChecklistItemPackingStatus">,
  id: string,
  packingStatus: TravelPackingStatus,
) {
  return repository.setTravelChecklistItemPackingStatus(id, packingStatus);
}
