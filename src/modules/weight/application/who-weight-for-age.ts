export type WeightPercentile = "P3" | "P15" | "P50" | "P85" | "P97";

export type WeightForAgeReferencePoint = {
  ageDays: number;
  percentile: WeightPercentile;
  weightGrams: number;
};

type WeightForAgePercentiles = Record<WeightPercentile, number[]>;

const DAYS_PER_MONTH = 365.25 / 12;

// WHO Child Growth Standards, girls, weight-for-age, birth to 5 years.
// Source: official WHO percentile table `tab_wfa_girls_p_0_5.xlsx`.
// Values are kilograms at completed months; unlike an LMS reconstruction,
// these are the rounded percentiles shown in the WHO table itself.
const girlsWeightForAgePercentiles: WeightForAgePercentiles = {
  P3: "2.4 3.2 4 4.6 5.1 5.5 5.8 6.1 6.3 6.6 6.8 7 7.1 7.3 7.5 7.7 7.8 8 8.2 8.3 8.5 8.7 8.8 9 9.2 9.3 9.5 9.6 9.8 10 10.1 10.3 10.4 10.5 10.7 10.8 11 11.1 11.2 11.4 11.5 11.6 11.8 11.9 12 12.1 12.3 12.4 12.5 12.6 12.8 12.9 13 13.1 13.2 13.4 13.5 13.6 13.7 13.8 14"
    .split(" ")
    .map(Number),
  P15: "2.8 3.6 4.5 5.1 5.6 6.1 6.4 6.7 7 7.3 7.5 7.7 7.9 8.1 8.3 8.5 8.7 8.8 9 9.2 9.4 9.6 9.8 9.9 10.1 10.3 10.5 10.7 10.8 11 11.2 11.3 11.5 11.7 11.8 12 12.1 12.3 12.5 12.6 12.8 12.9 13.1 13.2 13.4 13.5 13.7 13.8 14 14.1 14.3 14.4 14.5 14.7 14.8 15 15.1 15.3 15.4 15.5 15.7"
    .split(" ")
    .map(Number),
  P50: "3.2 4.2 5.1 5.8 6.4 6.9 7.3 7.6 7.9 8.2 8.5 8.7 8.9 9.2 9.4 9.6 9.8 10 10.2 10.4 10.6 10.9 11.1 11.3 11.5 11.7 11.9 12.1 12.3 12.5 12.7 12.9 13.1 13.3 13.5 13.7 13.9 14 14.2 14.4 14.6 14.8 15 15.2 15.3 15.5 15.7 15.9 16.1 16.3 16.4 16.6 16.8 17 17.2 17.3 17.5 17.7 17.9 18 18.2"
    .split(" ")
    .map(Number),
  P85: "3.7 4.8 5.9 6.7 7.3 7.8 8.3 8.7 9 9.3 9.6 9.9 10.2 10.4 10.7 10.9 11.2 11.4 11.6 11.9 12.1 12.4 12.6 12.8 13.1 13.3 13.6 13.8 14 14.3 14.5 14.7 15 15.2 15.4 15.7 15.9 16.1 16.3 16.6 16.8 17 17.3 17.5 17.7 17.9 18.2 18.4 18.6 18.9 19.1 19.3 19.5 19.8 20 20.2 20.4 20.7 20.9 21.1 21.3"
    .split(" ")
    .map(Number),
  P97: "4.2 5.4 6.5 7.4 8.1 8.7 9.2 9.6 10 10.4 10.7 11 11.3 11.6 11.9 12.2 12.5 12.7 13 13.3 13.5 13.8 14.1 14.3 14.6 14.9 15.2 15.4 15.7 16 16.2 16.5 16.8 17 17.3 17.6 17.8 18.1 18.4 18.6 18.9 19.2 19.5 19.7 20 20.3 20.6 20.8 21.1 21.4 21.7 22 22.2 22.5 22.8 23.1 23.3 23.6 23.9 24.2 24.4"
    .split(" ")
    .map(Number),
};

export const weightPercentiles: WeightPercentile[] = ["P3", "P15", "P50", "P85", "P97"];

export function calculateAgeInDaysFromBirth(birthDate: string, measuredOn: string): number {
  const birthTime = parseUtcDate(birthDate).getTime();
  const measuredTime = parseUtcDate(measuredOn).getTime();

  return Math.max(0, Math.floor((measuredTime - birthTime) / 86_400_000));
}

export function calculateWhoWeightForAgeGrams(
  ageDays: number,
  percentile: WeightPercentile,
): number {
  const monthAge = Math.min(60, Math.max(0, ageDays / DAYS_PER_MONTH));
  const lowerMonth = Math.floor(monthAge);
  const upperMonth = Math.ceil(monthAge);
  const ratio = monthAge - lowerMonth;
  const percentileValues = girlsWeightForAgePercentiles[percentile];
  const weightKg = interpolate(
    percentileValues[lowerMonth],
    percentileValues[upperMonth] ?? percentileValues[lowerMonth],
    ratio,
  );

  return Math.round(weightKg * 1000);
}

export function buildWhoWeightForAgeReferences(maxAgeDays: number): WeightForAgeReferencePoint[] {
  const cappedMaxAgeDays = Math.min(Math.max(0, maxAgeDays), 60 * DAYS_PER_MONTH);
  const sampleStepDays = cappedMaxAgeDays <= 90 ? 7 : DAYS_PER_MONTH;
  const sampleAges = new Set<number>([0, Math.round(cappedMaxAgeDays)]);

  for (let ageDays = sampleStepDays; ageDays < cappedMaxAgeDays; ageDays += sampleStepDays) {
    sampleAges.add(Math.round(ageDays));
  }

  return weightPercentiles.flatMap((percentile) =>
    [...sampleAges]
      .sort((a, b) => a - b)
      .map((ageDays) => ({
        ageDays,
        percentile,
        weightGrams: calculateWhoWeightForAgeGrams(ageDays, percentile),
      })),
  );
}

function interpolate(start: number, end: number, ratio: number): number {
  return start + (end - start) * ratio;
}

function parseUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}
