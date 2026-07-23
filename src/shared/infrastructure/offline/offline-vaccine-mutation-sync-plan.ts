import { compactPendingVaccineMutations } from "../../../modules/vaccines/application/vaccine-offline-conflicts";
import type { PendingVaccineMutation } from "./irati-offline-db";

export type PendingVaccineMutationSyncItem = {
  mutation: PendingVaccineMutation;
  sourceIds: string[];
};

export type PendingVaccineMutationSyncPlan = {
  canceledMutationIds: string[];
  items: PendingVaccineMutationSyncItem[];
};

export function buildPendingVaccineMutationSyncPlan(
  pendingMutations: PendingVaccineMutation[],
): PendingVaccineMutationSyncPlan {
  const canceledMutationIds: string[] = [];
  const items: PendingVaccineMutationSyncItem[] = [];

  for (const mutation of pendingMutations) {
    const previousItem = items.at(-1);

    if (!previousItem) {
      items.push({ mutation, sourceIds: [mutation.id] });
      continue;
    }

    const compactedPair = compactPendingVaccineMutations([previousItem.mutation, mutation]);

    if (compactedPair.length === 0) {
      items.pop();
      canceledMutationIds.push(...previousItem.sourceIds, mutation.id);
      continue;
    }

    if (compactedPair.length === 1) {
      items[items.length - 1] = {
        mutation: {
          ...previousItem.mutation,
          operation: compactedPair[0].operation,
          payload: compactedPair[0].payload,
        } as PendingVaccineMutation,
        sourceIds: [...previousItem.sourceIds, mutation.id],
      };
      continue;
    }

    items.push({ mutation, sourceIds: [mutation.id] });
  }

  return { canceledMutationIds, items };
}
