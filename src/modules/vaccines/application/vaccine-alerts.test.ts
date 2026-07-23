import { describe, expect, it } from "vitest";
import { buildVaccineAlerts } from "./vaccine-alerts";
import { PlannedVaccineDoseWithStatus } from "../domain/vaccine-calendar";

describe("buildVaccineAlerts", () => {
  it("creates internal alerts only for upcoming and overdue planned doses", () => {
    const alerts = buildVaccineAlerts([
      createDose("overdue", "retrasada", "2026-07-17"),
      createDose("upcoming", "proxima", "2026-07-25"),
      createDose("pending", "pendiente", "2026-09-01"),
      createDose("applied", "aplicada", "2026-07-10"),
    ]);

    expect(alerts).toEqual([
      {
        id: "overdue",
        kind: "retrasada",
        title: "Vacuna overdue retrasada",
        detail: "1.ª dosis · Test",
        plannedDate: "2026-07-17",
      },
      {
        id: "upcoming",
        kind: "proxima",
        title: "Vacuna upcoming próxima",
        detail: "1.ª dosis · Test",
        plannedDate: "2026-07-25",
      },
    ]);
  });
});

function createDose(
  id: string,
  status: PlannedVaccineDoseWithStatus["status"],
  plannedDate: string,
): PlannedVaccineDoseWithStatus {
  return {
    id,
    vaccineName: `Vacuna ${id}`,
    doseLabel: "1.ª dosis",
    plannedDate,
    ageLabel: "Test",
    notes: null,
    application: null,
    appliedOn: null,
    status,
  };
}
