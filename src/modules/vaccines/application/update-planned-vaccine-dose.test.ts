import { describe, expect, it } from "vitest";
import { VaccinePlanRepository } from "./vaccine-plan-repository";
import { updatePlannedVaccineDose } from "./update-planned-vaccine-dose";

describe("updatePlannedVaccineDose", () => {
  it("validates and stores editable planned vaccine doses", async () => {
    const repository: VaccinePlanRepository = {
      async listPlannedVaccineDoses() {
        return [];
      },
      async listAppliedVaccineDoses() {
        return [];
      },
      async updatePlannedVaccineDose(id, dose) {
        return {
          id,
          ...dose,
        };
      },
    };

    await expect(
      updatePlannedVaccineDose(repository, "dose-1", {
        vaccineName: " Meningococo ACWY ",
        doseLabel: " Dosis 12 meses ",
        plannedDate: "2027-07-02",
        ageLabel: " 12 meses ",
        notes: " Revisar cita ",
      }),
    ).resolves.toEqual({
      id: "dose-1",
      vaccineName: "Meningococo ACWY",
      doseLabel: "Dosis 12 meses",
      plannedDate: "2027-07-02",
      ageLabel: "12 meses",
      notes: "Revisar cita",
    });
  });
});
