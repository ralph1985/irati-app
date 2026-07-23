import { describe, expect, it } from "vitest";
import {
  groupPlannedVaccineDosesByAge,
  selectNextActionableVaccineDose,
} from "./vaccine-plan-views";
import { PlannedVaccineDoseWithStatus } from "../domain/vaccine-calendar";

describe("vaccine plan views", () => {
  it("groups timeline doses by age label and sorts by date", () => {
    const groups = groupPlannedVaccineDosesByAge([
      dose({ id: "late", ageLabel: "4 meses", plannedDate: "2026-11-02" }),
      dose({ id: "early", ageLabel: "2 meses", plannedDate: "2026-09-02" }),
      dose({ id: "same-age", ageLabel: "2 meses", plannedDate: "2026-09-03" }),
    ]);

    expect(groups.map((group) => group.ageLabel)).toEqual(["2 meses", "4 meses"]);
    expect(groups[0]?.doses.map((groupDose) => groupDose.id)).toEqual(["early", "same-age"]);
  });

  it("uses a fallback group when a dose has no age label", () => {
    expect(groupPlannedVaccineDosesByAge([dose({ ageLabel: null })])[0]?.ageLabel).toBe(
      "Edad por definir",
    );
  });

  it("selects the next actionable dose by status priority and date", () => {
    const selected = selectNextActionableVaccineDose([
      dose({ id: "pending", plannedDate: "2026-09-01", status: "pendiente" }),
      dose({ id: "upcoming", plannedDate: "2026-08-01", status: "proxima" }),
      dose({ id: "late", plannedDate: "2026-07-01", status: "retrasada" }),
      dose({ id: "applied", plannedDate: "2026-06-01", status: "aplicada" }),
    ]);

    expect(selected?.id).toBe("late");
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
    plannedDate: "2026-09-02",
    status: "pendiente",
    vaccineName: "Hexavalente",
    ...overrides,
  };
}
