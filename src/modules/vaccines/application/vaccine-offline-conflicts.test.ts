import { describe, expect, it } from "vitest";
import type { AppliedVaccineDose, PlannedVaccineDose } from "../domain/vaccine-calendar";
import {
  compactPendingVaccineMutations,
  resolvePendingVaccineMutation,
  type PendingVaccineMutation,
} from "./vaccine-offline-conflicts";

describe("resolvePendingVaccineMutation", () => {
  it("requires manual review when a planned dose clinical field changed remotely", () => {
    expect(
      resolvePendingVaccineMutation(
        {
          operation: "updatePlanned",
          payload: {
            basePlannedDose: plannedDose({ plannedDate: "2026-09-01" }),
            dose: {
              vaccineName: "Hexavalente",
              doseLabel: "1 dosis",
              plannedDate: "2026-09-05",
              ageLabel: "2 meses",
              notes: "Cita movida",
            },
            id: "dose-1",
          },
        },
        {
          application: null,
          plannedDose: plannedDose({ plannedDate: "2026-09-03" }),
        },
      ),
    ).toEqual({
      code: "remote-planned-clinical-change",
      status: "manual-conflict",
    });
  });

  it("allows planned note-only remote drift when local clinical fields are still based on the same dose", () => {
    const mutation: PendingVaccineMutation = {
      operation: "updatePlanned",
      payload: {
        basePlannedDose: plannedDose({ notes: null }),
        dose: {
          vaccineName: "Hexavalente",
          doseLabel: "1 dosis",
          plannedDate: "2026-09-01",
          ageLabel: "2 meses",
          notes: "Llamar antes",
        },
        id: "dose-1",
      },
    };

    expect(
      resolvePendingVaccineMutation(mutation, {
        application: null,
        plannedDose: plannedDose({ notes: "Remota" }),
      }),
    ).toEqual({ mutation, status: "ready" });
  });

  it("does not allow a second application for the same planned dose", () => {
    expect(
      resolvePendingVaccineMutation(
        {
          operation: "markApplied",
          payload: {
            dose: appliedDoseInput({}),
            plannedDoseId: "dose-1",
          },
        },
        {
          application: appliedDose({ id: "remote-application" }),
          plannedDose: plannedDose({}),
        },
      ),
    ).toEqual({
      code: "remote-application-exists",
      status: "manual-conflict",
    });
  });

  it("keeps local application edits when the remote application disappeared", () => {
    expect(
      resolvePendingVaccineMutation(
        {
          operation: "updateApplication",
          payload: {
            baseApplication: appliedDose({}),
            dose: appliedDoseInput({ notes: "Nuevo lote revisado" }),
            id: "application-1",
            plannedDoseId: "dose-1",
          },
        },
        {
          application: null,
          plannedDose: plannedDose({}),
        },
      ),
    ).toEqual({
      code: "remote-application-missing",
      status: "manual-conflict",
    });
  });

  it("does not delete a remotely edited application automatically", () => {
    expect(
      resolvePendingVaccineMutation(
        {
          operation: "reopen",
          payload: {
            applicationId: "application-1",
            baseApplication: appliedDose({ lot: "A1" }),
            plannedDoseId: "dose-1",
          },
        },
        {
          application: appliedDose({ lot: "B2" }),
          plannedDose: plannedDose({}),
        },
      ),
    ).toEqual({
      code: "remote-application-changed",
      status: "manual-conflict",
    });
  });
});

describe("compactPendingVaccineMutations", () => {
  it("combines a new application and its local edits into a final applied payload", () => {
    expect(
      compactPendingVaccineMutations([
        {
          operation: "markApplied",
          payload: {
            dose: appliedDoseInput({ lot: "A1" }),
            plannedDoseId: "dose-1",
          },
        },
        {
          operation: "updateApplication",
          payload: {
            baseApplication: appliedDose({ lot: "A1" }),
            dose: appliedDoseInput({ lot: "B2" }),
            id: "application-1",
            plannedDoseId: "dose-1",
          },
        },
      ]),
    ).toEqual([
      {
        operation: "markApplied",
        payload: {
          dose: appliedDoseInput({ lot: "B2" }),
          plannedDoseId: "dose-1",
        },
      },
    ]);
  });

  it("cancels mark applied followed by reopen for the same planned dose", () => {
    expect(
      compactPendingVaccineMutations([
        {
          operation: "markApplied",
          payload: {
            dose: appliedDoseInput({}),
            plannedDoseId: "dose-1",
          },
        },
        {
          operation: "reopen",
          payload: {
            applicationId: "application-1",
            baseApplication: appliedDose({}),
            plannedDoseId: "dose-1",
          },
        },
      ]),
    ).toEqual([]);
  });

  it("keeps planned edits before marking a dose as applied", () => {
    const updatePlanned: PendingVaccineMutation = {
      operation: "updatePlanned",
      payload: {
        basePlannedDose: plannedDose({}),
        dose: {
          vaccineName: "Hexavalente",
          doseLabel: "1 dosis",
          plannedDate: "2026-09-02",
          ageLabel: "2 meses",
          notes: null,
        },
        id: "dose-1",
      },
    };
    const markApplied: PendingVaccineMutation = {
      operation: "markApplied",
      payload: {
        dose: appliedDoseInput({}),
        plannedDoseId: "dose-1",
      },
    };

    expect(compactPendingVaccineMutations([updatePlanned, markApplied])).toEqual([
      updatePlanned,
      markApplied,
    ]);
  });
});

function plannedDose(overrides: Partial<PlannedVaccineDose>): PlannedVaccineDose {
  return {
    id: "dose-1",
    vaccineName: "Hexavalente",
    doseLabel: "1 dosis",
    plannedDate: "2026-09-01",
    ageLabel: "2 meses",
    notes: null,
    ...overrides,
  };
}

function appliedDose(overrides: Partial<AppliedVaccineDose>): AppliedVaccineDose {
  return {
    id: "application-1",
    ...appliedDoseInput({}),
    ...overrides,
  };
}

function appliedDoseInput(
  overrides: Partial<Omit<AppliedVaccineDose, "id">>,
): Omit<AppliedVaccineDose, "id"> {
  return {
    plannedDoseId: "dose-1",
    appliedOn: "2026-09-02",
    vaccineName: "Hexavalente",
    doseLabel: "1 dosis",
    place: "Centro de salud",
    lot: null,
    notes: null,
    ...overrides,
  };
}
