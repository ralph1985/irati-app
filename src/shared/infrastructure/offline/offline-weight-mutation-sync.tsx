"use client";

import { useEffect, useRef } from "react";
import {
  listPendingWeightMutations,
  markPendingMutationError,
  removePendingMutation,
  replaceOfflineSnapshot,
  type OfflineSnapshot,
} from "./irati-offline-db";

type OfflineSnapshotResponse = {
  snapshot: OfflineSnapshot;
  syncedAt: string;
};

export function OfflineWeightMutationSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function syncPendingWeightMutations() {
      if (isSyncingRef.current || !navigator.onLine) {
        return;
      }

      isSyncingRef.current = true;

      try {
        const pendingMutations = await listPendingWeightMutations();
        let didSyncAllMutations = true;

        for (const mutation of pendingMutations) {
          const response = await fetch("/api/offline/weight-mutations", {
            body: JSON.stringify(mutation),
            cache: "no-store",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });

          if (response.ok) {
            await removePendingMutation(mutation.id);
            window.dispatchEvent(new Event("irati-offline-sync-updated"));
            continue;
          }

          await markPendingMutationError(mutation.id, "No pudimos sincronizar este peso.");
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

    void syncPendingWeightMutations();
    window.addEventListener("online", syncPendingWeightMutations);
    window.addEventListener("irati-offline-sync-updated", syncPendingWeightMutations);

    return () => {
      window.removeEventListener("online", syncPendingWeightMutations);
      window.removeEventListener("irati-offline-sync-updated", syncPendingWeightMutations);
    };
  }, []);

  return null;
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
