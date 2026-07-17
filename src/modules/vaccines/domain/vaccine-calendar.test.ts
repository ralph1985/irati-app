import { describe, expect, it } from "vitest";
import {
  assignPlannedVaccineDoseStatuses,
  buildMadridInitialVaccinePlan,
  calculatePlannedDate,
  groupPlannedVaccineDosesByStatus,
  madridVaccineCalendarSource,
} from "./vaccine-calendar";

describe("Madrid initial vaccine calendar", () => {
  it("keeps the official source metadata with verification date", () => {
    expect(madridVaccineCalendarSource.verifiedOn).toBe("2026-07-18");
    expect(madridVaccineCalendarSource.posterUrl).toContain("/51768");
    expect(madridVaccineCalendarSource.technicalDocumentUrl).toContain("/51747");
  });

  it("calculates planned dates from Irati birth date", () => {
    const plan = buildMadridInitialVaccinePlan("2026-07-02");

    expect(plan).toContainEqual(
      expect.objectContaining({
        vaccineName: "Hexavalente (DTPa-VPI-Hib-HB)",
        doseLabel: "1.ª dosis",
        plannedDate: "2026-09-02",
        ageLabel: "2 meses",
      }),
    );
    expect(plan).toContainEqual(
      expect.objectContaining({
        vaccineName: "Meningococo ACWY",
        doseLabel: "Dosis 12 meses",
        plannedDate: "2027-07-02",
      }),
    );
    expect(plan).toContainEqual(
      expect.objectContaining({
        vaccineName: "Inmunizacion frente a VRS",
        plannedDate: "2026-10-01",
      }),
    );
  });

  it("clamps dates when the target month is shorter", () => {
    expect(
      calculatePlannedDate("2026-01-31", {
        vaccineName: "Test",
        doseLabel: "Test",
        ageLabel: "1 mes",
        monthsFromBirth: 1,
      }),
    ).toBe("2026-02-28");
  });

  it("assigns applied, overdue, upcoming and pending statuses", () => {
    const today = new Date("2026-07-18T12:00:00.000Z");
    const doses = assignPlannedVaccineDoseStatuses(
      [
        createDose("overdue", "2026-07-17"),
        createDose("upcoming", "2026-08-01"),
        createDose("pending", "2026-08-02"),
        createDose("applied", "2026-07-10"),
      ],
      [
        {
          id: "application-1",
          plannedDoseId: "applied",
          appliedOn: "2026-07-15",
        },
      ],
      today,
    );

    expect(doses.find((dose) => dose.id === "overdue")?.status).toBe("retrasada");
    expect(doses.find((dose) => dose.id === "upcoming")?.status).toBe("proxima");
    expect(doses.find((dose) => dose.id === "pending")?.status).toBe("pendiente");
    expect(doses.find((dose) => dose.id === "applied")?.status).toBe("aplicada");
    expect(doses.find((dose) => dose.id === "applied")?.appliedOn).toBe("2026-07-15");
  });

  it("groups planned doses by state in product priority order", () => {
    const doses = assignPlannedVaccineDoseStatuses(
      [createDose("pending", "2026-08-20"), createDose("overdue", "2026-07-17")],
      [],
      new Date("2026-07-18T00:00:00.000Z"),
    );

    expect(groupPlannedVaccineDosesByStatus(doses)).toMatchObject({
      retrasada: [expect.objectContaining({ id: "overdue" })],
      proxima: [],
      pendiente: [expect.objectContaining({ id: "pending" })],
      aplicada: [],
    });
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
