import { TravelChecklistRepository } from "./travel-checklist-repository";

export async function resetTravelChecklist(
  repository: Pick<TravelChecklistRepository, "resetTravelChecklist">,
) {
  return repository.resetTravelChecklist();
}
