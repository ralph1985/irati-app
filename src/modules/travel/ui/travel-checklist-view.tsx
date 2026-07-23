"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import {
  calculateTravelChecklistProgress,
  createTravelChecklistItem,
  formatTravelChecklistCategory,
  groupTravelChecklistItems,
  isTravelChecklistCategory,
  travelChecklistCategories,
  TravelChecklistCategory,
  TravelChecklistGroup,
  TravelChecklistItem,
  TravelChecklistProgress,
  updateTravelChecklistItemInput,
} from "../domain/travel-checklist-item";
import { TravelChecklist } from "../application/list-travel-checklist";
import {
  applyOfflineTravelChecklistItem,
  deleteOfflineTravelChecklistItem,
  enqueuePendingTravelMutation,
  listPendingTravelMutations,
  PendingTravelMutation,
  resetOfflineTravelChecklist,
  setOfflineTravelChecklistItemPacked,
} from "../../../shared/infrastructure/offline/irati-offline-db";
import styles from "../../../app/(app)/viaje/page.module.css";

type TravelChecklistViewProps = {
  checklist: TravelChecklist;
  createAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  resetAction: () => void | Promise<void>;
  setPackedAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function TravelChecklistView({
  checklist,
  createAction,
  deleteAction,
  resetAction,
  setPackedAction,
  updateAction,
}: TravelChecklistViewProps) {
  const [sheetState, setSheetState] = useState<SheetState>({ mode: "closed" });
  const [pendingMutations, setPendingMutations] = useState<PendingTravelMutation[]>([]);
  const baseItems = useMemo(() => checklist.groups.flatMap((group) => group.items), [checklist]);
  const visibleChecklist = useMemo(
    () => buildVisibleTravelChecklist(baseItems, pendingMutations),
    [baseItems, pendingMutations],
  );
  const visibleGroups = visibleChecklist.groups.filter((group) => group.items.length > 0);

  useEffect(() => {
    let isActive = true;

    async function refreshPendingMutations() {
      const nextPendingMutations = await listPendingTravelMutations();

      if (isActive) {
        setPendingMutations(nextPendingMutations);
      }
    }

    void refreshPendingMutations();
    window.addEventListener("irati-offline-travel-updated", refreshPendingMutations);
    window.addEventListener("irati-offline-sync-updated", refreshPendingMutations);

    return () => {
      isActive = false;
      window.removeEventListener("irati-offline-travel-updated", refreshPendingMutations);
      window.removeEventListener("irati-offline-sync-updated", refreshPendingMutations);
    };
  }, []);

  async function resetChecklistOffline(event: FormEvent<HTMLFormElement>) {
    if (navigator.onLine) {
      return;
    }

    event.preventDefault();

    await resetOfflineTravelChecklist();
    await enqueuePendingTravelMutation({
      id: `travel-reset-${crypto.randomUUID()}`,
      operation: "reset",
      payload: { resetAt: new Date().toISOString() },
    });
    dispatchOfflineTravelEvents();
  }

  async function createItemOffline(form: HTMLFormElement) {
    const formData = new FormData(form);
    const category = String(formData.get("category") ?? "");

    if (!isTravelChecklistCategory(category)) {
      return;
    }

    const item: TravelChecklistItem = {
      ...createTravelChecklistItem({
        category,
        label: String(formData.get("label") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        sortOrder: getNextOfflineSortOrder(
          visibleChecklist.groups.flatMap((group) => group.items),
          category,
        ),
      }),
      id: crypto.randomUUID(),
      isPacked: false,
    };

    await applyOfflineTravelChecklistItem(item);
    await enqueuePendingTravelMutation({
      id: `travel-create-${item.id}`,
      operation: "create",
      payload: item,
    });
    form.reset();
    setSheetState({ mode: "closed" });
    dispatchOfflineTravelEvents();
  }

  async function updateItemOffline(form: HTMLFormElement) {
    const formData = new FormData(form);
    const category = String(formData.get("category") ?? "");
    const id = String(formData.get("id") ?? "");

    if (!id || !isTravelChecklistCategory(category)) {
      return;
    }

    const item: TravelChecklistItem = {
      id,
      ...updateTravelChecklistItemInput({
        category,
        isPacked: formData.get("isPacked") === "true",
        label: String(formData.get("label") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        sortOrder: Number(formData.get("sortOrder") ?? 0),
      }),
      isPacked: formData.get("isPacked") === "true",
    };

    await applyOfflineTravelChecklistItem(item);
    await enqueuePendingTravelMutation({
      id: `travel-update-${item.id}-${crypto.randomUUID()}`,
      operation: "update",
      payload: item,
    });
    setSheetState({ mode: "closed" });
    dispatchOfflineTravelEvents();
  }

  return (
    <>
      <section className={styles.panel} aria-labelledby="travel-progress-title">
        <div className={styles.sectionTitle}>
          <h2 id="travel-progress-title">Preparado</h2>
          <span>{formatProgress(visibleChecklist.progress)}</span>
        </div>
        <progress
          aria-label="Progreso de la lista"
          max={Math.max(visibleChecklist.progress.total, 1)}
          value={visibleChecklist.progress.packed}
        />
        <div className={styles.actions}>
          <button
            aria-label="Añadir a la lista"
            className={styles.iconCommandButton}
            onClick={() => setSheetState({ mode: "create" })}
            title="Añadir a la lista"
            type="button"
          >
            <span aria-hidden="true">+</span>
          </button>
          <form
            action={resetAction}
            onSubmit={(event) => {
              if (!confirm("¿Reiniciar la lista de viaje?")) {
                event.preventDefault();
                return;
              }

              if (!navigator.onLine) {
                void resetChecklistOffline(event);
              }
            }}
          >
            <button
              aria-label="Reiniciar lista"
              className={styles.iconCommandButton}
              title="Reiniciar lista"
              type="submit"
            >
              <span aria-hidden="true">↺</span>
            </button>
          </form>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="travel-list-title">
        <div className={styles.sectionTitle}>
          <h2 id="travel-list-title">Checklist</h2>
          <span>{visibleChecklist.progress.pending} pendientes</span>
        </div>

        {visibleGroups.length > 0 ? (
          <div className={styles.groups}>
            {visibleGroups.map((group) => (
              <TravelChecklistGroupView
                deleteAction={deleteAction}
                group={group}
                key={group.category}
                openEditSheet={(item) => setSheetState({ item, mode: "edit" })}
                setPackedAction={setPackedAction}
                pendingMutations={pendingMutations}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Aún no hay nada en la lista de viaje.</p>
        )}
      </section>

      <TravelChecklistSheet
        createAction={createAction}
        onClose={() => setSheetState({ mode: "closed" })}
        onOfflineCreate={createItemOffline}
        onOfflineUpdate={updateItemOffline}
        sheetState={sheetState}
        updateAction={updateAction}
      />
    </>
  );
}

function TravelChecklistGroupView({
  deleteAction,
  group,
  openEditSheet,
  pendingMutations,
  setPackedAction,
}: {
  deleteAction: (formData: FormData) => void | Promise<void>;
  group: TravelChecklistGroup;
  openEditSheet: (item: TravelChecklistItem) => void;
  pendingMutations: PendingTravelMutation[];
  setPackedAction: (formData: FormData) => void | Promise<void>;
}) {
  async function setPackedOffline(event: FormEvent<HTMLFormElement>, item: TravelChecklistItem) {
    event.preventDefault();

    const nextPacked = !item.isPacked;

    await setOfflineTravelChecklistItemPacked(item.id, nextPacked);
    await enqueuePendingTravelMutation({
      id: `travel-packed-${item.id}-${crypto.randomUUID()}`,
      operation: "setPacked",
      payload: { id: item.id, isPacked: nextPacked },
    });
    dispatchOfflineTravelEvents();
  }

  async function deleteItemOffline(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();

    await deleteOfflineTravelChecklistItem(id);
    await enqueuePendingTravelMutation({
      id: `travel-delete-${id}-${crypto.randomUUID()}`,
      operation: "delete",
      payload: { id },
    });
    dispatchOfflineTravelEvents();
  }

  return (
    <details className={styles.group} open={group.progress.pending > 0}>
      <summary className={styles.groupHeader}>
        <span className={styles.groupTitle}>{formatTravelChecklistCategory(group.category)}</span>
        <span>{formatProgress(group.progress)}</span>
      </summary>

      <ol className={styles.items}>
        {group.items.map((item) => (
          <li
            data-packed={item.isPacked}
            data-pending={isPendingTravelItem(pendingMutations, item.id)}
            key={item.id}
          >
            <form
              action={setPackedAction}
              className={styles.itemCheck}
              onSubmit={(event) => {
                if (!navigator.onLine) {
                  void setPackedOffline(event, item);
                }
              }}
            >
              <input name="id" type="hidden" value={item.id} />
              <input name="isPacked" type="hidden" value={item.isPacked ? "false" : "true"} />
              <button
                aria-label={item.isPacked ? "Marcar como pendiente" : "Marcar como preparado"}
                aria-pressed={item.isPacked}
                title={item.isPacked ? "Marcar como pendiente" : "Marcar como preparado"}
                type="submit"
              >
                <span aria-hidden="true">{item.isPacked ? "✓" : ""}</span>
              </button>
            </form>

            <div className={styles.itemBody}>
              <strong>{item.label}</strong>
              {item.notes ? <p>{item.notes}</p> : null}
            </div>

            <div className={styles.itemActions}>
              <button
                aria-label={`Editar ${item.label}`}
                className={styles.iconButton}
                onClick={() => openEditSheet(item)}
                title="Editar"
                type="button"
              >
                <span aria-hidden="true">✎</span>
              </button>
              <form
                action={deleteAction}
                onSubmit={(event) => {
                  if (!confirm("¿Borrar este elemento?")) {
                    event.preventDefault();
                    return;
                  }

                  if (!navigator.onLine) {
                    void deleteItemOffline(event, item.id);
                  }
                }}
              >
                <input name="id" type="hidden" value={item.id} />
                <button
                  aria-label={`Borrar ${item.label}`}
                  className={styles.dangerIconButton}
                  title="Borrar"
                  type="submit"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </form>
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}

type SheetState =
  | {
      mode: "closed";
    }
  | {
      mode: "create";
    }
  | {
      item: TravelChecklistItem;
      mode: "edit";
    };

function TravelChecklistSheet({
  createAction,
  onClose,
  onOfflineCreate,
  onOfflineUpdate,
  sheetState,
  updateAction,
}: {
  createAction: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
  onOfflineCreate: (form: HTMLFormElement) => Promise<void>;
  onOfflineUpdate: (form: HTMLFormElement) => Promise<void>;
  sheetState: SheetState;
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  if (sheetState.mode === "closed") {
    return null;
  }

  const isEdit = sheetState.mode === "edit";
  const title = isEdit ? "Editar elemento" : "Añadir a la lista";

  function closeSheet() {
    onClose();
  }

  return (
    <BottomSheet
      ariaLabel="Cerrar lista de viaje"
      labelledBy="travel-sheet-title"
      onClose={closeSheet}
      styles={styles}
    >
      <div className={styles.sheetBody}>
        <div className={styles.sheetHeader}>
          <p>Viaje</p>
          <h2 id="travel-sheet-title">{title}</h2>
        </div>

        <TravelChecklistItemForm
          action={isEdit ? updateAction : createAction}
          defaults={
            isEdit
              ? {
                  id: sheetState.item.id,
                  label: sheetState.item.label,
                  category: sheetState.item.category,
                  sortOrder: sheetState.item.sortOrder,
                  isPacked: sheetState.item.isPacked,
                  notes: sheetState.item.notes ?? "",
                }
              : undefined
          }
          onOfflineSubmit={isEdit ? onOfflineUpdate : onOfflineCreate}
          onCancel={closeSheet}
          submitLabel={isEdit ? "Guardar cambios" : "Añadir"}
        />
      </div>
    </BottomSheet>
  );
}

function TravelChecklistItemForm({
  action,
  defaults,
  onCancel,
  onOfflineSubmit,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: {
    id: string;
    label: string;
    category: TravelChecklistCategory;
    sortOrder: number;
    isPacked: boolean;
    notes: string;
  };
  onCancel: () => void;
  onOfflineSubmit: (form: HTMLFormElement) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form
      action={action}
      className={styles.form}
      onSubmit={(event) => {
        if (!navigator.onLine) {
          event.preventDefault();
          void onOfflineSubmit(event.currentTarget);
        }
      }}
    >
      {defaults ? <input name="id" type="hidden" value={defaults.id} /> : null}
      {defaults ? (
        <>
          <input name="isPacked" type="hidden" value={defaults.isPacked ? "true" : "false"} />
          <input name="sortOrder" type="hidden" value={defaults.sortOrder} />
          <input name="previousCategory" type="hidden" value={defaults.category} />
        </>
      ) : null}

      <label>
        Elemento
        <input maxLength={120} name="label" required defaultValue={defaults?.label ?? ""} />
      </label>

      <label>
        Categoría
        <select name="category" required defaultValue={defaults?.category ?? "cambio"}>
          {travelChecklistCategories.map((category) => (
            <option key={category} value={category}>
              {formatTravelChecklistCategory(category)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.full}>
        Notas
        <textarea name="notes" rows={3} defaultValue={defaults?.notes ?? ""} />
      </label>

      <div className={styles.sheetActions}>
        <button
          aria-label="Cancelar"
          className={styles.secondaryButton}
          onClick={onCancel}
          title="Cancelar"
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
        <button
          aria-label={submitLabel}
          className={styles.primaryButton}
          title={submitLabel}
          type="submit"
        >
          <span aria-hidden="true">✓</span>
        </button>
      </div>
    </form>
  );
}

function formatProgress(progress: TravelChecklistProgress): string {
  if (progress.total === 0) {
    return "0 de 0";
  }

  return `${progress.packed} de ${progress.total}`;
}

function buildVisibleTravelChecklist(
  baseItems: TravelChecklistItem[],
  pendingMutations: PendingTravelMutation[],
): TravelChecklist {
  const itemsById = new Map(baseItems.map((item) => [item.id, item]));

  for (const mutation of pendingMutations) {
    if (mutation.operation === "reset") {
      for (const [id, item] of itemsById) {
        itemsById.set(id, { ...item, isPacked: false });
      }
      continue;
    }

    if (mutation.operation === "delete") {
      if ("id" in mutation.payload) {
        itemsById.delete(mutation.payload.id);
      }
      continue;
    }

    if (mutation.operation === "setPacked") {
      if (!("id" in mutation.payload)) {
        continue;
      }

      const item = itemsById.get(mutation.payload.id);

      if (
        item &&
        "isPacked" in mutation.payload &&
        typeof mutation.payload.isPacked === "boolean"
      ) {
        itemsById.set(item.id, { ...item, isPacked: mutation.payload.isPacked });
      }

      continue;
    }

    if ("label" in mutation.payload) {
      itemsById.set(mutation.payload.id, mutation.payload);
    }
  }

  const items = [...itemsById.values()];

  return {
    groups: groupTravelChecklistItems(items),
    progress: calculateTravelChecklistProgress(items),
  };
}

function getNextOfflineSortOrder(
  items: TravelChecklistItem[],
  category: TravelChecklistCategory,
): number {
  return (
    items
      .filter((item) => item.category === category)
      .reduce((maxSortOrder, item) => Math.max(maxSortOrder, item.sortOrder), 0) + 10
  );
}

function isPendingTravelItem(mutations: PendingTravelMutation[], id: string): boolean {
  return mutations.some((mutation) => "id" in mutation.payload && mutation.payload.id === id);
}

function dispatchOfflineTravelEvents() {
  window.dispatchEvent(new Event("irati-offline-travel-updated"));
  window.dispatchEvent(new Event("irati-offline-sync-updated"));
}
