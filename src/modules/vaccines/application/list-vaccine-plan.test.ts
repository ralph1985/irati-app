import { describe, expect, it } from "vitest";
import { listVaccinePlan } from "./list-vaccine-plan";
import { VaccinePlanRepository } from "./vaccine-plan-repository";

describe("listVaccinePlan", () => {
  it("returns planned doses with status groups and summary", async () => {
    const repository: VaccinePlanRepository = {
      async listPlannedVaccineDoses() {
        return [
          createDose("dose-1", "2026-07-17"),
          createDose("dose-2", "2026-07-25"),
          createDose("dose-3", "2026-09-01"),
          createDose("dose-4", "2026-07-10"),
        ];
      },
      async listAppliedVaccineDoses() {
        return [
          {
            id: "application-1",
            plannedDoseId: "dose-4",
            appliedOn: "2026-07-11",
            vaccineName: "Vacuna dose-4",
            doseLabel: "1.ª dosis",
            place: "Centro de salud",
            lot: null,
            notes: null,
          },
        ];
      },
      async createAppliedVaccineDose(dose) {
        return {
          id: "application-1",
          ...dose,
        };
      },
      async updateAppliedVaccineDose(id, dose) {
        return {
          id,
          ...dose,
        };
      },
      async deleteAppliedVaccineDose() {},
      async updatePlannedVaccineDose(id, dose) {
        return {
          id,
          ...dose,
        };
      },
    };

    const plan = await listVaccinePlan(repository, new Date("2026-07-18T00:00:00.000Z"));

    expect(plan.summary).toEqual({
      total: 4,
      retrasada: 1,
      proxima: 1,
      pendiente: 1,
      aplicada: 1,
    });
    expect(plan.groups.retrasada[0].id).toBe("dose-1");
    expect(plan.groups.proxima[0].id).toBe("dose-2");
    expect(plan.groups.pendiente[0].id).toBe("dose-3");
    expect(plan.groups.aplicada[0].id).toBe("dose-4");
  });
});

function createDose(id: string, plannedDate: string) {
  return {
    id,
    vaccineName: `Vacuna ${id}`,
    doseLabel: "1.ª dosis",
    plannedDate,
    ageLabel: "Test",
    notes: null,
  };
}
