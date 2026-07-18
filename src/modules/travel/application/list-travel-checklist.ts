import {
  calculateTravelChecklistProgress,
  groupTravelChecklistItems,
  TravelChecklistGroup,
  TravelChecklistProgress,
} from "../domain/travel-checklist-item";
import { TravelChecklistRepository } from "./travel-checklist-repository";

export type TravelChecklist = {
  groups: TravelChecklistGroup[];
  progress: TravelChecklistProgress;
};

export async function listTravelChecklist(
  repository: Pick<TravelChecklistRepository, "listTravelChecklistItems">,
): Promise<TravelChecklist> {
  const items = await repository.listTravelChecklistItems();

  return {
    groups: groupTravelChecklistItems(items),
    progress: calculateTravelChecklistProgress(items),
  };
}
