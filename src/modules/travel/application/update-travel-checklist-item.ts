import {
  NewTravelChecklistItem,
  updateTravelChecklistItemInput,
} from "../domain/travel-checklist-item";
import { TravelChecklistRepository } from "./travel-checklist-repository";

export async function updateTravelChecklistItem(
  repository: Pick<TravelChecklistRepository, "updateTravelChecklistItem">,
  id: string,
  item: NewTravelChecklistItem,
) {
  return repository.updateTravelChecklistItem(id, updateTravelChecklistItemInput(item));
}
