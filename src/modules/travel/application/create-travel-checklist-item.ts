import {
  createTravelChecklistItem as createTravelChecklistItemEntity,
  NewTravelChecklistItem,
} from "../domain/travel-checklist-item";
import { TravelChecklistRepository } from "./travel-checklist-repository";

export async function createTravelChecklistItem(
  repository: Pick<TravelChecklistRepository, "createTravelChecklistItem">,
  item: NewTravelChecklistItem,
) {
  return repository.createTravelChecklistItem(createTravelChecklistItemEntity(item));
}
