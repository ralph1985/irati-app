import { HeadCircumferenceEntry, HeightEntry } from "../domain/growth-entry";
import {
  buildWhoGrowthReferences,
  calculateAgeInDaysFromBirth,
  type GrowthPercentile,
} from "./who-growth-references";

export type GrowthMetric = "height" | "headCircumference";
export type GrowthChartRange = "current" | "twoYears" | "fourYears";
export type GrowthEntry = HeightEntry | HeadCircumferenceEntry;

export type GrowthChartPoint = {
  ageDays: number;
  date: string;
  dateLabel: string;
  place: GrowthEntry["place"];
  valueCm: number;
  valueLabel: string;
  x: number;
  y: number;
};

export type GrowthChartReferenceCurve = {
  label: GrowthPercentile;
  points: Array<{ ageDays: number; valueCm: number; x: number; y: number }>;
};

export type GrowthChartSeries = {
  chartHeight: number;
  chartWidth: number;
  maxDisplayValue: number;
  minDisplayValue: number;
  minValue: number;
  maxValue: number;
  points: GrowthChartPoint[];
  referenceCurves: GrowthChartReferenceCurve[];
  ticks: Array<{ label: string; value: number; y: number }>;
};

const WIDTH = 320;
const HEIGHT = 360;
const PADDING = { bottom: 34, left: 42, right: 16, top: 24 };
const DAYS_PER_MONTH = 365.25 / 12;

export function buildGrowthChartSeries(
  entries: GrowthEntry[],
  birthDate: string,
  metric: GrowthMetric,
  range: GrowthChartRange = "current",
): GrowthChartSeries {
  const sortedEntries = [...entries].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));

  if (sortedEntries.length === 0) {
    return {
      chartHeight: HEIGHT,
      chartWidth: WIDTH,
      maxDisplayValue: 0,
      minDisplayValue: 0,
      minValue: 0,
      maxValue: 0,
      points: [],
      referenceCurves: [],
      ticks: [],
    };
  }

  const values = sortedEntries.map((entry) => getEntryValue(entry, metric));
  const entryAges = sortedEntries.map((entry) =>
    calculateAgeInDaysFromBirth(birthDate, entry.measuredOn),
  );
  const latestAgeDays = Math.max(1, ...entryAges);
  const maxAgeDays =
    range === "twoYears"
      ? 24 * DAYS_PER_MONTH
      : range === "fourYears"
        ? 48 * DAYS_PER_MONTH
        : Math.min(latestAgeDays, 60 * DAYS_PER_MONTH);
  const referencePoints = buildWhoGrowthReferences(metric, maxAgeDays);
  const displayRange = buildDisplayRange(
    Math.min(...values, ...referencePoints.map((p) => p.valueCm)),
    Math.max(...values, ...referencePoints.map((p) => p.valueCm)),
  );

  return {
    chartHeight: HEIGHT,
    chartWidth: WIDTH,
    maxDisplayValue: displayRange.max,
    minDisplayValue: displayRange.min,
    minValue: Math.min(...values),
    maxValue: Math.max(...values),
    points: sortedEntries.map((entry, index) => ({
      ageDays: entryAges[index],
      date: entry.measuredOn,
      dateLabel: formatChartDate(entry.measuredOn),
      place: entry.place,
      valueCm: values[index],
      valueLabel: formatValue(values[index]),
      x: getAgeX(entryAges[index], maxAgeDays),
      y: getValueY(values[index], displayRange.min, displayRange.max),
    })),
    referenceCurves: buildReferenceCurves(referencePoints, maxAgeDays, displayRange),
    ticks: buildTicks(displayRange.min, displayRange.max),
  };
}

export function buildGrowthChartPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}

export function buildGrowthChartAreaPath(points: Array<{ x: number; y: number }>): string {
  const linePath = buildGrowthChartPath(points);
  if (points.length < 2 || !linePath) return "";

  const firstPoint = points[0];
  const lastPoint = points.at(-1);
  if (!lastPoint) return "";

  const baselineY = HEIGHT - PADDING.bottom;
  return `${linePath} L ${lastPoint.x.toFixed(1)} ${baselineY} L ${firstPoint.x.toFixed(1)} ${baselineY} Z`;
}

function getEntryValue(entry: GrowthEntry, metric: GrowthMetric): number {
  return metric === "height"
    ? (entry as HeightEntry).heightCm
    : (entry as HeadCircumferenceEntry).headCircumferenceCm;
}

function buildReferenceCurves(
  references: ReturnType<typeof buildWhoGrowthReferences>,
  maxAgeDays: number,
  displayRange: { min: number; max: number },
): GrowthChartReferenceCurve[] {
  const grouped = new Map<GrowthPercentile, GrowthChartReferenceCurve["points"]>();

  for (const point of references) {
    const points = grouped.get(point.percentile) ?? [];
    points.push({
      ageDays: point.ageDays,
      valueCm: point.valueCm,
      x: getAgeX(point.ageDays, maxAgeDays),
      y: getValueY(point.valueCm, displayRange.min, displayRange.max),
    });
    grouped.set(point.percentile, points);
  }

  return [...grouped.entries()].map(([label, points]) => ({ label, points }));
}

function buildDisplayRange(minValue: number, maxValue: number): { min: number; max: number } {
  const rawRange = Math.max(2, maxValue - minValue);
  const margin = Math.max(1, rawRange * 0.18);
  const min = Math.max(0, Math.floor((minValue - margin) * 2) / 2);
  const max = Math.ceil((maxValue + margin) * 2) / 2;
  return min === max ? { min: Math.max(0, min - 1), max: max + 1 } : { min, max };
}

function buildTicks(minValue: number, maxValue: number) {
  const middleValue = Math.round(((minValue + maxValue) / 2) * 2) / 2;
  return [maxValue, middleValue, minValue].map((value) => ({
    label: formatValue(value),
    value,
    y: getValueY(value, minValue, maxValue),
  }));
}

function getAgeX(ageDays: number, maxAgeDays: number): number {
  return PADDING.left + ((WIDTH - PADDING.left - PADDING.right) * ageDays) / maxAgeDays;
}

function getValueY(value: number, minValue: number, maxValue: number): number {
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const valueRange = Math.max(1, maxValue - minValue);
  return HEIGHT - PADDING.bottom - (chartHeight * (value - minValue)) / valueRange;
}

function formatChartDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

function formatValue(value: number): string {
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 1 })} cm`;
}
