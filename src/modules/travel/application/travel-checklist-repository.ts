import {
  NewTravelChecklistItem,
  TravelChecklistCategoryDefinition,
  TravelChecklistItem,
  TravelStorageLocation,
} from "../domain/travel-checklist-item";

export type TravelChecklistRepository = {
  listTravelChecklistCategories(): Promise<TravelChecklistCategoryDefinition[]>;
  listTravelChecklistItems(): Promise<TravelChecklistItem[]>;
  listTravelStorageLocations(): Promise<TravelStorageLocation[]>;
  createTravelChecklistCategory(label: string): Promise<TravelChecklistCategoryDefinition>;
  updateTravelChecklistCategory(slug: string, label: string, sortOrder: number): Promise<void>;
  deleteTravelChecklistCategory(slug: string): Promise<void>;
  createTravelStorageLocation(
    location: Omit<TravelStorageLocation, "id">,
  ): Promise<TravelStorageLocation>;
  updateTravelStorageLocation(
    id: string,
    location: Omit<TravelStorageLocation, "id">,
  ): Promise<void>;
  deleteTravelStorageLocation(id: string): Promise<void>;
  createTravelChecklistItem(item: NewTravelChecklistItem): Promise<TravelChecklistItem>;
  updateTravelChecklistItem(id: string, item: NewTravelChecklistItem): Promise<TravelChecklistItem>;
  setTravelChecklistItemPacked(id: string, isPacked: boolean): Promise<TravelChecklistItem>;
  deleteTravelChecklistItem(id: string): Promise<void>;
  resetTravelChecklist(): Promise<void>;
};
