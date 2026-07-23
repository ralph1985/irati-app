import { describe, expect, it } from "vitest";
import type { AppliedVaccineDose, PlannedVaccineDose } from "../domain/vaccine-calendar";
import {
  applyOfflineVaccineMutation,
  OfflineVaccineMutationConflictError,
  type OfflineVaccineMutationRepository,
} from "./apply-offline-vaccine-mutation";
import type { RemoteVaccineState } from "./vaccine-offline-conflicts";

describe("applyOfflineVaccineMutation", () => {
  it("upserts an applied vaccine dose with the stable offline application id", async () => {
    const writes: string[] = [];
    const repository = createRepository({
      async upsertAppliedVaccineDose(id, dose) {
        writes.push(`${id}:${dose.place}:${dose.lot}`);
      },
    });

    await applyOfflineVaccineMutation(repository, {
      operation: "markApplied",
      payload: {
        applicationId: "application-1",
        dose: appliedDoseInput({ lot: "A1" }),
        plannedDoseId: "dose-1",
      },
    });

    expect(writes).toEqual(["application-1:Centro de salud:A1"]);
  });

  it("returns a manual conflict before creating a second application for the same planned dose", async () => {
    const repository = createRepository({
      remoteState: {
        application: appliedDose({ id: "remote-application" }),
        plannedDose: plannedDose({}),
      },
    });

    await expect(
      applyOfflineVaccineMutation(repository, {
        operation: "markApplied",
        payload: {
          applicationId: "application-1",
          dose: appliedDoseInput({}),
          plannedDoseId: "dose-1",
        },
      }),
    ).rejects.toEqual(new OfflineVaccineMutationConflictError("remote-application-exists"));
  });

  it("updates planned doses only after validating the remote base state", async () => {
    const writes: string[] = [];
    const repository = createRepository({
      async updatePlannedVaccineDose(id, dose) {
        writes.push(`${id}:${dose.plannedDate}:${dose.notes}`);
      },
      remoteState: {
        application: null,
        plannedDose: plannedDose({}),
      },
    });

    await applyOfflineVaccineMutation(repository, {
      operation: "updatePlanned",
      payload: {
        basePlannedDose: plannedDose({}),
        dose: {
          ageLabel: "2 meses",
          doseLabel: "1 dosis",
          notes: "Cita movida",
          plannedDate: "2026-09-04",
          vaccineName: "Hexavalente",
        },
        id: "dose-1",
      },
    });

    expect(writes).toEqual(["dose-1:2026-09-04:Cita movida"]);
  });

  it("does not delete a remotely edited application when reopening a dose", async () => {
    const repository = createRepository({
      remoteState: {
        application: appliedDose({ lot: "B2" }),
        plannedDose: plannedDose({}),
      },
    });

    await expect(
      applyOfflineVaccineMutation(repository, {
        operation: "reopen",
        payload: {
          applicationId: "application-1",
          baseApplication: appliedDose({ lot: "A1" }),
          plannedDoseId: "dose-1",
        },
      }),
    ).rejects.toEqual(new OfflineVaccineMutationConflictError("remote-application-changed"));
  });
});

function createRepository(
  overrides: Partial<OfflineVaccineMutationRepository> & {
    remoteState?: RemoteVaccineState;
  } = {},
): OfflineVaccineMutationRepository {
  return {
    async deleteAppliedVaccineDose() {},
    async readRemoteState() {
      return (
        overrides.remoteState ?? {
          application: null,
          plannedDose: plannedDose({}),
        }
      );
    },
    async updateAppliedVaccineDose() {},
    async updatePlannedVaccineDose() {},
    async upsertAppliedVaccineDose() {},
    ...overrides,
  };
}

function plannedDose(overrides: Partial<PlannedVaccineDose>): PlannedVaccineDose {
  return {
    ageLabel: "2 meses",
    doseLabel: "1 dosis",
    id: "dose-1",
    notes: null,
    plannedDate: "2026-09-02",
    vaccineName: "Hexavalente",
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
    appliedOn: "2026-09-02",
    doseLabel: "1 dosis",
    lot: null,
    notes: null,
    place: "Centro de salud",
    plannedDoseId: "dose-1",
    vaccineName: "Hexavalente",
    ...overrides,
  };
}
