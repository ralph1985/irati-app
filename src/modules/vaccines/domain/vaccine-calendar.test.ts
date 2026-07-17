import { describe, expect, it } from "vitest";
import {
  buildMadridInitialVaccinePlan,
  calculatePlannedDate,
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
});
