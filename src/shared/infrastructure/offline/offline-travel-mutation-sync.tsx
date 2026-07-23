"use client";

import { useEffect, useRef } from "react";
import {
  listPendingTravelMutations,
  markPendingMutationError,
  removePendingMutation,
  replaceOfflineSnapshot,
  type OfflineSnapshot,
} from "./irati-offline-db";

type OfflineSnapshotResponse = {
  snapshot: OfflineSnapshot;
  syncedAt: string;
};

export function OfflineTravelMutationSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function syncPendingTravelMutations() {
      if (isSyncingRef.current || !navigator.onLine) {
        return;
      }

      isSyncingRef.current = true;

      try {
        const pendingMutations = await listPendingTravelMutations();
        let didSyncAllMutations = true;

        for (const mutation of pendingMutations) {
          const response = await fetch("/api/offline/travel-mutations", {
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

          await markPendingMutationError(mutation.id, "No pudimos sincronizar este elemento.");
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

    void syncPendingTravelMutations();
    window.addEventListener("online", syncPendingTravelMutations);
    window.addEventListener("irati-offline-sync-updated", syncPendingTravelMutations);

    return () => {
      window.removeEventListener("online", syncPendingTravelMutations);
      window.removeEventListener("irati-offline-sync-updated", syncPendingTravelMutations);
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
