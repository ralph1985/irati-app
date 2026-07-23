"use client";

import { FormEvent, useEffect, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import { createWeightEntry, isWeightPlace, WeightEntry } from "../domain/weight-entry";
import {
  applyOfflineWeightEntry,
  deleteOfflineWeightEntry,
  enqueuePendingWeightMutation,
  listPendingWeightMutations,
  PendingWeightMutation,
} from "../../../shared/infrastructure/offline/irati-offline-db";
import styles from "../../../app/(app)/peso/page.module.css";

type WeightHistoryProps = {
  deleteAction: (formData: FormData) => void | Promise<void>;
  entries: WeightEntry[];
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function WeightHistory({ deleteAction, entries, updateAction }: WeightHistoryProps) {
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [pendingMutations, setPendingMutations] = useState<PendingWeightMutation[]>([]);
  const pendingState = buildPendingWeightState(pendingMutations);
  const visibleEntries = entries.filter((entry) => !pendingState.hiddenEntryIds.has(entry.id));

  useEffect(() => {
    let isActive = true;

    async function refreshPendingMutations() {
      const nextPendingMutations = await listPendingWeightMutations();

      if (isActive) {
        setPendingMutations(nextPendingMutations);
      }
    }

    void refreshPendingMutations();
    window.addEventListener("irati-offline-weight-updated", refreshPendingMutations);
    window.addEventListener("irati-offline-sync-updated", refreshPendingMutations);

    return () => {
      isActive = false;
      window.removeEventListener("irati-offline-weight-updated", refreshPendingMutations);
      window.removeEventListener("irati-offline-sync-updated", refreshPendingMutations);
    };
  }, []);

  if (visibleEntries.length === 0 && pendingState.entries.length === 0) {
    return <p className={styles.empty}>Aún no hay pesos en este filtro.</p>;
  }

  function openEditor(entry: WeightEntry) {
    setEditingEntry(entry);
  }

  function closeEditor() {
    setEditingEntry(null);
  }

  return (
    <>
      <ol className={styles.history}>
        {pendingState.entries.map(({ entry, mutation }) => (
          <li data-pending="true" key={mutation.id}>
            <div className={styles.historySummary}>
              <div>
                <strong>{entry.weightGrams.toLocaleString("es-ES")} g</strong>
                <span>
                  {mutation.lastError ? "Error pendiente" : "Pendiente"} ·{" "}
                  {formatPlace(entry.place)} ·{" "}
                  <time dateTime={entry.measuredOn}>{formatDate(entry.measuredOn)}</time>
                </span>
              </div>
            </div>
          </li>
        ))}

        {visibleEntries.map((entry) => (
          <li key={entry.id}>
            <div className={styles.historySummary}>
              <div>
                <strong>{entry.weightGrams.toLocaleString("es-ES")} g</strong>
                <span>
                  {formatPlace(entry.place)} ·{" "}
                  <time dateTime={entry.measuredOn}>{formatDate(entry.measuredOn)}</time>
                </span>
              </div>
            </div>

            <div className={styles.historyActions}>
              <button
                aria-label={`Editar peso de ${formatDate(entry.measuredOn)}`}
                className={styles.iconButton}
                onClick={() => openEditor(entry)}
                type="button"
              >
                <EditIcon />
              </button>

              <form
                action={deleteAction}
                onSubmit={(event) => {
                  if (!confirm("¿Borrar este peso?")) {
                    event.preventDefault();
                    return;
                  }

                  if (!navigator.onLine) {
                    void deleteEntryOffline(event, entry.id);
                  }
                }}
              >
                <input name="id" type="hidden" value={entry.id} />
                <button
                  aria-label={`Borrar peso de ${formatDate(entry.measuredOn)}`}
                  className={`${styles.iconButton} ${styles.deleteIconButton}`}
                  type="submit"
                >
                  <TrashIcon />
                </button>
              </form>
            </div>
          </li>
        ))}
      </ol>

      {editingEntry ? (
        <BottomSheet
          ariaLabel="Cerrar edición de peso"
          labelledBy="edit-weight-title"
          onClose={closeEditor}
          styles={styles}
        >
          <form
            action={updateAction}
            className={styles.sheetBody}
            onSubmit={(event) => {
              if (!navigator.onLine) {
                void updateEntryOffline(event, closeEditor);
              }
            }}
          >
            <div className={styles.sheetHeader}>
              <p>Peso</p>
              <h2 id="edit-weight-title">Ajustar peso</h2>
            </div>

            <input name="id" type="hidden" value={editingEntry.id} />

            <div className={styles.sheetFields}>
              <label>
                Fecha
                <input
                  name="measuredOn"
                  required
                  type="date"
                  defaultValue={editingEntry.measuredOn}
                />
              </label>
              <label>
                Gramos
                <input
                  inputMode="numeric"
                  min="1000"
                  max="20000"
                  name="weightGrams"
                  required
                  type="number"
                  defaultValue={editingEntry.weightGrams}
                />
              </label>
              <label>
                Lugar
                <select name="place" required defaultValue={editingEntry.place}>
                  <option value="hospital">Hospital</option>
                  <option value="pediatra">Pediatra</option>
                  <option value="farmacia">Farmacia</option>
                </select>
              </label>
              <label className={styles.full}>
                Notas
                <textarea name="notes" rows={3} defaultValue={editingEntry.notes ?? ""} />
              </label>
            </div>

            <div className={styles.sheetActions}>
              <button className={styles.secondaryButton} onClick={closeEditor} type="button">
                Cancelar
              </button>
              <button className={styles.primaryButton} type="submit">
                Guardar cambios
              </button>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </>
  );
}

async function updateEntryOffline(event: FormEvent<HTMLFormElement>, onDone: () => void) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const id = String(formData.get("id") ?? "");
  const place = String(formData.get("place") ?? "");

  if (!id || !isWeightPlace(place)) {
    return;
  }

  const entry = {
    id,
    ...createWeightEntry({
      measuredOn: String(formData.get("measuredOn") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      place,
      weightGrams: Number(formData.get("weightGrams")),
    }),
  };

  await applyOfflineWeightEntry(entry);
  await enqueuePendingWeightMutation({
    id: `weight-update-${entry.id}-${Date.now()}`,
    operation: "update",
    payload: entry,
  });
  window.dispatchEvent(new Event("irati-offline-weight-updated"));
  window.dispatchEvent(new Event("irati-offline-sync-updated"));
  onDone();
}

async function deleteEntryOffline(event: FormEvent<HTMLFormElement>, id: string) {
  event.preventDefault();

  await deleteOfflineWeightEntry(id);
  await enqueuePendingWeightMutation({
    id: `weight-delete-${id}-${Date.now()}`,
    operation: "delete",
    payload: { id },
  });
  window.dispatchEvent(new Event("irati-offline-weight-updated"));
  window.dispatchEvent(new Event("irati-offline-sync-updated"));
}

function buildPendingWeightState(mutations: PendingWeightMutation[]): {
  entries: Array<{ entry: WeightEntry; mutation: PendingWeightMutation }>;
  hiddenEntryIds: Set<string>;
} {
  const pendingByEntryId = new Map<
    string,
    { entry: WeightEntry; mutation: PendingWeightMutation }
  >();
  const hiddenEntryIds = new Set<string>();

  for (const mutation of mutations) {
    if (mutation.operation === "delete") {
      hiddenEntryIds.add(mutation.payload.id);
      pendingByEntryId.delete(mutation.payload.id);
      continue;
    }

    if ("measuredOn" in mutation.payload) {
      hiddenEntryIds.add(mutation.payload.id);
      pendingByEntryId.set(mutation.payload.id, {
        entry: mutation.payload,
        mutation,
      });
    }
  }

  return {
    entries: [...pendingByEntryId.values()].sort((left, right) =>
      right.entry.measuredOn.localeCompare(left.entry.measuredOn),
    ),
    hiddenEntryIds,
  };
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
      <path d="M5 7h14" />
      <path d="M9 7V5h6v2" />
      <path d="M8 7v12h8V7" />
      <path d="M10.5 11v5" />
      <path d="M13.5 11v5" />
    </svg>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function formatPlace(place: string): string {
  if (place === "hospital") {
    return "Hospital";
  }

  return place === "pediatra" ? "Pediatra" : "Farmacia";
}
