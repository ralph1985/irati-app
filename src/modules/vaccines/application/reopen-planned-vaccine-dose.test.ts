import { describe, expect, it } from "vitest";
import { reopenPlannedVaccineDose } from "./reopen-planned-vaccine-dose";
import { VaccinePlanRepository } from "./vaccine-plan-repository";

describe("reopenPlannedVaccineDose", () => {
  it("deletes the application to return a planned dose to pending", async () => {
    const deletedIds: string[] = [];
    const repository: VaccinePlanRepository = {
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
      async deleteAppliedVaccineDose(id) {
        deletedIds.push(id);
      },
      async updatePlannedVaccineDose(id, dose) {
        return {
          id,
          ...dose,
        };
      },
    };

    await reopenPlannedVaccineDose(repository, "application-1");

    expect(deletedIds).toEqual(["application-1"]);
  });
});
