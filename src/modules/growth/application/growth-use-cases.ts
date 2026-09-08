import {
  createHeadCircumferenceEntry,
  createHeightEntry,
  HeadCircumferenceEntry,
  HeightEntry,
  NewHeadCircumferenceEntry,
  NewHeightEntry,
} from "../domain/growth-entry";
import { GrowthRepository } from "./growth-repository";

export async function registerHeightEntry(
  repository: GrowthRepository,
  input: NewHeightEntry,
): Promise<HeightEntry> {
  return repository.createHeightEntry(createHeightEntry(input));
}

export async function updateHeightEntry(
  repository: GrowthRepository,
  id: string,
  input: NewHeightEntry,
): Promise<HeightEntry> {
  if (!id) throw new Error("Missing height entry id");
  return repository.updateHeightEntry(id, createHeightEntry(input));
}

export async function deleteHeightEntry(repository: GrowthRepository, id: string): Promise<void> {
  if (!id) throw new Error("Missing height entry id");
  return repository.deleteHeightEntry(id);
}

export async function registerHeadCircumferenceEntry(
  repository: GrowthRepository,
  input: NewHeadCircumferenceEntry,
): Promise<HeadCircumferenceEntry> {
  return repository.createHeadCircumferenceEntry(createHeadCircumferenceEntry(input));
}

export async function updateHeadCircumferenceEntry(
  repository: GrowthRepository,
  id: string,
  input: NewHeadCircumferenceEntry,
): Promise<HeadCircumferenceEntry> {
  if (!id) throw new Error("Missing head circumference entry id");
  return repository.updateHeadCircumferenceEntry(id, createHeadCircumferenceEntry(input));
}

export async function deleteHeadCircumferenceEntry(
  repository: GrowthRepository,
  id: string,
): Promise<void> {
  if (!id) throw new Error("Missing head circumference entry id");
  return repository.deleteHeadCircumferenceEntry(id);
}
