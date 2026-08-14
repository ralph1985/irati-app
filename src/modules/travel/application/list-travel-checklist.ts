import {
  calculateTravelChecklistProgress,
  groupTravelChecklistItems,
  TravelChecklistGroup,
  TravelChecklistProgress,
} from "../domain/travel-checklist-item";
import { TravelChecklistRepository } from "./travel-checklist-repository";

export type TravelChecklist = {
  categories: import("../domain/travel-checklist-item").TravelChecklistCategoryDefinition[];
  groups: TravelChecklistGroup[];
  progress: TravelChecklistProgress;
};

export async function listTravelChecklist(
  repository: Pick<
    TravelChecklistRepository,
    "listTravelChecklistCategories" | "listTravelChecklistItems"
  >,
): Promise<TravelChecklist> {
  const [categories, items] = await Promise.all([
    repository.listTravelChecklistCategories(),
    repository.listTravelChecklistItems(),
  ]);

  return {
    categories,
    groups: groupTravelChecklistItems(items, categories),
    progress: calculateTravelChecklistProgress(items),
  };
}
