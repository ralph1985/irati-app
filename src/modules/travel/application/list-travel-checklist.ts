import {
  calculateTravelChecklistProgress,
  groupTravelChecklistItems,
  groupTravelChecklistItemsByLocation,
  TravelChecklistGroup,
  TravelChecklistProgress,
} from "../domain/travel-checklist-item";
import { TravelChecklistRepository } from "./travel-checklist-repository";

export type TravelChecklist = {
  categories: import("../domain/travel-checklist-item").TravelChecklistCategoryDefinition[];
  locations?: import("../domain/travel-checklist-item").TravelStorageLocation[];
  groups: TravelChecklistGroup[];
  locationGroups?: import("../domain/travel-checklist-item").TravelStorageLocationGroup[];
  progress: TravelChecklistProgress;
};

export async function listTravelChecklist(
  repository: Pick<
    TravelChecklistRepository,
    "listTravelChecklistCategories" | "listTravelChecklistItems" | "listTravelStorageLocations"
  >,
): Promise<TravelChecklist> {
  const [categories, items, locations] = await Promise.all([
    repository.listTravelChecklistCategories(),
    repository.listTravelChecklistItems(),
    repository.listTravelStorageLocations(),
  ]);

  return {
    categories,
    locations,
    groups: groupTravelChecklistItems(items, categories),
    locationGroups: groupTravelChecklistItemsByLocation(items, locations),
    progress: calculateTravelChecklistProgress(items),
  };
}
