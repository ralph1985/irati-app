import { isWeightPlace, WeightEntry, WeightPlace, weightPlaces } from "../domain/weight-entry";

export const weightFilterValues = ["all", ...weightPlaces] as const;

export type WeightFilter = (typeof weightFilterValues)[number];

export function getWeightPlaceFilters(value: string | string[] | undefined): WeightPlace[] {
  const values = value === undefined ? [] : Array.isArray(value) ? value : [value];
  return [...new Set(values.filter(isWeightPlace))];
}

export function toggleWeightPlaceFilter(filters: WeightPlace[], place: WeightPlace): WeightPlace[] {
  return filters.includes(place)
    ? filters.filter((filter) => filter !== place)
    : [...filters, place];
}

export function filterWeightEntries(entries: WeightEntry[], filters: WeightPlace[]): WeightEntry[] {
  if (filters.length === 0) {
    return entries;
  }

  return entries.filter((entry) => filters.includes(entry.place));
}

export function formatWeightFiltersLabel(filters: WeightPlace[]): string {
  return filters.length === 0 ? "Todos" : filters.map(formatWeightFilterLabel).join(" + ");
}

export function weightFilterHref(filters: WeightPlace[]): string {
  const params = new URLSearchParams();
  filters.forEach((place) => params.append("lugar", place));
  const query = params.toString();
  return query ? `/peso?${query}` : "/peso";
}

export function formatWeightFilterLabel(filter: WeightFilter): string {
  const labels: Record<WeightFilter, string> = {
    all: "Todos",
    hospital: "Hospital",
    pediatra: "Pediatra",
    farmacia: "Farmacia",
    enfermeria: "Enfermería",
  };

  return labels[filter];
}

export function getWeightPlaceLabel(place: WeightPlace): string {
  return formatWeightFilterLabel(place);
}
