import type {
  AppliedVaccineDose,
  NewAppliedVaccineDose,
  NewPlannedVaccineDose,
  PlannedVaccineDose,
} from "../domain/vaccine-calendar";

export type PendingVaccineMutation =
  | {
      operation: "updatePlanned";
      payload: {
        basePlannedDose: PlannedVaccineDose;
        dose: NewPlannedVaccineDose;
        id: string;
      };
    }
  | {
      operation: "markApplied";
      payload: {
        dose: NewAppliedVaccineDose;
        plannedDoseId: string;
      };
    }
  | {
      operation: "updateApplication";
      payload: {
        baseApplication: AppliedVaccineDose;
        dose: NewAppliedVaccineDose;
        id: string;
        plannedDoseId: string;
      };
    }
  | {
      operation: "reopen";
      payload: {
        applicationId: string;
        baseApplication: AppliedVaccineDose;
        plannedDoseId: string;
      };
    };

export type VaccineConflictCode =
  | "remote-planned-clinical-change"
  | "remote-application-exists"
  | "remote-application-missing"
  | "remote-application-changed";

export type VaccineMutationResolution =
  | {
      status: "ready";
      mutation: PendingVaccineMutation;
    }
  | {
      code: VaccineConflictCode;
      status: "manual-conflict";
    };

export type RemoteVaccineState = {
  application: AppliedVaccineDose | null;
  plannedDose: PlannedVaccineDose | null;
};

export function resolvePendingVaccineMutation(
  mutation: PendingVaccineMutation,
  remoteState: RemoteVaccineState,
): VaccineMutationResolution {
  if (mutation.operation === "updatePlanned") {
    if (
      remoteState.plannedDose &&
      hasClinicalPlannedChange(mutation.payload.basePlannedDose, remoteState.plannedDose)
    ) {
      return { code: "remote-planned-clinical-change", status: "manual-conflict" };
    }
  }

  if (mutation.operation === "markApplied" && remoteState.application) {
    return { code: "remote-application-exists", status: "manual-conflict" };
  }

  if (mutation.operation === "updateApplication") {
    if (!remoteState.application) {
      return { code: "remote-application-missing", status: "manual-conflict" };
    }
  }

  if (mutation.operation === "reopen") {
    if (
      remoteState.application &&
      hasApplicationChanged(mutation.payload.baseApplication, remoteState.application)
    ) {
      return { code: "remote-application-changed", status: "manual-conflict" };
    }
  }

  return { mutation, status: "ready" };
}

export function compactPendingVaccineMutations(
  mutations: PendingVaccineMutation[],
): PendingVaccineMutation[] {
  const compacted: PendingVaccineMutation[] = [];

  for (const mutation of mutations) {
    const previous = compacted.at(-1);

    if (!previous) {
      compacted.push(mutation);
      continue;
    }

    const replacement = compactPair(previous, mutation);

    if (replacement === "drop-pair") {
      compacted.pop();
      continue;
    }

    if (replacement) {
      compacted[compacted.length - 1] = replacement;
      continue;
    }

    compacted.push(mutation);
  }

  return compacted;
}

function compactPair(
  previous: PendingVaccineMutation,
  next: PendingVaccineMutation,
): PendingVaccineMutation | "drop-pair" | null {
  if (
    previous.operation === "markApplied" &&
    next.operation === "updateApplication" &&
    previous.payload.plannedDoseId === next.payload.plannedDoseId
  ) {
    return {
      operation: "markApplied",
      payload: {
        dose: next.payload.dose,
        plannedDoseId: previous.payload.plannedDoseId,
      },
    };
  }

  if (
    previous.operation === "reopen" &&
    next.operation === "markApplied" &&
    previous.payload.plannedDoseId === next.payload.plannedDoseId
  ) {
    return next;
  }

  if (
    previous.operation === "markApplied" &&
    next.operation === "reopen" &&
    previous.payload.plannedDoseId === next.payload.plannedDoseId
  ) {
    return "drop-pair";
  }

  return null;
}

function hasClinicalPlannedChange(
  basePlannedDose: PlannedVaccineDose,
  remotePlannedDose: PlannedVaccineDose,
): boolean {
  return (
    basePlannedDose.vaccineName !== remotePlannedDose.vaccineName ||
    basePlannedDose.doseLabel !== remotePlannedDose.doseLabel ||
    basePlannedDose.plannedDate !== remotePlannedDose.plannedDate
  );
}

function hasApplicationChanged(
  baseApplication: AppliedVaccineDose,
  remoteApplication: AppliedVaccineDose,
): boolean {
  return (
    baseApplication.appliedOn !== remoteApplication.appliedOn ||
    baseApplication.vaccineName !== remoteApplication.vaccineName ||
    baseApplication.doseLabel !== remoteApplication.doseLabel ||
    baseApplication.place !== remoteApplication.place ||
    baseApplication.lot !== remoteApplication.lot ||
    baseApplication.notes !== remoteApplication.notes
  );
}
