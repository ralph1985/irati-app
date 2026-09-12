import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
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
    ).toContain("Aún no hay dosis planificadas.");
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
    expect(html).toContain("Próxima");
    expect(html).toContain("2027-07-02");
    expect(html).toContain('aria-label="Registrar vacuna aplicada"');
    expect(html).toContain('title="Registrar vacuna aplicada"');
    expect(html).toContain("Revisar primero");
    expect(html).toContain("Registrar aplicación");
    expect(html).toContain('aria-label="Editar planificación"');
    expect(html).toContain('title="Editar planificación"');
  });

  it("opens actionable status groups and keeps history collapsed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-03T12:00:00.000Z"));

    try {
      const html = renderToStaticMarkup(
        <PlannedVaccineList
          groups={{
            ...emptyGroups,
            retrasada: [
              {
                id: "late-dose",
                vaccineName: "Hexavalente",
                doseLabel: "1.ª dosis",
                plannedDate: "2026-09-02",
                ageLabel: "2 meses",
                notes: null,
                application: null,
                appliedOn: null,
                status: "retrasada",
              },
            ],
            proxima: [
              {
                id: "next-dose",
                vaccineName: "Neumococo",
                doseLabel: "1.ª dosis",
                plannedDate: "2026-09-10",
                ageLabel: "2 meses",
                notes: null,
                application: null,
                appliedOn: null,
                status: "proxima",
              },
            ],
            pendiente: [
              {
                id: "pending-dose",
                vaccineName: "Rotavirus",
                doseLabel: "1.ª dosis",
                plannedDate: "2026-10-02",
                ageLabel: "3 meses",
                notes: null,
                application: null,
                appliedOn: null,
                status: "pendiente",
              },
            ],
          }}
          markAppliedAction={noopAction}
          reopenAction={noopAction}
          updateAction={noopAction}
          updateApplicationAction={noopAction}
        />,
      );

      expect(html.match(/<details[^>]*open/g)).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders applied dose editing as a sheet action", () => {
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

    expect(html).toContain("Editar aplicación");
    expect(html).toContain('title="Editar aplicación"');
    expect(html).toContain("Lote: ABC123");
    expect(html).not.toContain("Centro de salud");
    expect(html).not.toContain("Volver a pendiente");
  });

  it("does not render an empty lot for an applied dose", () => {
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
                place: "",
                lot: "   ",
                notes: null,
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

    expect(html).not.toContain("Lote:");
  });

  it("renders timeline groups", () => {
    const dose = {
      id: "dose-1",
      vaccineName: "Meningococo ACWY",
      doseLabel: "Dosis 12 meses",
      plannedDate: "2000-01-01",
      ageLabel: "12 meses",
      notes: null,
      application: null,
      appliedOn: null,
      status: "proxima" as const,
    };
    const html = renderToStaticMarkup(
      <PlannedVaccineList
        groups={{
          ...emptyGroups,
          proxima: [dose],
        }}
        markAppliedAction={noopAction}
        reopenAction={noopAction}
        timelineGroups={[
          {
            ageLabel: "12 meses",
            doses: [dose],
            plannedDate: "2000-01-01",
          },
        ]}
        updateAction={noopAction}
        updateApplicationAction={noopAction}
        view="timeline"
      />,
    );

    expect(html).toContain("12 meses");
    expect(html).toContain("Meningococo ACWY");
    expect(html).toContain("Registrar aplicación");
    expect(html).toContain('open=""');
  });
});
