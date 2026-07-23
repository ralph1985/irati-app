"use client";

import { useEffect, useState } from "react";
import { readSyncMetadata } from "./irati-offline-db";

type OfflineSyncStatusProps = {
  className?: string;
};

export function OfflineSyncStatus({ className }: OfflineSyncStatusProps) {
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadMetadata() {
      const metadata = await readSyncMetadata();

      if (isActive) {
        setLastSuccessfulSyncAt(metadata.lastSuccessfulSyncAt);
      }
    }

    void loadMetadata();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <p className={className}>
      {lastSuccessfulSyncAt
        ? `Ultima copia local: ${formatDateTime(lastSuccessfulSyncAt)}`
        : "Este dispositivo aun no tiene copia local offline."}
    </p>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
