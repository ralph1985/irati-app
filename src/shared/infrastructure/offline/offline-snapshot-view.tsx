"use client";

import { useEffect, useState } from "react";
import {
  readOfflineSnapshot,
  readSyncMetadata,
  type OfflineSnapshot,
  type SyncMetadata,
} from "./irati-offline-db";

type OfflineSnapshotViewProps = {
  styles: {
    readonly [key: string]: string;
  };
};

export function OfflineSnapshotView({ styles }: OfflineSnapshotViewProps) {
  const [snapshot, setSnapshot] = useState<OfflineSnapshot | null>(null);
  const [metadata, setMetadata] = useState<SyncMetadata | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadOfflineData() {
      const [nextSnapshot, nextMetadata] = await Promise.all([
        readOfflineSnapshot(),
        readSyncMetadata(),
      ]);

      if (isActive) {
        setSnapshot(nextSnapshot);
        setMetadata(nextMetadata);
      }
    }

    void loadOfflineData();

    return () => {
      isActive = false;
    };
  }, []);

  if (!snapshot || !metadata) {
    return <p className={styles.notice}>Buscando copia local...</p>;
  }

  if (!snapshot.profile || !metadata.lastSuccessfulSyncAt) {
    return (
      <section className={styles.panel} aria-labelledby="offline-empty-title">
        <h2 id="offline-empty-title">Sin copia local</h2>
        <p>Abre Irati con conexion para preparar este dispositivo antes de usarla offline.</p>
      </section>
    );
  }

  const latestWeight = [...snapshot.weightEntries].sort((left, right) =>
    right.measuredOn.localeCompare(left.measuredOn),
  )[0];
  const vaccineSummary = getVaccineSummary(snapshot);
  const travelPacked = snapshot.travelChecklistItems.filter((item) => item.isPacked).length;

  return (
    <section className={styles.panel} aria-labelledby="offline-data-title">
      <div>
        <h2 id="offline-data-title">{snapshot.profile.name}</h2>
        <p>Ultima copia local: {formatDateTime(metadata.lastSuccessfulSyncAt)}</p>
      </div>

      <dl className={styles.summary}>
        <div>
          <dt>Peso</dt>
          <dd>
            {latestWeight
              ? `${latestWeight.weightGrams.toLocaleString("es-ES")} g`
              : "Sin pesos guardados"}
          </dd>
        </div>
        <div>
          <dt>Vacunas</dt>
          <dd>{vaccineSummary}</dd>
        </div>
        <div>
          <dt>Viaje</dt>
          <dd>
            {travelPacked}/{snapshot.travelChecklistItems.length} preparado
          </dd>
        </div>
      </dl>
    </section>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getVaccineSummary(snapshot: OfflineSnapshot): string {
  const appliedPlannedDoseIds = new Set(
    snapshot.appliedVaccineDoses
      .map((dose) => dose.plannedDoseId)
      .filter((id): id is string => id !== null),
  );
  const today = new Date().toISOString().slice(0, 10);
  const upcomingLimit = new Date();

  upcomingLimit.setDate(upcomingLimit.getDate() + 14);

  const upcomingLimitDate = upcomingLimit.toISOString().slice(0, 10);
  const pendingDoses = snapshot.plannedVaccineDoses.filter(
    (dose) => !appliedPlannedDoseIds.has(dose.id),
  );
  const delayed = pendingDoses.filter((dose) => dose.plannedDate < today).length;
  const upcoming = pendingDoses.filter(
    (dose) => dose.plannedDate >= today && dose.plannedDate <= upcomingLimitDate,
  ).length;

  if (delayed > 0) {
    return `${delayed} retrasadas`;
  }

  return `${upcoming} proximas`;
}
