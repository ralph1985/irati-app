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
      renderToStaticMarkup(
        <PlannedVaccineList
          groups={emptyGroups}
          markAppliedAction={noopAction}
          reopenAction={noopAction}
          updateAction={noopAction}
          updateApplicationAction={noopAction}
        />,
      ),
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
              application: null,
              appliedOn: null,
              status: "proxima",
            },
          ],
        }}
        markAppliedAction={noopAction}
        reopenAction={noopAction}
        updateAction={noopAction}
        updateApplicationAction={noopAction}
      />,
    );

    expect(html).toContain("Meningococo ACWY");
    expect(html).toContain("Dosis 12 meses");
    expect(html).toContain("Proxima");
    expect(html).toContain("2027-07-02");
    expect(html).toContain("Marcar como aplicada");
  });

  it("renders applied dose editing and reopen controls", () => {
    const html = renderToStaticMarkup(
      <PlannedVaccineList
        groups={{
          ...emptyGroups,
          aplicada: [
            {
              id: "dose-1",
              vaccineName: "Meningococo ACWY",
              doseLabel: "Dosis 12 meses",
              plannedDate: "2027-07-02",
              ageLabel: "12 meses",
              notes: null,
              application: {
                id: "application-1",
                plannedDoseId: "dose-1",
                appliedOn: "2027-07-03",
                vaccineName: "Meningococo ACWY",
                doseLabel: "Dosis 12 meses",
                place: "Centro de salud",
                lot: "ABC123",
                notes: "Sin incidencias",
              },
              appliedOn: "2027-07-03",
              status: "aplicada",
            },
          ],
        }}
        markAppliedAction={noopAction}
        reopenAction={noopAction}
        updateAction={noopAction}
        updateApplicationAction={noopAction}
      />,
    );

    expect(html).toContain("Editar aplicacion");
    expect(html).toContain("Centro de salud");
    expect(html).toContain("Volver a pendiente");
  });
});
