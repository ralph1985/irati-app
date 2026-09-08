"use client";

import { useEffect, useRef } from "react";
import {
  listPendingGrowthMutations,
  markPendingMutationError,
  removePendingMutation,
  replaceOfflineSnapshot,
  type OfflineSnapshot,
} from "./irati-offline-db";

type OfflineSnapshotResponse = {
  snapshot: OfflineSnapshot;
  syncedAt: string;
};

export function OfflineGrowthMutationSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function syncPendingGrowthMutations() {
      if (isSyncingRef.current || !navigator.onLine) return;

      isSyncingRef.current = true;

      try {
        const pendingMutations = await listPendingGrowthMutations();
        let didSyncAllMutations = true;

        for (const mutation of pendingMutations) {
          const response = await fetch("/api/offline/growth-mutations", {
            body: JSON.stringify(mutation),
            cache: "no-store",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });

          if (response.ok) {
            await removePendingMutation(mutation.id);
            window.dispatchEvent(new Event("irati-offline-sync-updated"));
            continue;
          }

          await markPendingMutationError(mutation.id, "No pudimos sincronizar esta medida.");
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

    void syncPendingGrowthMutations();
    window.addEventListener("online", syncPendingGrowthMutations);
    window.addEventListener("irati-offline-sync-updated", syncPendingGrowthMutations);

    return () => {
      window.removeEventListener("online", syncPendingGrowthMutations);
      window.removeEventListener("irati-offline-sync-updated", syncPendingGrowthMutations);
    };
  }, []);

  return null;
}

async function refreshOfflineSnapshot() {
  const response = await fetch("/api/offline/snapshot", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) return;

  const body = (await response.json()) as OfflineSnapshotResponse;
  await replaceOfflineSnapshot(body.snapshot, body.syncedAt);
  window.dispatchEvent(new Event("irati-offline-sync-updated"));
}
