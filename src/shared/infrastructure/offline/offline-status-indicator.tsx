"use client";

import { useEffect, useState } from "react";
import { readSyncMetadata } from "./irati-offline-db";

type OfflineStatusIndicatorProps = {
  styles: {
    readonly [key: string]: string;
  };
};

type OfflineStatus = "synced" | "local" | "offline" | "error" | "empty";

export function OfflineStatusIndicator({ styles }: OfflineStatusIndicatorProps) {
  const [status, setStatus] = useState<OfflineStatus>("empty");

  useEffect(() => {
    let isActive = true;

    async function refreshStatus() {
      const metadata = await readSyncMetadata();

      if (!isActive) {
        return;
      }

      if (!navigator.onLine && metadata.lastSuccessfulSyncAt) {
        setStatus("local");
        return;
      }

      if (!navigator.onLine) {
        setStatus("offline");
        return;
      }

      if (metadata.lastError) {
        setStatus("error");
        return;
      }

      setStatus(metadata.lastSuccessfulSyncAt ? "synced" : "empty");
    }

    void refreshStatus();
    window.addEventListener("online", refreshStatus);
    window.addEventListener("offline", refreshStatus);
    window.addEventListener("irati-offline-sync-updated", refreshStatus);

    return () => {
      isActive = false;
      window.removeEventListener("online", refreshStatus);
      window.removeEventListener("offline", refreshStatus);
      window.removeEventListener("irati-offline-sync-updated", refreshStatus);
    };
  }, []);

  return (
    <p aria-live="polite" className={styles.offlineStatus} data-status={status}>
      {getStatusCopy(status)}
    </p>
  );
}

function getStatusCopy(status: OfflineStatus): string {
  switch (status) {
    case "synced":
      return "Al día";
    case "local":
      return "Datos locales";
    case "offline":
      return "Sin conexión";
    case "error":
      return "Error al sincronizar";
    case "empty":
      return "Preparando copia local";
  }
}
