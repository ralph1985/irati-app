import { describe, expect, it } from "vitest";
import { updateAppliedVaccineDose } from "./update-applied-vaccine-dose";
import { VaccinePlanRepository } from "./vaccine-plan-repository";

describe("updateAppliedVaccineDose", () => {
  it("validates and updates an applied vaccine dose", async () => {
    const repository = createRepository();

    await expect(
      updateAppliedVaccineDose(repository, "application-1", {
        plannedDoseId: "dose-1",
        appliedOn: "2027-07-04",
        vaccineName: "Meningococo ACWY",
        doseLabel: "Dosis 12 meses",
        place: "Centro de salud",
        lot: "",
        notes: "",
      }),
    ).resolves.toEqual({
      id: "application-1",
      plannedDoseId: "dose-1",
      appliedOn: "2027-07-04",
      vaccineName: "Meningococo ACWY",
      doseLabel: "Dosis 12 meses",
      place: "Centro de salud",
      lot: null,
      notes: null,
    });
  });
});

function createRepository(): VaccinePlanRepository {
  return {
    async listPlannedVaccineDoses() {
      return [];
    },
    async listAppliedVaccineDoses() {
      return [];
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
}
