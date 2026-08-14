"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import { ConfirmSubmit } from "../../../shared/ui/confirm-submit";
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
  TravelChecklistReorder,
  updateTravelChecklistItemInput,
} from "../domain/travel-checklist-item";
import { TravelChecklist } from "../application/list-travel-checklist";
import {
  applyOfflineTravelChecklistItem,
  applyOfflineTravelChecklistReorder,
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
  reorderAction?: (formData: FormData) => void | Promise<void>;
};

type TravelGroupItems = Record<TravelChecklistCategory, string[]>;

export function TravelChecklistView({
  checklist,
  createAction,
  deleteAction,
  resetAction,
  setPackedAction,
  updateAction,
  reorderAction = async () => {},
}: TravelChecklistViewProps) {
  const [sheetState, setSheetState] = useState<SheetState>({ mode: "closed" });
  const [pendingMutations, setPendingMutations] = useState<PendingTravelMutation[]>([]);
  const [optimisticDeletedIds, setOptimisticDeletedIds] = useState<Set<string>>(new Set());
  const [optimisticReorder, setOptimisticReorder] = useState<TravelChecklistItem[] | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");
  const [dragGroupItems, setDragGroupItems] = useState<TravelGroupItems | null>(null);
  const dragGroupItemsRef = useRef<TravelGroupItems | null>(null);
  const baseItems = useMemo(() => checklist.groups.flatMap((group) => group.items), [checklist]);
  const visibleChecklist = useMemo(() => {
    const visibleItems = optimisticReorder ?? baseItems;
    return buildVisibleTravelChecklist(
      visibleItems.filter((item) => !optimisticDeletedIds.has(item.id)),
      pendingMutations,
    );
  }, [baseItems, optimisticDeletedIds, optimisticReorder, pendingMutations]);
  const displayedChecklist = useMemo(
    () => buildDisplayedTravelChecklist(visibleChecklist, dragGroupItems),
    [dragGroupItems, visibleChecklist],
  );
  const visibleGroups = displayedChecklist.groups;

  useEffect(() => {
    let isActive = true;

    async function refreshPendingMutations() {
      const nextPendingMutations = await listPendingTravelMutations();

      if (isActive) {
        setPendingMutations(nextPendingMutations);
        if (!nextPendingMutations.some((mutation) => mutation.operation === "reorder")) {
          setOptimisticReorder(null);
        }
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

  async function commitReorder(
    items: TravelChecklistItem[],
    reorder: TravelChecklistReorder[],
  ): Promise<void> {
    setOptimisticReorder(items);

    if (!navigator.onLine) {
      await applyOfflineTravelChecklistReorder(reorder);
      await enqueuePendingTravelMutation({
        id: `travel-reorder-${crypto.randomUUID()}`,
        operation: "reorder",
        payload: reorder,
      });
      dispatchOfflineTravelEvents();
      return;
    }

    const formData = new FormData();
    formData.set("items", JSON.stringify(reorder));

    try {
      await reorderAction(formData);
      setOptimisticReorder(null);
    } catch {
      setOptimisticReorder(null);
    }
  }

  function beginDrag() {
    const next = createTravelGroupItems(visibleChecklist.groups);
    dragGroupItemsRef.current = next;
    setDragGroupItems(next);
  }

  function handleDragOver(
    event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>["onDragOver"]>>[0],
  ) {
    setDragGroupItems((current) => {
      if (!current) {
        return current;
      }

      const next = move(current, event);
      dragGroupItemsRef.current = next;
      return next;
    });
  }

  function handleDragEnd(
    event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>["onDragEnd"]>>[0],
  ) {
    const current = dragGroupItemsRef.current;
    dragGroupItemsRef.current = null;
    setDragGroupItems(null);

    if (event.canceled || !current || !event.operation.source) {
      return;
    }

    const itemsById = new Map(
      visibleChecklist.groups.flatMap((group) => group.items).map((item) => [item.id, item]),
    );
    const reorderedItems = travelChecklistCategories.flatMap((category) =>
      current[category]
        .map((id, index) => {
          const item = itemsById.get(id);
          return item ? { ...item, category, sortOrder: (index + 1) * 10 } : null;
        })
        .filter((item): item is TravelChecklistItem => item !== null),
    );
    const movedItem = itemsById.get(String(event.operation.source.id));
    const movedPosition = reorderedItems.find((item) => item.id === movedItem?.id);

    if (!movedItem || !movedPosition) {
      return;
    }

    setReorderAnnouncement(
      `${movedItem.label} movido a ${formatTravelChecklistCategory(movedPosition.category)}, posición ${movedPosition.sortOrder / 10}.`,
    );
    void commitReorder(
      reorderedItems,
      reorderedItems.map(({ id, category, sortOrder }) => ({ id, category, sortOrder })),
    );
  }

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
          <ConfirmSubmit
            action={resetAction}
            message="¿Reiniciar la lista de viaje? Se eliminarán los cambios actuales."
            onConfirmedSubmit={(event) => {
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
          </ConfirmSubmit>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="travel-list-title">
        <div className={styles.sectionTitle}>
          <h2 id="travel-list-title">Checklist</h2>
          <span>{visibleChecklist.progress.pending} pendientes</span>
        </div>
        <p className={styles.orderHint}>Arrastra desde ⋮⋮ para ordenar o cambiar de sección.</p>
        <p aria-live="polite" className={styles.srOnly} role="status">
          {reorderAnnouncement}
        </p>

        {visibleGroups.some((group) => group.items.length > 0) ? (
          <DragDropProvider
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragStart={beginDrag}
          >
            <div className={styles.groups}>
              {visibleGroups.map((group) => (
                <TravelChecklistGroupView
                  deleteAction={deleteAction}
                  group={group}
                  key={group.category}
                  openEditSheet={(item) => setSheetState({ item, mode: "edit" })}
                  openCreateSheet={(category) => setSheetState({ category, mode: "create" })}
                  setPackedAction={setPackedAction}
                  pendingMutations={pendingMutations}
                  onDeleteOnline={async (event, item) => {
                    event.preventDefault();
                    setOptimisticDeletedIds((current) => new Set(current).add(item.id));
                    await deleteAction(new FormData(event.currentTarget));
                  }}
                />
              ))}
            </div>
          </DragDropProvider>
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
  openCreateSheet,
  pendingMutations,
  setPackedAction,
  onDeleteOnline,
}: {
  deleteAction: (formData: FormData) => void | Promise<void>;
  group: TravelChecklistGroup;
  openEditSheet: (item: TravelChecklistItem) => void;
  openCreateSheet: (category: TravelChecklistCategory) => void;
  pendingMutations: PendingTravelMutation[];
  setPackedAction: (formData: FormData) => void | Promise<void>;
  onDeleteOnline: (event: FormEvent<HTMLFormElement>, item: TravelChecklistItem) => void;
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
    <details
      className={styles.group}
      data-travel-drop-category={group.category}
      open={group.progress.pending > 0}
    >
      <summary className={styles.groupHeader}>
        <span className={styles.groupTitle}>{formatTravelChecklistCategory(group.category)}</span>
        <span className={styles.groupMeta}>
          {formatProgress(group.progress)}
          <button
            aria-label={`Añadir a ${formatTravelChecklistCategory(group.category)}`}
            className={styles.groupAddButton}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openCreateSheet(group.category);
            }}
            title={`Añadir a ${formatTravelChecklistCategory(group.category)}`}
            type="button"
          >
            <span aria-hidden="true">+</span>
          </button>
        </span>
      </summary>

      <TravelChecklistDropZone category={group.category}>
        {group.items.length === 0 ? (
          <li className={styles.emptyGroupDrop}>Arrastra aquí un elemento.</li>
        ) : null}
        {group.items.map((item, index) => (
          <TravelChecklistItemRow
            deleteAction={deleteAction}
            item={item}
            key={item.id}
            onDeleteOnline={onDeleteOnline}
            onEdit={() => openEditSheet(item)}
            onOfflineDelete={deleteItemOffline}
            onOfflinePacked={setPackedOffline}
            packedAction={setPackedAction}
            pending={isPendingTravelItem(pendingMutations, item.id)}
            index={index}
            category={group.category}
          />
        ))}
      </TravelChecklistDropZone>
    </details>
  );
}

function TravelChecklistDropZone({
  category,
  children,
}: {
  category: TravelChecklistCategory;
  children: React.ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({
    accept: "travel-item",
    id: category,
    type: "travel-category",
  });

  return (
    <ol className={styles.items} data-drop-target={isDropTarget} ref={ref}>
      {children}
    </ol>
  );
}

function TravelChecklistItemRow({
  category,
  deleteAction,
  index,
  item,
  onDeleteOnline,
  onEdit,
  onOfflineDelete,
  onOfflinePacked,
  packedAction,
  pending,
}: {
  category: TravelChecklistCategory;
  deleteAction: (formData: FormData) => void | Promise<void>;
  index: number;
  item: TravelChecklistItem;
  onDeleteOnline: (event: FormEvent<HTMLFormElement>, item: TravelChecklistItem) => void;
  onEdit: () => void;
  onOfflineDelete: (event: FormEvent<HTMLFormElement>, id: string) => Promise<void>;
  onOfflinePacked: (event: FormEvent<HTMLFormElement>, item: TravelChecklistItem) => Promise<void>;
  packedAction: (formData: FormData) => void | Promise<void>;
  pending: boolean;
}) {
  const { handleRef, isDragging, ref } = useSortable({
    accept: "travel-item",
    group: category,
    id: item.id,
    index,
    type: "travel-item",
  });

  return (
    <li
      data-dragging={isDragging}
      data-packed={item.isPacked}
      data-pending={pending}
      data-travel-item-id={item.id}
      ref={ref}
    >
      <form
        action={packedAction}
        className={styles.itemCheck}
        onSubmit={(event) => {
          if (!navigator.onLine) {
            void onOfflinePacked(event, item);
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

      <button
        aria-label={`Mover ${item.label}`}
        className={styles.dragHandle}
        ref={handleRef}
        title="Arrastrar para ordenar"
        type="button"
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>

      <div className={styles.itemActions}>
        <button
          aria-label={`Editar ${item.label}`}
          className={styles.iconButton}
          onClick={onEdit}
          title="Editar"
          type="button"
        >
          <span aria-hidden="true">✎</span>
        </button>
        <ConfirmSubmit
          action={deleteAction}
          message={`¿Borrar “${item.label}”? Esta acción no se puede deshacer.`}
          onConfirmedSubmit={(event) => {
            if (!navigator.onLine) {
              void onOfflineDelete(event, item.id);
              return;
            }

            onDeleteOnline(event, item);
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
        </ConfirmSubmit>
      </div>
    </li>
  );
}

type SheetState =
  | {
      mode: "closed";
    }
  | {
      category?: TravelChecklistCategory;
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
              : sheetState.category
                ? { category: sheetState.category }
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
    id?: string;
    label?: string;
    category: TravelChecklistCategory;
    sortOrder?: number;
    isPacked?: boolean;
    notes?: string;
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
      {defaults?.id ? <input name="id" type="hidden" value={defaults.id} /> : null}
      {defaults?.id ? (
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

function createTravelGroupItems(groups: TravelChecklistGroup[]): TravelGroupItems {
  return Object.fromEntries(
    groups.map((group) => [group.category, group.items.map((item) => item.id)]),
  ) as TravelGroupItems;
}

function buildDisplayedTravelChecklist(
  checklist: TravelChecklist,
  groupItems: TravelGroupItems | null,
): TravelChecklist {
  if (!groupItems) {
    return checklist;
  }

  const itemsById = new Map(
    checklist.groups.flatMap((group) => group.items).map((item) => [item.id, item]),
  );
  const items = travelChecklistCategories.flatMap((category) =>
    groupItems[category]
      .map((id) => itemsById.get(id))
      .filter((item): item is TravelChecklistItem => item !== undefined)
      .map((item, index) => ({ ...item, category, sortOrder: (index + 1) * 10 })),
  );

  return {
    groups: groupTravelChecklistItems(items),
    progress: calculateTravelChecklistProgress(items),
  };
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

    if (mutation.operation === "reorder") {
      if (Array.isArray(mutation.payload)) {
        for (const position of mutation.payload) {
          const item = itemsById.get(position.id);

          if (item) {
            itemsById.set(item.id, {
              ...item,
              category: position.category,
              sortOrder: position.sortOrder,
            });
          }
        }
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
