import { WeightEntry } from "../domain/weight-entry";

export type WeightChartPoint = {
  date: string;
  x: number;
  y: number;
  weightGrams: number;
};

export type WeightChartSeries = {
  points: WeightChartPoint[];
  minWeight: number;
  maxWeight: number;
};

const WIDTH = 320;
const HEIGHT = 180;
const PADDING = 24;

export function buildWeightChartSeries(entries: WeightEntry[]): WeightChartSeries {
  const sortedEntries = [...entries].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));

  if (sortedEntries.length === 0) {
    return {
      points: [],
      minWeight: 0,
      maxWeight: 0,
    };
  }

  const weights = sortedEntries.map((entry) => entry.weightGrams);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = Math.max(1, maxWeight - minWeight);
  const xRange = Math.max(1, sortedEntries.length - 1);

  return {
    minWeight,
    maxWeight,
    points: sortedEntries.map((entry, index) => ({
      date: entry.measuredOn,
      weightGrams: entry.weightGrams,
      x: PADDING + ((WIDTH - PADDING * 2) * index) / xRange,
      y:
        HEIGHT - PADDING - ((HEIGHT - PADDING * 2) * (entry.weightGrams - minWeight)) / weightRange,
    })),
  };
}

export function buildWeightChartPath(points: WeightChartPoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}
