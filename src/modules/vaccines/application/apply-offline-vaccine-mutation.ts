import {
  createAppliedVaccineDose,
  createPlannedVaccineDose,
  type AppliedVaccineDose,
  type PlannedVaccineDose,
} from "../domain/vaccine-calendar";
import {
  resolvePendingVaccineMutation,
  type PendingVaccineMutation,
  type RemoteVaccineState,
  type VaccineConflictCode,
} from "./vaccine-offline-conflicts";

export type OfflineVaccineMutationRepository = {
  deleteAppliedVaccineDose(id: string): Promise<void>;
  readRemoteState(mutation: PendingVaccineMutation): Promise<RemoteVaccineState>;
  updateAppliedVaccineDose(id: string, dose: Omit<AppliedVaccineDose, "id">): Promise<void>;
  updatePlannedVaccineDose(id: string, dose: Omit<PlannedVaccineDose, "id">): Promise<void>;
  upsertAppliedVaccineDose(id: string, dose: Omit<AppliedVaccineDose, "id">): Promise<void>;
};

export class OfflineVaccineMutationConflictError extends Error {
  constructor(readonly code: VaccineConflictCode) {
    super(code);
    this.name = "OfflineVaccineMutationConflictError";
  }
}

export async function applyOfflineVaccineMutation(
  repository: OfflineVaccineMutationRepository,
  mutation: PendingVaccineMutation,
): Promise<void> {
  const remoteState = await repository.readRemoteState(mutation);
  const resolution = resolvePendingVaccineMutation(mutation, remoteState);

  if (resolution.status === "manual-conflict") {
    throw new OfflineVaccineMutationConflictError(resolution.code);
  }

  if (mutation.operation === "updatePlanned") {
    await repository.updatePlannedVaccineDose(
      mutation.payload.id,
      createPlannedVaccineDose(mutation.payload.dose),
    );
    return;
  }

  if (mutation.operation === "markApplied") {
    await repository.upsertAppliedVaccineDose(
      mutation.payload.applicationId,
      createAppliedVaccineDose(mutation.payload.dose),
    );
    return;
  }

  if (mutation.operation === "updateApplication") {
    await repository.updateAppliedVaccineDose(
      mutation.payload.id,
      createAppliedVaccineDose(mutation.payload.dose),
    );
    return;
  }

  await repository.deleteAppliedVaccineDose(mutation.payload.applicationId);
}
