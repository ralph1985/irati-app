import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlannedVaccineList } from "./planned-vaccine-list";

const noopAction = () => {};

describe("PlannedVaccineList", () => {
  it("renders an empty state", () => {
    expect(
      renderToStaticMarkup(<PlannedVaccineList doses={[]} updateAction={noopAction} />),
    ).toContain("Todavia no hay dosis planificadas.");
  });

  it("renders editable planned doses", () => {
    const html = renderToStaticMarkup(
      <PlannedVaccineList
        doses={[
          {
            id: "dose-1",
            vaccineName: "Meningococo ACWY",
            doseLabel: "Dosis 12 meses",
            plannedDate: "2027-07-02",
            ageLabel: "12 meses",
            notes: "Desde 2026 sustituye a MenC a los 12 meses.",
          },
        ]}
        updateAction={noopAction}
      />,
    );

    expect(html).toContain("Meningococo ACWY");
    expect(html).toContain("Dosis 12 meses");
    expect(html).toContain("2027-07-02");
  });
});
