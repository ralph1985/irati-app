import { NewTravelChecklistItem, TravelChecklistItem } from "../domain/travel-checklist-item";

export type TravelChecklistRepository = {
  listTravelChecklistItems(): Promise<TravelChecklistItem[]>;
  createTravelChecklistItem(item: NewTravelChecklistItem): Promise<TravelChecklistItem>;
  updateTravelChecklistItem(id: string, item: NewTravelChecklistItem): Promise<TravelChecklistItem>;
  setTravelChecklistItemPacked(id: string, isPacked: boolean): Promise<TravelChecklistItem>;
  deleteTravelChecklistItem(id: string): Promise<void>;
  resetTravelChecklist(): Promise<void>;
};
