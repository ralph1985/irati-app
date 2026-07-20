export type WeightPercentile = "P3" | "P15" | "P50" | "P85" | "P97";

export type WeightForAgeReferencePoint = {
  ageDays: number;
  percentile: WeightPercentile;
  weightGrams: number;
};

type WeightForAgeLms = {
  month: number;
  l: number;
  m: number;
  s: number;
};

const DAYS_PER_MONTH = 365.25 / 12;

const percentileZScores: Record<WeightPercentile, number> = {
  P3: -1.8807936081512509,
  P15: -1.0364333894937898,
  P50: 0,
  P85: 1.0364333894937898,
  P97: 1.8807936081512509,
};

// WHO Child Growth Standards, girls, weight-for-age, birth to 5 years.
// Source: wfa_girls_0-to-5-years_zscores.xlsx, L/M/S parameters.
const girlsWeightForAgeLms: WeightForAgeLms[] = [
  { month: 0, l: 0.3809, m: 3.2322, s: 0.14171 },
  { month: 1, l: 0.1714, m: 4.1873, s: 0.13724 },
  { month: 2, l: 0.0962, m: 5.1282, s: 0.13 },
  { month: 3, l: 0.0402, m: 5.8458, s: 0.12619 },
  { month: 4, l: -0.005, m: 6.4237, s: 0.12402 },
  { month: 5, l: -0.043, m: 6.8985, s: 0.12274 },
  { month: 6, l: -0.0756, m: 7.297, s: 0.12204 },
  { month: 7, l: -0.1039, m: 7.6422, s: 0.12178 },
  { month: 8, l: -0.1288, m: 7.9487, s: 0.12181 },
  { month: 9, l: -0.1507, m: 8.2254, s: 0.12199 },
  { month: 10, l: -0.17, m: 8.48, s: 0.12223 },
  { month: 11, l: -0.1872, m: 8.7192, s: 0.12247 },
  { month: 12, l: -0.2024, m: 8.9481, s: 0.12268 },
  { month: 13, l: -0.2158, m: 9.1699, s: 0.12283 },
  { month: 14, l: -0.2278, m: 9.387, s: 0.12294 },
  { month: 15, l: -0.2384, m: 9.6008, s: 0.12299 },
  { month: 16, l: -0.2478, m: 9.8124, s: 0.12303 },
  { month: 17, l: -0.2562, m: 10.0226, s: 0.12306 },
  { month: 18, l: -0.2637, m: 10.2315, s: 0.12309 },
  { month: 19, l: -0.2703, m: 10.4393, s: 0.12315 },
  { month: 20, l: -0.2762, m: 10.6464, s: 0.12323 },
  { month: 21, l: -0.2815, m: 10.8534, s: 0.12335 },
  { month: 22, l: -0.2862, m: 11.0608, s: 0.1235 },
  { month: 23, l: -0.2903, m: 11.2688, s: 0.12369 },
  { month: 24, l: -0.2941, m: 11.4775, s: 0.1239 },
  { month: 25, l: -0.2975, m: 11.6864, s: 0.12414 },
  { month: 26, l: -0.3005, m: 11.8947, s: 0.12441 },
  { month: 27, l: -0.3032, m: 12.1015, s: 0.12472 },
  { month: 28, l: -0.3057, m: 12.3059, s: 0.12506 },
  { month: 29, l: -0.308, m: 12.5073, s: 0.12545 },
  { month: 30, l: -0.3101, m: 12.7055, s: 0.12587 },
  { month: 31, l: -0.312, m: 12.9006, s: 0.12633 },
  { month: 32, l: -0.3138, m: 13.093, s: 0.12683 },
  { month: 33, l: -0.3155, m: 13.2837, s: 0.12737 },
  { month: 34, l: -0.3171, m: 13.4731, s: 0.12794 },
  { month: 35, l: -0.3186, m: 13.6618, s: 0.12855 },
  { month: 36, l: -0.3201, m: 13.8503, s: 0.12919 },
  { month: 37, l: -0.3216, m: 14.0385, s: 0.12988 },
  { month: 38, l: -0.323, m: 14.2265, s: 0.13059 },
  { month: 39, l: -0.3243, m: 14.414, s: 0.13135 },
  { month: 40, l: -0.3257, m: 14.601, s: 0.13213 },
  { month: 41, l: -0.327, m: 14.7873, s: 0.13293 },
  { month: 42, l: -0.3283, m: 14.9727, s: 0.13376 },
  { month: 43, l: -0.3296, m: 15.1573, s: 0.1346 },
  { month: 44, l: -0.3309, m: 15.341, s: 0.13545 },
  { month: 45, l: -0.3322, m: 15.524, s: 0.1363 },
  { month: 46, l: -0.3335, m: 15.7064, s: 0.13716 },
  { month: 47, l: -0.3348, m: 15.8882, s: 0.138 },
  { month: 48, l: -0.3361, m: 16.0697, s: 0.13884 },
  { month: 49, l: -0.3374, m: 16.2511, s: 0.13968 },
  { month: 50, l: -0.3387, m: 16.4322, s: 0.14051 },
  { month: 51, l: -0.34, m: 16.6133, s: 0.14132 },
  { month: 52, l: -0.3414, m: 16.7942, s: 0.14213 },
  { month: 53, l: -0.3427, m: 16.9748, s: 0.14293 },
  { month: 54, l: -0.344, m: 17.1551, s: 0.14371 },
  { month: 55, l: -0.3453, m: 17.3347, s: 0.14448 },
  { month: 56, l: -0.3466, m: 17.5136, s: 0.14525 },
  { month: 57, l: -0.3479, m: 17.6916, s: 0.146 },
  { month: 58, l: -0.3492, m: 17.8686, s: 0.14675 },
  { month: 59, l: -0.3505, m: 18.0445, s: 0.14748 },
  { month: 60, l: -0.3518, m: 18.2193, s: 0.14821 },
];

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
  const lower = girlsWeightForAgeLms[Math.floor(monthAge)];
  const upper = girlsWeightForAgeLms[Math.ceil(monthAge)] ?? lower;
  const ratio = monthAge - lower.month;
  const lms = {
    l: interpolate(lower.l, upper.l, ratio),
    m: interpolate(lower.m, upper.m, ratio),
    s: interpolate(lower.s, upper.s, ratio),
  };
  const zScore = percentileZScores[percentile];
  const weightKg =
    lms.l === 0
      ? lms.m * Math.exp(lms.s * zScore)
      : lms.m * Math.pow(1 + lms.l * lms.s * zScore, 1 / lms.l);

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
