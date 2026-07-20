import { WeightEntry } from "../domain/weight-entry";
import {
  buildWhoWeightForAgeReferences,
  calculateAgeInDaysFromBirth,
  WeightPercentile,
} from "./who-weight-for-age";

export type WeightChartPoint = {
  ageDays: number;
  date: string;
  dateLabel: string;
  place: WeightEntry["place"];
  x: number;
  y: number;
  weightGrams: number;
  weightLabel: string;
};

export type WeightChartReferencePoint = {
  ageDays: number;
  x: number;
  y: number;
  weightGrams: number;
};

export type WeightChartReferenceCurve = {
  label: WeightPercentile;
  points: WeightChartReferencePoint[];
};

export type WeightChartTick = {
  label: string;
  value: number;
  y: number;
};

export type WeightChartSeries = {
  chartHeight: number;
  chartWidth: number;
  maxDisplayWeight: number;
  points: WeightChartPoint[];
  minDisplayWeight: number;
  minWeight: number;
  maxWeight: number;
  referenceCurves: WeightChartReferenceCurve[];
  ticks: WeightChartTick[];
};

const WIDTH = 320;
const HEIGHT = 360;
const PADDING = {
  bottom: 34,
  left: 42,
  right: 16,
  top: 24,
};

export function buildWeightChartSeries(
  entries: WeightEntry[],
  birthDate: string,
): WeightChartSeries {
  const sortedEntries = [...entries].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));

  if (sortedEntries.length === 0) {
    return {
      chartHeight: HEIGHT,
      chartWidth: WIDTH,
      maxDisplayWeight: 0,
      points: [],
      minDisplayWeight: 0,
      minWeight: 0,
      maxWeight: 0,
      referenceCurves: [],
      ticks: [],
    };
  }

  const entryAges = sortedEntries.map((entry) =>
    calculateAgeInDaysFromBirth(birthDate, entry.measuredOn),
  );
  const maxAgeDays = Math.max(1, ...entryAges);
  const referencePoints = buildWhoWeightForAgeReferences(maxAgeDays);
  const weights = sortedEntries.map((entry) => entry.weightGrams);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const referenceWeights = referencePoints.map((point) => point.weightGrams);
  const displayRange = buildDisplayWeightRange(
    Math.min(minWeight, ...referenceWeights),
    Math.max(maxWeight, ...referenceWeights),
  );

  return {
    chartHeight: HEIGHT,
    chartWidth: WIDTH,
    maxDisplayWeight: displayRange.max,
    minDisplayWeight: displayRange.min,
    minWeight,
    maxWeight,
    referenceCurves: buildReferenceCurves(referencePoints, maxAgeDays, displayRange),
    ticks: buildWeightTicks(displayRange.min, displayRange.max),
    points: sortedEntries.map((entry, index) => ({
      ageDays: entryAges[index],
      date: entry.measuredOn,
      dateLabel: formatChartDate(entry.measuredOn),
      place: entry.place,
      weightGrams: entry.weightGrams,
      weightLabel: formatWeight(entry.weightGrams),
      x: getAgeX(entryAges[index], maxAgeDays),
      y: getWeightY(entry.weightGrams, displayRange.min, displayRange.max),
    })),
  };
}

export function buildWeightChartPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) {
    return "";
  }

  return points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      }

      const previousPoint = points[index - 1];
      const controlDistance = (point.x - previousPoint.x) / 2;

      return [
        "C",
        (previousPoint.x + controlDistance).toFixed(1),
        previousPoint.y.toFixed(1),
        (point.x - controlDistance).toFixed(1),
        point.y.toFixed(1),
        point.x.toFixed(1),
        point.y.toFixed(1),
      ].join(" ");
    })
    .join(" ");
}

export function buildWeightChartAreaPath(points: Array<{ x: number; y: number }>): string {
  const linePath = buildWeightChartPath(points);

  if (points.length < 2 || !linePath) {
    return "";
  }

  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (!lastPoint) {
    return "";
  }

  const baselineY = HEIGHT - PADDING.bottom;

  return `${linePath} L ${lastPoint.x.toFixed(1)} ${baselineY} L ${firstPoint.x.toFixed(1)} ${baselineY} Z`;
}

function buildDisplayWeightRange(
  minWeight: number,
  maxWeight: number,
): { min: number; max: number } {
  const rawRange = Math.max(200, maxWeight - minWeight);
  const margin = Math.max(100, rawRange * 0.18);
  const min = Math.max(0, Math.floor((minWeight - margin) / 100) * 100);
  const max = Math.ceil((maxWeight + margin) / 100) * 100;

  if (min === max) {
    return {
      min: Math.max(0, min - 100),
      max: max + 100,
    };
  }

  return { min, max };
}

function buildWeightTicks(minWeight: number, maxWeight: number): WeightChartTick[] {
  const middleWeight = Math.round((minWeight + maxWeight) / 2 / 100) * 100;
  const values = [maxWeight, middleWeight, minWeight];

  return values.map((value) => ({
    label: formatWeight(value),
    value,
    y: getWeightY(value, minWeight, maxWeight),
  }));
}

function buildReferenceCurves(
  referencePoints: ReturnType<typeof buildWhoWeightForAgeReferences>,
  maxAgeDays: number,
  displayRange: { min: number; max: number },
): WeightChartReferenceCurve[] {
  const groupedPoints = new Map<WeightPercentile, WeightChartReferencePoint[]>();

  for (const point of referencePoints) {
    const points = groupedPoints.get(point.percentile) ?? [];
    points.push({
      ageDays: point.ageDays,
      weightGrams: point.weightGrams,
      x: getAgeX(point.ageDays, maxAgeDays),
      y: getWeightY(point.weightGrams, displayRange.min, displayRange.max),
    });
    groupedPoints.set(point.percentile, points);
  }

  return [...groupedPoints.entries()].map(([label, points]) => ({
    label,
    points,
  }));
}

function getAgeX(ageDays: number, maxAgeDays: number): number {
  return PADDING.left + ((WIDTH - PADDING.left - PADDING.right) * ageDays) / maxAgeDays;
}

function getWeightY(weightGrams: number, minWeight: number, maxWeight: number): number {
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const weightRange = Math.max(1, maxWeight - minWeight);

  return HEIGHT - PADDING.bottom - (chartHeight * (weightGrams - minWeight)) / weightRange;
}

function formatChartDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatWeight(weightGrams: number): string {
  return `${(weightGrams / 1000).toLocaleString("es-ES", {
    maximumFractionDigits: 2,
    minimumFractionDigits: weightGrams % 1000 === 0 ? 0 : 1,
  })} kg`;
}
