import {
  HeadCircumferenceEntry,
  HeightEntry,
  NewHeadCircumferenceEntry,
  NewHeightEntry,
} from "../domain/growth-entry";

export type GrowthRepository = {
  listHeightEntries(): Promise<HeightEntry[]>;
  createHeightEntry(entry: NewHeightEntry): Promise<HeightEntry>;
  updateHeightEntry(id: string, entry: NewHeightEntry): Promise<HeightEntry>;
  deleteHeightEntry(id: string): Promise<void>;
  listHeadCircumferenceEntries(): Promise<HeadCircumferenceEntry[]>;
  createHeadCircumferenceEntry(entry: NewHeadCircumferenceEntry): Promise<HeadCircumferenceEntry>;
  updateHeadCircumferenceEntry(
    id: string,
    entry: NewHeadCircumferenceEntry,
  ): Promise<HeadCircumferenceEntry>;
  deleteHeadCircumferenceEntry(id: string): Promise<void>;
};
