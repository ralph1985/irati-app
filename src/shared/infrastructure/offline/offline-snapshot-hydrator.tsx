"use client";

import { useEffect } from "react";
import {
  recordOfflineSyncError,
  replaceOfflineSnapshot,
  type OfflineSnapshot,
} from "./irati-offline-db";

type OfflineSnapshotResponse = {
  snapshot: OfflineSnapshot;
  syncedAt: string;
};

export function OfflineSnapshotHydrator() {
  useEffect(() => {
    const controller = new AbortController();

    async function hydrateOfflineSnapshot() {
      try {
        const response = await fetch("/api/offline/snapshot", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (response.status === 401) {
          return;
        }

        if (!response.ok) {
          await recordOfflineSyncError("No pudimos actualizar la copia local.");
          window.dispatchEvent(new Event("irati-offline-sync-updated"));
          return;
        }

        const body = (await response.json()) as OfflineSnapshotResponse;
        await replaceOfflineSnapshot(body.snapshot, body.syncedAt);
        window.dispatchEvent(new Event("irati-offline-sync-updated"));
      } catch {
        await recordOfflineSyncError("No pudimos conectar para actualizar la copia local.");
        window.dispatchEvent(new Event("irati-offline-sync-updated"));
        // Offline snapshot hydration is best-effort; runtime reads still use the server for now.
      }
    }

    void hydrateOfflineSnapshot();
    window.addEventListener("online", hydrateOfflineSnapshot);

    return () => {
      controller.abort();
      window.removeEventListener("online", hydrateOfflineSnapshot);
    };
  }, []);

  return null;
}
