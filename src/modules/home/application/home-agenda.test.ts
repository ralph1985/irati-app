import { describe, expect, it } from "vitest";
import { buildHomeAgenda } from "./home-agenda";
import { PlannedVaccineDoseWithStatus } from "@/modules/vaccines/domain/vaccine-calendar";
import { WeightTrendSummary } from "@/modules/weight/application/weight-trend-summary";

const today = new Date("2026-07-20T00:00:00.000Z");

describe("buildHomeAgenda", () => {
  it("includes overdue vaccines first", () => {
    const agenda = buildHomeAgenda({
      today,
      vaccineDoses: [
        dose({ id: "future", plannedDate: "2026-08-01", status: "proxima" }),
        dose({ id: "late", plannedDate: "2026-07-10", status: "retrasada" }),
      ],
      weightSummary: emptyWeightSummary(),
    });

    expect(agenda.items.map((item) => item.id)).toEqual(["vaccine-late", "vaccine-future"]);
    expect(agenda.reviewPrompt?.kind).toBe("overdue-vaccine");
  });

  it("includes upcoming vaccines within 30 days and excludes later doses", () => {
    const agenda = buildHomeAgenda({
      today,
      vaccineDoses: [
        dose({ id: "inside", plannedDate: "2026-08-19", status: "pendiente" }),
        dose({ id: "outside", plannedDate: "2026-08-20", status: "pendiente" }),
      ],
      weightSummary: emptyWeightSummary(),
    });

    expect(agenda.items.map((item) => item.id)).toEqual(["vaccine-inside"]);
  });

  it("adds a weight review item when the latest weight is at least seven days old", () => {
    const agenda = buildHomeAgenda({
      today,
      vaccineDoses: [],
      weightSummary: weightSummary({ daysSinceLatest: 8 }),
    });

    expect(agenda.items[0]?.kind).toBe("weight");
    expect(agenda.reviewPrompt?.kind).toBe("weight");
  });

  it("returns a calm state when there is nothing to review", () => {
    const agenda = buildHomeAgenda({
      today,
      vaccineDoses: [dose({ plannedDate: "2026-09-01", status: "pendiente" })],
      weightSummary: weightSummary({ daysSinceLatest: 2 }),
    });

    expect(agenda.items).toEqual([]);
    expect(agenda.reviewPrompt).toBeNull();
  });
});

function dose(overrides: Partial<PlannedVaccineDoseWithStatus>): PlannedVaccineDoseWithStatus {
  return {
    id: "dose",
    ageLabel: "2 meses",
    application: null,
    appliedOn: null,
    doseLabel: "1.ª dosis",
    notes: null,
    plannedDate: "2026-08-01",
    status: "proxima",
    vaccineName: "Hexavalente",
    ...overrides,
  };
}

function emptyWeightSummary(): WeightTrendSummary {
  return {
    averageGramsPerDay: null,
    daysBetweenLastEntries: null,
    daysSinceLatest: null,
    differenceGrams: null,
    latest: null,
    previous: null,
    totalEntries: 0,
  };
}

function weightSummary(overrides: Partial<WeightTrendSummary>): WeightTrendSummary {
  return {
    ...emptyWeightSummary(),
    daysSinceLatest: 8,
    latest: {
      id: "weight-1",
      measuredOn: "2026-07-12",
      notes: null,
      place: "pediatra",
      weightGrams: 3200,
    },
    totalEntries: 1,
    ...overrides,
  };
}
