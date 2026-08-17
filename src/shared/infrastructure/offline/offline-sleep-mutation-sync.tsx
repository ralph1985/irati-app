"use client";

import { useEffect, useRef } from "react";
import {
  listPendingSleepMutations,
  markPendingSleepMutationConflict,
  markPendingMutationError,
  removePendingMutation,
  replaceOfflineSnapshot,
  type OfflineSnapshot,
} from "./irati-offline-db";

type OfflineSnapshotResponse = { snapshot: OfflineSnapshot; syncedAt: string };

export function OfflineSleepMutationSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function syncPendingSleepMutations() {
      if (isSyncingRef.current || !navigator.onLine) return;
      isSyncingRef.current = true;
      try {
        const pendingMutations = (await listPendingSleepMutations()).filter(
          (mutation) => mutation.conflict === null,
        );
        let didSyncAllMutations = true;
        for (const mutation of pendingMutations) {
          const response = await fetch("/api/offline/sleep-mutations", {
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
          if (response.status === 409) {
            const conflict = (await response.json().catch(() => null)) as {
              activeEntry?: import("@/modules/sleep/domain/sleep-entry").SleepEntry | null;
            } | null;
            await markPendingSleepMutationConflict(mutation.id, conflict?.activeEntry ?? null);
          } else {
            await markPendingMutationError(
              mutation.id,
              getSleepMutationErrorMessage(response.status),
            );
          }
          window.dispatchEvent(new Event("irati-offline-sync-updated"));
          didSyncAllMutations = false;
          break;
        }
        if (pendingMutations.length > 0 && didSyncAllMutations) await refreshOfflineSnapshot();
      } finally {
        isSyncingRef.current = false;
      }
    }

    void syncPendingSleepMutations();
    window.addEventListener("online", syncPendingSleepMutations);
    window.addEventListener("irati-offline-sync-updated", syncPendingSleepMutations);
    return () => {
      window.removeEventListener("online", syncPendingSleepMutations);
      window.removeEventListener("irati-offline-sync-updated", syncPendingSleepMutations);
    };
  }, []);

  return null;
}

function getSleepMutationErrorMessage(status: number): string {
  return status === 409
    ? "Conflicto de sueño: requiere revisión manual."
    : "No pudimos sincronizar este registro de sueño.";
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
