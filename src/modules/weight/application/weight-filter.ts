import { WeightEntry, WeightPlace, weightPlaces } from "../domain/weight-entry";

export const weightFilterValues = ["all", ...weightPlaces] as const;

export type WeightFilter = (typeof weightFilterValues)[number];

export function isWeightFilter(value: string | undefined): value is WeightFilter {
  return Boolean(value && weightFilterValues.includes(value as WeightFilter));
}

export function filterWeightEntries(entries: WeightEntry[], filter: WeightFilter): WeightEntry[] {
  if (filter === "all") {
    return entries;
  }

  return entries.filter((entry) => entry.place === filter);
}

export function formatWeightFilterLabel(filter: WeightFilter): string {
  const labels: Record<WeightFilter, string> = {
    all: "Todos",
    hospital: "Hospital",
    pediatra: "Pediatra",
    farmacia: "Farmacia",
  };

  return labels[filter];
}

export function getWeightPlaceLabel(place: WeightPlace): string {
  return formatWeightFilterLabel(place);
}
