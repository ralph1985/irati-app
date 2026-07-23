import { describe, expect, it } from "vitest";
import type {
  AppliedVaccineDose,
  PlannedVaccineDose,
} from "@/modules/vaccines/domain/vaccine-calendar";
import type { PendingVaccineMutation } from "./irati-offline-db";
import { buildPendingVaccineMutationSyncPlan } from "./offline-vaccine-mutation-sync-plan";

describe("buildPendingVaccineMutationSyncPlan", () => {
  it("keeps independent vaccine mutations in creation order", () => {
    const first = updatePlannedMutation("mutation-1", "dose-1");
    const second = updatePlannedMutation("mutation-2", "dose-2");

    expect(buildPendingVaccineMutationSyncPlan([first, second])).toEqual({
      canceledMutationIds: [],
      items: [
        { mutation: first, sourceIds: ["mutation-1"] },
        { mutation: second, sourceIds: ["mutation-2"] },
      ],
    });
  });

  it("sends a new application with the latest local application edits", () => {
    const plan = buildPendingVaccineMutationSyncPlan([
      markAppliedMutation("mutation-1"),
      updateApplicationMutation("mutation-2"),
    ]);

    expect(plan.canceledMutationIds).toEqual([]);
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toMatchObject({
      mutation: {
        id: "mutation-1",
        operation: "markApplied",
        payload: {
          applicationId: "application-1",
          dose: { lot: "B2" },
          plannedDoseId: "dose-1",
        },
      },
      sourceIds: ["mutation-1", "mutation-2"],
    });
  });

  it("drops a mark-applied and reopen pair that cancels itself locally", () => {
    expect(
      buildPendingVaccineMutationSyncPlan([
        markAppliedMutation("mutation-1"),
        reopenMutation("mutation-2"),
      ]),
    ).toEqual({
      canceledMutationIds: ["mutation-1", "mutation-2"],
      items: [],
    });
  });
});

function updatePlannedMutation(id: string, doseId: string): PendingVaccineMutation {
  return {
    createdAt: "2026-07-24T10:00:00.000Z",
    entity: "vaccine",
    id,
    lastError: null,
    operation: "updatePlanned",
    payload: {
      basePlannedDose: plannedDose({ id: doseId }),
      dose: {
        ageLabel: "2 meses",
        doseLabel: "1 dosis",
        notes: null,
        plannedDate: "2026-09-02",
        vaccineName: "Hexavalente",
      },
      id: doseId,
    },
  };
}

function markAppliedMutation(id: string): PendingVaccineMutation {
  return {
    createdAt: "2026-07-24T10:00:00.000Z",
    entity: "vaccine",
    id,
    lastError: null,
    operation: "markApplied",
    payload: {
      applicationId: "application-1",
      dose: appliedDoseInput({ lot: "A1" }),
      plannedDoseId: "dose-1",
    },
  };
}

function updateApplicationMutation(id: string): PendingVaccineMutation {
  return {
    createdAt: "2026-07-24T10:01:00.000Z",
    entity: "vaccine",
    id,
    lastError: null,
    operation: "updateApplication",
    payload: {
      baseApplication: appliedDose({ lot: "A1" }),
      dose: appliedDoseInput({ lot: "B2" }),
      id: "application-1",
      plannedDoseId: "dose-1",
    },
  };
}

function reopenMutation(id: string): PendingVaccineMutation {
  return {
    createdAt: "2026-07-24T10:01:00.000Z",
    entity: "vaccine",
    id,
    lastError: null,
    operation: "reopen",
    payload: {
      applicationId: "application-1",
      baseApplication: appliedDose({ lot: "A1" }),
      plannedDoseId: "dose-1",
    },
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
