"use client";

import { useEffect, useRef } from "react";
import {
  listPendingVaccineMutations,
  markPendingMutationError,
  removePendingMutation,
  replaceOfflineSnapshot,
  type OfflineSnapshot,
} from "./irati-offline-db";
import { buildPendingVaccineMutationSyncPlan } from "./offline-vaccine-mutation-sync-plan";

type OfflineSnapshotResponse = {
  snapshot: OfflineSnapshot;
  syncedAt: string;
};

export function OfflineVaccineMutationSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function syncPendingVaccineMutations() {
      if (isSyncingRef.current || !navigator.onLine) {
        return;
      }

      isSyncingRef.current = true;

      try {
        const pendingMutations = await listPendingVaccineMutations();
        const syncPlan = buildPendingVaccineMutationSyncPlan(pendingMutations);
        let didSyncAllMutations = true;

        for (const canceledMutationId of syncPlan.canceledMutationIds) {
          await removePendingMutation(canceledMutationId);
        }

        if (syncPlan.canceledMutationIds.length > 0) {
          window.dispatchEvent(new Event("irati-offline-sync-updated"));
        }

        for (const item of syncPlan.items) {
          const response = await fetch("/api/offline/vaccine-mutations", {
            body: JSON.stringify(item.mutation),
            cache: "no-store",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });

          if (response.ok) {
            await Promise.all(item.sourceIds.map((sourceId) => removePendingMutation(sourceId)));
            window.dispatchEvent(new Event("irati-offline-sync-updated"));
            continue;
          }

          await Promise.all(
            item.sourceIds.map((sourceId) =>
              markPendingMutationError(sourceId, getVaccineMutationErrorMessage(response.status)),
            ),
          );
          window.dispatchEvent(new Event("irati-offline-sync-updated"));
          didSyncAllMutations = false;
          break;
        }

        if (pendingMutations.length > 0 && didSyncAllMutations) {
          await refreshOfflineSnapshot();
        }
      } finally {
        isSyncingRef.current = false;
      }
    }

    void syncPendingVaccineMutations();
    window.addEventListener("online", syncPendingVaccineMutations);
    window.addEventListener("irati-offline-sync-updated", syncPendingVaccineMutations);

    return () => {
      window.removeEventListener("online", syncPendingVaccineMutations);
      window.removeEventListener("irati-offline-sync-updated", syncPendingVaccineMutations);
    };
  }, []);

  return null;
}

function getVaccineMutationErrorMessage(status: number): string {
  if (status === 409) {
    return "Conflicto de vacunas: requiere revision manual.";
  }

  return "No pudimos sincronizar esta vacuna.";
}

async function refreshOfflineSnapshot() {
  const response = await fetch("/api/offline/snapshot", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    return;
  }

  const body = (await response.json()) as OfflineSnapshotResponse;

  await replaceOfflineSnapshot(body.snapshot, body.syncedAt);
  window.dispatchEvent(new Event("irati-offline-sync-updated"));
}
