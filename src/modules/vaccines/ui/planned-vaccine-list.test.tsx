import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlannedVaccineList } from "./planned-vaccine-list";
import { PlannedVaccineDoseGroups } from "../domain/vaccine-calendar";

const noopAction = () => {};
const emptyGroups: PlannedVaccineDoseGroups = {
  retrasada: [],
  proxima: [],
  pendiente: [],
  aplicada: [],
};

describe("PlannedVaccineList", () => {
  it("renders an empty state", () => {
    expect(
      renderToStaticMarkup(<PlannedVaccineList groups={emptyGroups} updateAction={noopAction} />),
    ).toContain("Todavia no hay dosis planificadas.");
  });

  it("renders editable planned doses", () => {
    const html = renderToStaticMarkup(
      <PlannedVaccineList
        groups={{
          ...emptyGroups,
          proxima: [
            {
              id: "dose-1",
              vaccineName: "Meningococo ACWY",
              doseLabel: "Dosis 12 meses",
              plannedDate: "2027-07-02",
              ageLabel: "12 meses",
              notes: "Desde 2026 sustituye a MenC a los 12 meses.",
              appliedOn: null,
              status: "proxima",
            },
          ],
        }}
        updateAction={noopAction}
      />,
    );

    expect(html).toContain("Meningococo ACWY");
    expect(html).toContain("Dosis 12 meses");
    expect(html).toContain("Proxima");
    expect(html).toContain("2027-07-02");
  });
});
