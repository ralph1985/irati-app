import { WeightEntry } from "../domain/weight-entry";

export type WeightChartPoint = {
  date: string;
  dateLabel: string;
  place: WeightEntry["place"];
  x: number;
  y: number;
  weightGrams: number;
  weightLabel: string;
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
  ticks: WeightChartTick[];
};

const WIDTH = 320;
const HEIGHT = 180;
const PADDING = {
  bottom: 28,
  left: 42,
  right: 16,
  top: 18,
};

export function buildWeightChartSeries(entries: WeightEntry[]): WeightChartSeries {
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
      ticks: [],
    };
  }

  const weights = sortedEntries.map((entry) => entry.weightGrams);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const displayRange = buildDisplayWeightRange(minWeight, maxWeight);
  const firstDateTime = parseChartDate(sortedEntries[0].measuredOn);
  const lastDateTime = parseChartDate(
    sortedEntries.at(-1)?.measuredOn ?? sortedEntries[0].measuredOn,
  );
  const timeRange = Math.max(1, lastDateTime - firstDateTime);

  return {
    chartHeight: HEIGHT,
    chartWidth: WIDTH,
    maxDisplayWeight: displayRange.max,
    minDisplayWeight: displayRange.min,
    minWeight,
    maxWeight,
    ticks: buildWeightTicks(displayRange.min, displayRange.max),
    points: sortedEntries.map((entry) => ({
      date: entry.measuredOn,
      dateLabel: formatChartDate(entry.measuredOn),
      place: entry.place,
      weightGrams: entry.weightGrams,
      weightLabel: formatWeight(entry.weightGrams),
      x:
        sortedEntries.length === 1
          ? (PADDING.left + WIDTH - PADDING.right) / 2
          : PADDING.left +
            ((WIDTH - PADDING.left - PADDING.right) *
              (parseChartDate(entry.measuredOn) - firstDateTime)) /
              timeRange,
      y: getWeightY(entry.weightGrams, displayRange.min, displayRange.max),
    })),
  };
}

export function buildWeightChartPath(points: WeightChartPoint[]): string {
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

export function buildWeightChartAreaPath(points: WeightChartPoint[]): string {
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

function getWeightY(weightGrams: number, minWeight: number, maxWeight: number): number {
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const weightRange = Math.max(1, maxWeight - minWeight);

  return HEIGHT - PADDING.bottom - (chartHeight * (weightGrams - minWeight)) / weightRange;
}

function parseChartDate(value: string): number {
  return new Date(`${value}T00:00:00.000Z`).getTime();
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
