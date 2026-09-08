"use client";

import { FormEvent, useEffect, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import { ConfirmSubmit } from "../../../shared/ui/confirm-submit";
import { PendingSubmitButton } from "../../../shared/ui/pending-submit-button";
import {
  createHeadCircumferenceEntry,
  createHeightEntry,
  type HeadCircumferenceEntry,
  type HeightEntry,
  isMeasurementPlace,
} from "../domain/growth-entry";
import {
  applyOfflineHeadCircumferenceEntry,
  applyOfflineHeightEntry,
  deleteOfflineHeadCircumferenceEntry,
  deleteOfflineHeightEntry,
  enqueuePendingGrowthMutation,
  listPendingGrowthMutations,
  type PendingGrowthMutation,
} from "../../../shared/infrastructure/offline/irati-offline-db";
import styles from "../../../app/(app)/peso/page.module.css";
import type { GrowthEntry, GrowthMetric } from "../application/growth-chart-series";

type GrowthHistoryProps = {
  deleteAction: (formData: FormData) => void | Promise<void>;
  entries: GrowthEntry[];
  metric: GrowthMetric;
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function GrowthHistory({ deleteAction, entries, metric, updateAction }: GrowthHistoryProps) {
  const [editingEntry, setEditingEntry] = useState<GrowthEntry | null>(null);
  const [pendingMutations, setPendingMutations] = useState<PendingGrowthMutation[]>([]);
  const relevantPending = pendingMutations.filter((mutation) => mutation.entity === metric);
  const pendingState = buildPendingState(relevantPending, metric);
  const visibleEntries = entries.filter((entry) => !pendingState.hiddenEntryIds.has(entry.id));

  useEffect(() => {
    let isActive = true;

    async function refreshPendingMutations() {
      const next = await listPendingGrowthMutations();
      if (isActive) setPendingMutations(next);
    }

    void refreshPendingMutations();
    window.addEventListener("irati-offline-growth-updated", refreshPendingMutations);
    window.addEventListener("irati-offline-sync-updated", refreshPendingMutations);

    return () => {
      isActive = false;
      window.removeEventListener("irati-offline-growth-updated", refreshPendingMutations);
      window.removeEventListener("irati-offline-sync-updated", refreshPendingMutations);
    };
  }, []);

  if (visibleEntries.length === 0 && pendingState.entries.length === 0) {
    return <p className={styles.empty}>Aún no hay medidas registradas.</p>;
  }

  const pendingByEntryId = new Map(
    pendingState.entries.map(({ entry, mutation }) => [entry.id, mutation]),
  );
  const historyEntries = [
    ...visibleEntries,
    ...pendingState.entries.map(({ entry }) => entry),
  ].sort((left, right) => right.measuredOn.localeCompare(left.measuredOn));

  return (
    <>
      <ol className={styles.history}>
        {historyEntries.map((entry) => {
          const mutation = pendingByEntryId.get(entry.id);
          const value = getValue(entry, metric);

          return (
            <li data-pending={mutation ? "true" : undefined} key={mutation?.id ?? entry.id}>
              <div className={styles.historySummary}>
                <div>
                  <strong>{value} cm</strong>
                  <span>
                    {mutation ? `${mutation.lastError ? "Error pendiente" : "Pendiente"} · ` : ""}
                    {formatPlace(entry.place)} ·{" "}
                    <time dateTime={entry.measuredOn}>{formatDate(entry.measuredOn)}</time>
                  </span>
                  {entry.notes ? <span>{entry.notes}</span> : null}
                </div>
              </div>

              {!mutation ? (
                <div className={styles.historyActions}>
                  <button
                    aria-label={`Editar ${getMetricLabel(metric).toLowerCase()} de ${formatDate(entry.measuredOn)}`}
                    className={styles.iconButton}
                    onClick={() => setEditingEntry(entry)}
                    type="button"
                  >
                    <EditIcon />
                  </button>
                  <ConfirmSubmit
                    action={deleteAction}
                    message={`¿Borrar esta ${getMetricLabel(metric).toLowerCase()}? Esta acción no se puede deshacer.`}
                    onConfirmedSubmit={(event) => {
                      if (!navigator.onLine) void deleteEntryOffline(event, entry.id, metric);
                    }}
                  >
                    <input name="id" type="hidden" value={entry.id} />
                    <input name="metric" type="hidden" value={metric} />
                    <PendingSubmitButton
                      aria-label={`Borrar ${getMetricLabel(metric).toLowerCase()} de ${formatDate(entry.measuredOn)}`}
                      className={`${styles.iconButton} ${styles.deleteIconButton}`}
                      pendingAriaLabel="Borrando medida"
                      type="submit"
                    >
                      <TrashIcon />
                    </PendingSubmitButton>
                  </ConfirmSubmit>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {editingEntry ? (
        <BottomSheet
          ariaLabel={`Cerrar edición de ${getMetricLabel(metric).toLowerCase()}`}
          labelledBy="edit-growth-title"
          onClose={() => setEditingEntry(null)}
          styles={styles}
        >
          <form
            action={updateAction}
            className={styles.sheetBody}
            onSubmit={(event) => {
              if (!navigator.onLine)
                void updateEntryOffline(event, editingEntry, metric, () => setEditingEntry(null));
            }}
          >
            <div className={styles.sheetHeader}>
              <p>{getMetricLabel(metric)}</p>
              <h2 id="edit-growth-title">Ajustar {getMetricLabel(metric).toLowerCase()}</h2>
            </div>
            <input name="id" type="hidden" value={editingEntry.id} />
            <input name="metric" type="hidden" value={metric} />
            <GrowthFields entry={editingEntry} metric={metric} />
            <div className={styles.sheetActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => setEditingEntry(null)}
                type="button"
              >
                Cancelar
              </button>
              <PendingSubmitButton className={styles.primaryButton} type="submit">
                Guardar cambios
              </PendingSubmitButton>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </>
  );
}

function GrowthFields({ entry, metric }: { entry?: GrowthEntry; metric: GrowthMetric }) {
  const isHeight = metric === "height";
  const value = entry ? getValue(entry, metric) : "";

  return (
    <div className={styles.sheetFields}>
      <label>
        Fecha
        <input
          defaultValue={entry?.measuredOn ?? undefined}
          name="measuredOn"
          required
          type="date"
        />
      </label>
      <label>
        {isHeight ? "Centímetros" : "Centímetros de perímetro"}
        <input
          defaultValue={value}
          inputMode="numeric"
          max={isHeight ? 150 : 70}
          min="1"
          name={isHeight ? "heightCm" : "headCircumferenceCm"}
          required
          type="number"
        />
      </label>
      <label>
        Lugar
        <select defaultValue={entry?.place ?? "pediatra"} name="place" required>
          <option value="hospital">Hospital</option>
          <option value="pediatra">Pediatra</option>
          <option value="farmacia">Farmacia</option>
        </select>
      </label>
      <label className={styles.full}>
        Notas
        <textarea defaultValue={entry?.notes ?? ""} name="notes" rows={3} />
      </label>
    </div>
  );
}

function buildPendingState(
  mutations: PendingGrowthMutation[],
  metric: GrowthMetric,
): {
  entries: Array<{ entry: GrowthEntry; mutation: PendingGrowthMutation }>;
  hiddenEntryIds: Set<string>;
} {
  const pendingByEntryId = new Map<
    string,
    { entry: GrowthEntry; mutation: PendingGrowthMutation }
  >();
  const hiddenEntryIds = new Set<string>();

  for (const mutation of mutations) {
    if (mutation.operation === "delete") {
      hiddenEntryIds.add(mutation.payload.id);
      pendingByEntryId.delete(mutation.payload.id);
      continue;
    }

    if (mutation.entity === metric && "measuredOn" in mutation.payload) {
      hiddenEntryIds.add(mutation.payload.id);
      pendingByEntryId.set(mutation.payload.id, {
        entry: mutation.payload,
        mutation,
      });
    }
  }

  return { entries: [...pendingByEntryId.values()], hiddenEntryIds };
}

async function updateEntryOffline(
  event: FormEvent<HTMLFormElement>,
  currentEntry: GrowthEntry,
  metric: GrowthMetric,
  onDone: () => void,
) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const place = String(formData.get("place") ?? "");
  if (!isMeasurementPlace(place)) return;

  const entry =
    metric === "height"
      ? {
          id: currentEntry.id,
          ...createHeightEntry({
            measuredOn: String(formData.get("measuredOn") ?? ""),
            heightCm: Number(formData.get("heightCm")),
            notes: String(formData.get("notes") ?? ""),
            place,
          }),
        }
      : {
          id: currentEntry.id,
          ...createHeadCircumferenceEntry({
            measuredOn: String(formData.get("measuredOn") ?? ""),
            headCircumferenceCm: Number(formData.get("headCircumferenceCm")),
            notes: String(formData.get("notes") ?? ""),
            place,
          }),
        };

  await (metric === "height"
    ? applyOfflineHeightEntry(entry as HeightEntry)
    : applyOfflineHeadCircumferenceEntry(entry as HeadCircumferenceEntry));
  await enqueuePendingGrowthMutation({
    id: `growth-update-${metric}-${entry.id}-${Date.now()}`,
    entity: metric,
    operation: "update",
    payload: entry,
  });
  window.dispatchEvent(new Event("irati-offline-growth-updated"));
  window.dispatchEvent(new Event("irati-offline-sync-updated"));
  onDone();
}

async function deleteEntryOffline(
  event: FormEvent<HTMLFormElement>,
  id: string,
  metric: GrowthMetric,
) {
  event.preventDefault();
  await (metric === "height"
    ? deleteOfflineHeightEntry(id)
    : deleteOfflineHeadCircumferenceEntry(id));
  await enqueuePendingGrowthMutation({
    id: `growth-delete-${metric}-${id}-${Date.now()}`,
    entity: metric,
    operation: "delete",
    payload: { id },
  });
  window.dispatchEvent(new Event("irati-offline-growth-updated"));
  window.dispatchEvent(new Event("irati-offline-sync-updated"));
}

function getValue(entry: GrowthEntry, metric: GrowthMetric): number {
  return metric === "height"
    ? (entry as HeightEntry).heightCm
    : (entry as HeadCircumferenceEntry).headCircumferenceCm;
}

function getMetricLabel(metric: GrowthMetric): string {
  return metric === "height" ? "Altura" : "Perímetro craneal";
}

function formatPlace(place: GrowthEntry["place"]): string {
  return place === "pediatra" ? "Pediatra" : place === "hospital" ? "Hospital" : "Farmacia";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function EditIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M4 20h4.8L19.1 9.7a2.1 2.1 0 0 0 0-3L17.3 4.9a2.1 2.1 0 0 0-3 0L4 15.2V20Z" />
      <path d="m13.6 5.6 4.8 4.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M5 7h14M10 4h4l1 3H9l1-3ZM7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}
