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

// WHO Reference 2007, girls, weight-for-age, 61 to 120 months.
// Source: official WHO percentile table `hfa-girls-perc-who2007-exp.xlsx`.
const girlsWeightForAgePercentiles5To10: WeightForAgePercentiles = {
  P3: "13.404 13.519 13.634 13.748 13.862 13.975 14.088 14.2 14.312 14.424 14.536 14.648 14.76 14.873 14.986 15.101 15.216 15.333 15.452 15.572 15.694 15.818 15.944 16.072 16.202 16.335 16.47 16.607 16.746 16.887 17.031 17.177 17.326 17.476 17.63 17.786 17.944 18.105 18.269 18.435 18.604 18.775 18.948 19.124 19.302 19.481 19.663 19.847 20.033 20.221 20.411 20.602 20.797 20.993 21.191 21.392 21.597 21.803 22.013 22.226"
    .split(" ")
    .map(Number),
  P15: "14.607 14.736 14.865 14.993 15.12 15.247 15.373 15.5 15.625 15.751 15.877 16.002 16.129 16.255 16.383 16.511 16.641 16.773 16.906 17.041 17.178 17.317 17.459 17.603 17.75 17.899 18.05 18.204 18.36 18.519 18.68 18.844 19.011 19.18 19.353 19.528 19.706 19.886 20.07 20.256 20.446 20.638 20.832 21.029 21.228 21.43 21.634 21.841 22.049 22.259 22.473 22.687 22.905 23.125 23.348 23.573 23.802 24.033 24.269 24.507"
    .split(" ")
    .map(Number),
  P50: "18.258 18.433 18.607 18.781 18.954 19.128 19.3 19.473 19.646 19.818 19.991 20.164 20.338 20.512 20.688 20.866 21.046 21.227 21.411 21.598 21.787 21.98 22.175 22.374 22.576 22.782 22.99 23.202 23.418 23.637 23.859 24.085 24.315 24.548 24.785 25.026 25.271 25.52 25.772 26.028 26.288 26.552 26.819 27.09 27.364 27.641 27.921 28.204 28.49 28.779 29.071 29.366 29.665 29.966 30.272 30.58 30.893 31.21 31.532 31.858"
    .split(" ")
    .map(Number),
  P85: "21.288 21.506 21.723 21.941 22.158 22.375 22.591 22.808 23.026 23.243 23.461 23.68 23.9 24.121 24.344 24.569 24.797 25.028 25.261 25.498 25.738 25.982 26.231 26.483 26.74 27 27.265 27.535 27.808 28.086 28.368 28.655 28.946 29.242 29.543 29.849 30.159 30.474 30.794 31.119 31.448 31.782 32.121 32.463 32.81 33.161 33.516 33.874 34.237 34.603 34.972 35.346 35.723 36.104 36.49 36.881 37.275 37.676 38.081 38.493"
    .split(" ")
    .map(Number),
  P97: "24.336 24.601 24.866 25.132 25.398 25.664 25.93 26.197 26.465 26.733 27.002 27.273 27.545 27.819 28.095 28.375 28.658 28.945 29.234 29.529 29.828 30.132 30.441 30.755 31.075 31.399 31.73 32.065 32.406 32.752 33.103 33.46 33.823 34.192 34.567 34.947 35.334 35.727 36.126 36.53 36.94 37.355 37.778 38.204 38.636 39.073 39.514 39.96 40.411 40.867 41.326 41.791 42.26 42.734 43.214 43.699 44.189 44.687 45.19 45.7"
    .split(" ")
    .map(Number),
};

export const weightPercentiles: WeightPercentile[] = ["P3", "P15", "P50", "P85", "P97"];

const allGirlsWeightForAgePercentiles: WeightForAgePercentiles = Object.fromEntries(
  weightPercentiles.map((percentile) => [
    percentile,
    [...girlsWeightForAgePercentiles[percentile], ...girlsWeightForAgePercentiles5To10[percentile]],
  ]),
) as WeightForAgePercentiles;

export function calculateAgeInDaysFromBirth(birthDate: string, measuredOn: string): number {
  const birthTime = parseUtcDate(birthDate).getTime();
  const measuredTime = parseUtcDate(measuredOn).getTime();

  return Math.max(0, Math.floor((measuredTime - birthTime) / 86_400_000));
}

export function calculateWhoWeightForAgeGrams(
  ageDays: number,
  percentile: WeightPercentile,
): number {
  const monthAge = Math.min(120, Math.max(0, ageDays / DAYS_PER_MONTH));
  const lowerMonth = Math.floor(monthAge);
  const upperMonth = Math.ceil(monthAge);
  const ratio = monthAge - lowerMonth;
  const percentileValues = allGirlsWeightForAgePercentiles[percentile];
  const weightKg = interpolate(
    percentileValues[lowerMonth],
    percentileValues[upperMonth] ?? percentileValues[lowerMonth],
    ratio,
  );

  return Math.round(weightKg * 1000);
}

export function buildWhoWeightForAgeReferences(maxAgeDays: number): WeightForAgeReferencePoint[] {
  const cappedMaxAgeDays = Math.min(Math.max(0, maxAgeDays), 120 * DAYS_PER_MONTH);
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
