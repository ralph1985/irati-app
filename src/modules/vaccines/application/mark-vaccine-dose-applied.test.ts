import { describe, expect, it } from "vitest";
import { markVaccineDoseApplied } from "./mark-vaccine-dose-applied";
import { VaccinePlanRepository } from "./vaccine-plan-repository";

describe("markVaccineDoseApplied", () => {
  it("validates and stores an applied vaccine dose", async () => {
    const repository = createRepository();

    await expect(
      markVaccineDoseApplied(repository, {
        plannedDoseId: "dose-1",
        appliedOn: "2027-07-03",
        vaccineName: " Meningococo ACWY ",
        doseLabel: " Dosis 12 meses ",
        place: " Centro de salud ",
        lot: " ABC123 ",
        notes: " Sin incidencias ",
      }),
    ).resolves.toEqual({
      id: "application-1",
      plannedDoseId: "dose-1",
      appliedOn: "2027-07-03",
      vaccineName: "Meningococo ACWY",
      doseLabel: "Dosis 12 meses",
      place: "Centro de salud",
      lot: "ABC123",
      notes: "Sin incidencias",
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
