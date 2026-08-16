"use client";

import { FormEvent, type ButtonHTMLAttributes, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
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
  groupTravelChecklistItemsByLocation,
  isTravelChecklistCategory,
  TravelChecklistCategoryDefinition,
  TravelChecklistCategory,
  TravelChecklistGroup,
  TravelChecklistItem,
  TravelChecklistProgress,
  TravelStorageLocation,
  reorderTravelChecklistItems,
  TravelChecklistReorder,
  updateTravelChecklistItemInput,
} from "../domain/travel-checklist-item";
import { TravelChecklist } from "../application/list-travel-checklist";
import {
  applyOfflineTravelChecklistItem,
  applyOfflineTravelChecklistReorder,
  applyOfflineTravelStorageReorder,
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
  reorderStorageAction?: (formData: FormData) => void | Promise<void>;
  createCategoryAction?: (formData: FormData) => void | Promise<void>;
  updateCategoryAction?: (formData: FormData) => void | Promise<void>;
  deleteCategoryAction?: (formData: FormData) => void | Promise<void>;
  createLocationAction?: (formData: FormData) => void | Promise<void>;
  updateLocationAction?: (formData: FormData) => void | Promise<void>;
  deleteLocationAction?: (formData: FormData) => void | Promise<void>;
  showOrganizationPanel?: boolean;
};

type TravelGroupItems = Record<string, string[]>;

export function TravelChecklistView({
  checklist,
  createAction,
  deleteAction,
  resetAction,
  setPackedAction,
  updateAction,
  reorderAction = async () => {},
  reorderStorageAction = async () => {},
  createCategoryAction = async () => {},
  updateCategoryAction = async () => {},
  deleteCategoryAction = async () => {},
  createLocationAction = async () => {},
  updateLocationAction = async () => {},
  deleteLocationAction = async () => {},
  showOrganizationPanel = true,
}: TravelChecklistViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"prepare" | "location">("prepare");
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
      checklist.categories,
    );
  }, [baseItems, checklist.categories, optimisticDeletedIds, optimisticReorder, pendingMutations]);
  const displayedChecklist = useMemo(
    () => buildDisplayedTravelChecklist(visibleChecklist, dragGroupItems),
    [dragGroupItems, visibleChecklist],
  );
  const visibleGroups = displayedChecklist.groups;

  async function refreshAfterAction(
    action: (formData: FormData) => void | Promise<void>,
    formData: FormData,
  ): Promise<void> {
    await action(formData);
    router.refresh();
  }

  async function refreshAfterNoArgAction(action: () => void | Promise<void>): Promise<void> {
    await action();
    router.refresh();
  }

  const createActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(createAction, formData);
  const deleteActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(deleteAction, formData);
  const setPackedActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(setPackedAction, formData);
  const updateActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(updateAction, formData);
  const reorderActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(reorderAction, formData);
  const reorderStorageActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(reorderStorageAction, formData);
  const resetActionWithRefresh = () => refreshAfterNoArgAction(resetAction);
  const createCategoryActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(createCategoryAction, formData);
  const updateCategoryActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(updateCategoryAction, formData);
  const deleteCategoryActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(deleteCategoryAction, formData);
  const createLocationActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(createLocationAction, formData);
  const updateLocationActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(updateLocationAction, formData);
  const deleteLocationActionWithRefresh = (formData: FormData) =>
    refreshAfterAction(deleteLocationAction, formData);

  function handleDeleteOnline(event: FormEvent<HTMLFormElement>, item: TravelChecklistItem) {
    event.preventDefault();
    setOptimisticDeletedIds((current) => new Set(current).add(item.id));
    void deleteActionWithRefresh(new FormData(event.currentTarget));
  }

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
      await reorderActionWithRefresh(formData);
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
    const reorderedItems = checklist.categories.flatMap((category) =>
      (current[category.slug] ?? [])
        .map((id, index) => {
          const item = itemsById.get(id);
          return item ? { ...item, category: category.slug, sortOrder: (index + 1) * 10 } : null;
        })
        .filter((item): item is TravelChecklistItem => item !== null),
    );
    const movedItem = itemsById.get(String(event.operation.source.id));
    const movedPosition = reorderedItems.find((item) => item.id === movedItem?.id);

    if (!movedItem || !movedPosition) {
      return;
    }

    setReorderAnnouncement(
      `${movedItem.label} movido a ${formatTravelChecklistCategory(
        checklist.categories.find((category) => category.slug === movedPosition.category) ?? {
          label: movedPosition.category,
          slug: movedPosition.category,
          sortOrder: 0,
        },
      )}, posición ${movedPosition.sortOrder / 10}.`,
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

    const storageLocationId = String(formData.get("storageLocationId") ?? "") || null;
    const currentItems = visibleChecklist.groups.flatMap((group) => group.items);

    const item: TravelChecklistItem = {
      ...createTravelChecklistItem({
        category,
        label: String(formData.get("label") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        storageLocationId,
        storageSortOrder: getNextOfflineStorageSortOrder(currentItems, storageLocationId),
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
    const position = Number(formData.get("position") ?? 1);

    if (!id || !isTravelChecklistCategory(category)) {
      return;
    }

    const currentItems = visibleChecklist.groups.flatMap((group) => group.items);
    const currentItem = currentItems.find((item) => item.id === id);
    const storageLocationId = String(formData.get("storageLocationId") ?? "") || null;
    const reorderedItems = reorderTravelChecklistItems(
      currentItems,
      id,
      category,
      Math.max(0, position - 1),
      checklist.categories,
    );
    const reorderedItem = reorderedItems.find((item) => item.id === id);
    const item: TravelChecklistItem = {
      id,
      ...updateTravelChecklistItemInput({
        category,
        isPacked: formData.get("isPacked") === "true",
        label: String(formData.get("label") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        storageLocationId,
        storageSortOrder:
          currentItem?.storageLocationId === storageLocationId
            ? (currentItem.storageSortOrder ?? null)
            : getNextOfflineStorageSortOrder(currentItems, storageLocationId),
        sortOrder: reorderedItem?.sortOrder ?? Number(formData.get("sortOrder") ?? 0),
      }),
      isPacked: formData.get("isPacked") === "true",
    };

    await applyOfflineTravelChecklistItem(item);
    await enqueuePendingTravelMutation({
      id: `travel-update-${item.id}-${crypto.randomUUID()}`,
      operation: "update",
      payload: item,
    });
    if (reorderedItems.length > 0) {
      await applyOfflineTravelChecklistReorder(
        reorderedItems.map(({ id: itemId, category: itemCategory, sortOrder }) => ({
          id: itemId,
          category: itemCategory,
          sortOrder,
        })),
      );
      await enqueuePendingTravelMutation({
        id: `travel-reorder-${item.id}-${crypto.randomUUID()}`,
        operation: "reorder",
        payload: reorderedItems.map(({ id: itemId, category: itemCategory, sortOrder }) => ({
          id: itemId,
          category: itemCategory,
          sortOrder,
        })),
      });
    }
    setSheetState({ mode: "closed" });
    dispatchOfflineTravelEvents();
  }

  function getNextOfflineStorageSortOrder(
    items: TravelChecklistItem[],
    storageLocationId: string | null,
  ): number | null {
    if (!storageLocationId) return null;

    return (
      items
        .filter((item) => item.storageLocationId === storageLocationId)
        .reduce((max, item) => Math.max(max, item.storageSortOrder ?? 0), 0) + 10
    );
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
          <div className={styles.modeSwitch} aria-label="Modo de organización" role="group">
            <button
              aria-pressed={viewMode === "prepare"}
              onClick={() => setViewMode("prepare")}
              type="button"
            >
              Preparar
            </button>
            <button
              aria-pressed={viewMode === "location"}
              onClick={() => setViewMode("location")}
              type="button"
            >
              Dónde está
            </button>
          </div>
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
            action={resetActionWithRefresh}
            message="¿Reiniciar la lista de viaje? Se eliminarán los cambios actuales."
            onConfirmedSubmit={(event) => {
              if (!navigator.onLine) {
                void resetChecklistOffline(event);
              }
            }}
          >
            <TravelSubmitButton
              aria-label="Reiniciar lista"
              className={styles.iconCommandButton}
              title="Reiniciar lista"
              type="submit"
            >
              <span aria-hidden="true">↺</span>
            </TravelSubmitButton>
          </ConfirmSubmit>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="travel-list-title">
        <div className={styles.sectionTitle}>
          <h2 id="travel-list-title">Checklist</h2>
          <span>{visibleChecklist.progress.pending} pendientes</span>
        </div>
        <p className={styles.orderHint}>
          {viewMode === "prepare"
            ? "Arrastra desde ⋮⋮ para ordenar o cambiar de sección."
            : "La misma lista, agrupada por bolso y compartimento."}
        </p>
        <p aria-live="polite" className={styles.srOnly} role="status">
          {reorderAnnouncement}
        </p>

        {viewMode === "prepare" && visibleGroups.some((group) => group.items.length > 0) ? (
          <DragDropProvider
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragStart={beginDrag}
          >
            <div className={styles.groups}>
              {visibleGroups.map((group) => (
                <TravelChecklistGroupView
                  deleteAction={deleteActionWithRefresh}
                  group={group}
                  key={group.category.slug}
                  openEditSheet={(item) => setSheetState({ item, mode: "edit" })}
                  openCreateSheet={(category) => setSheetState({ category, mode: "create" })}
                  setPackedAction={setPackedActionWithRefresh}
                  pendingMutations={pendingMutations}
                  onDeleteOnline={handleDeleteOnline}
                />
              ))}
            </div>
          </DragDropProvider>
        ) : viewMode === "location" ? (
          <TravelLocationGroups
            deleteAction={deleteActionWithRefresh}
            groups={groupTravelChecklistItemsByLocation(
              visibleChecklist.groups.flatMap((group) => group.items),
              checklist.locations ?? [],
            )}
            onEdit={(item) => setSheetState({ item, mode: "edit" })}
            onDeleteOnline={handleDeleteOnline}
            pendingMutations={pendingMutations}
            reorderAction={reorderStorageActionWithRefresh}
            setPackedAction={setPackedActionWithRefresh}
          />
        ) : (
          <p className={styles.empty}>Aún no hay nada en la lista de viaje.</p>
        )}
      </section>

      <TravelChecklistSheet
        categories={checklist.categories}
        createAction={createActionWithRefresh}
        items={visibleChecklist.groups.flatMap((group) => group.items)}
        onClose={() => setSheetState({ mode: "closed" })}
        onOfflineCreate={createItemOffline}
        onOfflineUpdate={updateItemOffline}
        sheetState={sheetState}
        updateAction={updateActionWithRefresh}
        locations={checklist.locations ?? []}
      />
      {showOrganizationPanel ? (
        <TravelOrganizationPanel
          categories={checklist.categories}
          locations={checklist.locations ?? []}
          createCategoryAction={createCategoryActionWithRefresh}
          updateCategoryAction={updateCategoryActionWithRefresh}
          deleteCategoryAction={deleteCategoryActionWithRefresh}
          createLocationAction={createLocationActionWithRefresh}
          updateLocationAction={updateLocationActionWithRefresh}
          deleteLocationAction={deleteLocationActionWithRefresh}
        />
      ) : null}
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
  return (
    <details
      className={styles.group}
      data-travel-drop-category={group.category.slug}
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
              openCreateSheet(group.category.slug);
            }}
            title={`Añadir a ${formatTravelChecklistCategory(group.category)}`}
            type="button"
          >
            <span aria-hidden="true">+</span>
          </button>
        </span>
      </summary>

      <TravelChecklistDropZone category={group.category.slug}>
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
            onOfflineDelete={deleteTravelItemOffline}
            onOfflinePacked={setTravelItemPackedOffline}
            packedAction={setPackedAction}
            pending={isPendingTravelItem(pendingMutations, item.id)}
            index={index}
            category={group.category.slug}
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
      <TravelChecklistItemContent
        deleteAction={deleteAction}
        dragHandle={
          <button
            aria-label={`Mover ${item.label}`}
            className={styles.dragHandle}
            ref={handleRef}
            title="Arrastrar para ordenar"
            type="button"
          >
            <span aria-hidden="true">⋮⋮</span>
          </button>
        }
        item={item}
        onDeleteOnline={onDeleteOnline}
        onEdit={onEdit}
        onOfflineDelete={onOfflineDelete}
        onOfflinePacked={onOfflinePacked}
        packedAction={packedAction}
        pending={pending}
      />
    </li>
  );
}

function TravelChecklistItemContent({
  deleteAction,
  dragHandle,
  item,
  onDeleteOnline,
  onEdit,
  onOfflineDelete,
  onOfflinePacked,
  packedAction,
  pending,
}: {
  deleteAction: (formData: FormData) => void | Promise<void>;
  dragHandle?: React.ReactNode;
  item: TravelChecklistItem;
  onDeleteOnline: (event: FormEvent<HTMLFormElement>, item: TravelChecklistItem) => void;
  onEdit: () => void;
  onOfflineDelete: (event: FormEvent<HTMLFormElement>, id: string) => Promise<void>;
  onOfflinePacked: (event: FormEvent<HTMLFormElement>, item: TravelChecklistItem) => Promise<void>;
  packedAction: (formData: FormData) => void | Promise<void>;
  pending: boolean;
}) {
  return (
    <>
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
        <TravelSubmitButton
          aria-label={item.isPacked ? "Marcar como pendiente" : "Marcar como preparado"}
          aria-pressed={item.isPacked}
          title={item.isPacked ? "Marcar como pendiente" : "Marcar como preparado"}
          type="submit"
        >
          <span aria-hidden="true">{item.isPacked ? "✓" : ""}</span>
        </TravelSubmitButton>
      </form>
      <div className={styles.itemBody}>
        <strong>{item.label}</strong>
        {item.notes ? <p>{item.notes}</p> : null}
      </div>
      {dragHandle ?? <span aria-hidden="true" className={styles.dragSpacer} />}
      <div className={styles.itemActions} data-pending={pending}>
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
          <TravelSubmitButton
            aria-label={`Borrar ${item.label}`}
            className={styles.dangerIconButton}
            title="Borrar"
            type="submit"
          >
            <span aria-hidden="true">×</span>
          </TravelSubmitButton>
        </ConfirmSubmit>
      </div>
    </>
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
  categories,
  createAction,
  items,
  onClose,
  onOfflineCreate,
  onOfflineUpdate,
  sheetState,
  updateAction,
  locations,
}: {
  categories: TravelChecklistCategoryDefinition[];
  createAction: (formData: FormData) => void | Promise<void>;
  items: TravelChecklistItem[];
  onClose: () => void;
  onOfflineCreate: (form: HTMLFormElement) => Promise<void>;
  onOfflineUpdate: (form: HTMLFormElement) => Promise<void>;
  sheetState: SheetState;
  updateAction: (formData: FormData) => void | Promise<void>;
  locations: TravelStorageLocation[];
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
                  position: getTravelItemPosition(items, sheetState.item),
                  sortOrder: sheetState.item.sortOrder,
                  isPacked: sheetState.item.isPacked,
                  notes: sheetState.item.notes ?? "",
                  storageLocationId: sheetState.item.storageLocationId ?? null,
                }
              : sheetState.category
                ? { category: sheetState.category }
                : undefined
          }
          onOfflineSubmit={isEdit ? onOfflineUpdate : onOfflineCreate}
          items={items}
          categories={categories}
          locations={locations}
          onCancel={closeSheet}
          submitLabel={isEdit ? "Guardar cambios" : "Añadir"}
        />
      </div>
    </BottomSheet>
  );
}

function TravelChecklistItemForm({
  action,
  categories,
  locations,
  defaults,
  items,
  onCancel,
  onOfflineSubmit,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: TravelChecklistCategoryDefinition[];
  locations: TravelStorageLocation[];
  items: TravelChecklistItem[];
  defaults?: {
    id?: string;
    label?: string;
    category: TravelChecklistCategory;
    position?: number;
    sortOrder?: number;
    isPacked?: boolean;
    notes?: string;
    storageLocationId?: string | null;
  };
  onCancel: () => void;
  onOfflineSubmit: (form: HTMLFormElement) => Promise<void>;
  submitLabel: string;
}) {
  const [category, setCategory] = useState<TravelChecklistCategory>(defaults?.category ?? "cambio");
  const [position, setPosition] = useState(defaults?.position ?? 1);
  const availablePositions =
    items.filter((item) => item.category === category && item.id !== defaults?.id).length +
    (defaults?.id ? 1 : 0);

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
          <input name="position" type="hidden" value={position} />
        </>
      ) : null}

      <label>
        Elemento
        <input maxLength={120} name="label" required defaultValue={defaults?.label ?? ""} />
      </label>

      <label>
        Categoría
        <select
          name="category"
          onChange={(event) => {
            const nextCategory = event.target.value as TravelChecklistCategory;
            setCategory(nextCategory);
            setPosition(
              nextCategory === defaults?.category
                ? (defaults?.position ?? 1)
                : items.filter((item) => item.category === nextCategory).length + 1,
            );
          }}
          required
          value={category}
        >
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {formatTravelChecklistCategory(category)}
            </option>
          ))}
        </select>
      </label>

      {defaults?.id ? (
        <label>
          Posición
          <select
            name="positionSelect"
            onChange={(event) => setPosition(Number(event.target.value))}
            value={Math.min(position, Math.max(availablePositions, 1))}
          >
            {Array.from({ length: Math.max(availablePositions, 1) }, (_, index) => index + 1).map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ),
            )}
          </select>
        </label>
      ) : null}

      <label className={styles.full}>
        Ubicación
        <select name="storageLocationId" defaultValue={defaults?.storageLocationId ?? ""}>
          <option value="">Sin ubicación</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.label}
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
        <TravelSubmitButton
          aria-label={submitLabel}
          className={styles.primaryButton}
          title={submitLabel}
          type="submit"
        >
          <span aria-hidden="true">✓</span>
        </TravelSubmitButton>
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

function TravelSubmitButton({
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  return (
    <button {...props} aria-busy={pending || undefined} disabled={pending || disabled}>
      {pending ? <span aria-hidden="true">…</span> : children}
    </button>
  );
}

async function setTravelItemPackedOffline(
  event: FormEvent<HTMLFormElement>,
  item: TravelChecklistItem,
): Promise<void> {
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

async function deleteTravelItemOffline(
  event: FormEvent<HTMLFormElement>,
  id: string,
): Promise<void> {
  event.preventDefault();

  await deleteOfflineTravelChecklistItem(id);
  await enqueuePendingTravelMutation({
    id: `travel-delete-${id}-${crypto.randomUUID()}`,
    operation: "delete",
    payload: { id },
  });
  dispatchOfflineTravelEvents();
}

function TravelLocationGroups({
  deleteAction,
  groups,
  onDeleteOnline,
  onEdit,
  setPackedAction,
  pendingMutations,
  reorderAction,
}: {
  groups: ReturnType<typeof groupTravelChecklistItemsByLocation>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  onDeleteOnline: (event: FormEvent<HTMLFormElement>, item: TravelChecklistItem) => void;
  onEdit: (item: TravelChecklistItem) => void;
  pendingMutations: PendingTravelMutation[];
  reorderAction: (formData: FormData) => void | Promise<void>;
  setPackedAction: (formData: FormData) => void | Promise<void>;
}) {
  const [dragGroups, setDragGroups] = useState<LocationGroupItems | null>(null);
  const dragGroupsRef = useRef<LocationGroupItems | null>(null);

  if (groups.length === 0) return <p className={styles.empty}>Aún no hay ubicaciones asignadas.</p>;

  const displayedGroups = dragGroups ? buildDisplayedLocationGroups(groups, dragGroups) : groups;

  function beginLocationDrag() {
    const next = createLocationGroupItems(groups);
    dragGroupsRef.current = next;
    setDragGroups(next);
  }

  function handleLocationDragOver(
    event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>["onDragOver"]>>[0],
  ) {
    setDragGroups((current) => {
      if (!current) return current;
      const next = move(current, event);
      dragGroupsRef.current = next;
      return next;
    });
  }

  async function handleLocationDragEnd(
    event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>["onDragEnd"]>>[0],
  ) {
    const current = dragGroupsRef.current;
    dragGroupsRef.current = null;
    setDragGroups(null);

    if (event.canceled || !current || !event.operation.source) return;

    const reorder = Object.entries(current).flatMap(([locationKey, itemIds]) => {
      const storageLocationId = locationKey === UNASSIGNED_LOCATION_KEY ? null : locationKey;
      return itemIds.map((id, index) => ({
        id,
        storageLocationId,
        storageSortOrder: (index + 1) * 10,
      }));
    });

    if (reorder.length === 0) return;

    if (!navigator.onLine) {
      await applyOfflineTravelStorageReorder(reorder);
      await enqueuePendingTravelMutation({
        id: `travel-storage-reorder-${crypto.randomUUID()}`,
        operation: "reorderStorage",
        payload: reorder,
      });
      dispatchOfflineTravelEvents();
      return;
    }

    const formData = new FormData();
    formData.set("items", JSON.stringify(reorder));
    await reorderAction(formData);
  }

  return (
    <DragDropProvider
      onDragEnd={handleLocationDragEnd}
      onDragOver={handleLocationDragOver}
      onDragStart={beginLocationDrag}
    >
      <div className={styles.groups}>
        {displayedGroups.map((group) => {
          const locationKey = group.location?.id ?? UNASSIGNED_LOCATION_KEY;
          return (
            <details className={styles.group} key={locationKey} open>
              <summary className={styles.groupHeader}>
                <span className={styles.groupTitle}>
                  {group.location?.label ?? "Sin ubicación"}
                </span>
                <span>{group.items.length}</span>
              </summary>
              <TravelLocationDropZone locationKey={locationKey}>
                {group.items.map((item, index) => (
                  <TravelStorageItemRow
                    category={locationKey}
                    deleteAction={deleteAction}
                    index={index}
                    item={item}
                    key={item.id}
                    onDeleteOnline={onDeleteOnline}
                    onEdit={() => onEdit(item)}
                    onOfflineDelete={deleteTravelItemOffline}
                    onOfflinePacked={setTravelItemPackedOffline}
                    packedAction={setPackedAction}
                    pending={isPendingTravelItem(pendingMutations, item.id)}
                  />
                ))}
              </TravelLocationDropZone>
            </details>
          );
        })}
      </div>
    </DragDropProvider>
  );
}

const UNASSIGNED_LOCATION_KEY = "unassigned";
type LocationGroupItems = Record<string, string[]>;

function createLocationGroupItems(
  groups: ReturnType<typeof groupTravelChecklistItemsByLocation>,
): LocationGroupItems {
  return Object.fromEntries(
    groups.map((group) => [
      group.location?.id ?? UNASSIGNED_LOCATION_KEY,
      group.items.map((item) => item.id),
    ]),
  );
}

function buildDisplayedLocationGroups(
  groups: ReturnType<typeof groupTravelChecklistItemsByLocation>,
  groupItems: LocationGroupItems,
): ReturnType<typeof groupTravelChecklistItemsByLocation> {
  const itemsById = new Map(groups.flatMap((group) => group.items).map((item) => [item.id, item]));
  return groups.map((group) => {
    const locationKey = group.location?.id ?? UNASSIGNED_LOCATION_KEY;
    return {
      ...group,
      items: (groupItems[locationKey] ?? [])
        .map((id) => itemsById.get(id))
        .filter((item): item is TravelChecklistItem => item !== undefined),
    };
  });
}

function TravelLocationDropZone({
  children,
  locationKey,
}: {
  children: React.ReactNode;
  locationKey: string;
}) {
  const { ref, isDropTarget } = useDroppable({
    accept: "travel-item",
    id: locationKey,
    type: "travel-location",
  });

  return (
    <ol className={styles.items} data-drop-target={isDropTarget} ref={ref}>
      {children}
    </ol>
  );
}

function TravelStorageItemRow({
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
}: React.ComponentProps<typeof TravelChecklistItemRow>) {
  const { handleRef, isDragging, ref } = useSortable({
    accept: "travel-item",
    group: category,
    id: item.id,
    index,
    type: "travel-item",
  });

  return (
    <li data-dragging={isDragging} data-packed={item.isPacked} data-pending={pending} ref={ref}>
      <TravelChecklistItemContent
        deleteAction={deleteAction}
        dragHandle={
          <button
            aria-label={`Mover ${item.label}`}
            className={styles.dragHandle}
            ref={handleRef}
            title="Arrastrar para ordenar"
            type="button"
          >
            <span aria-hidden="true">⋮⋮</span>
          </button>
        }
        item={item}
        onDeleteOnline={onDeleteOnline}
        onEdit={onEdit}
        onOfflineDelete={onOfflineDelete}
        onOfflinePacked={onOfflinePacked}
        packedAction={packedAction}
        pending={pending}
      />
    </li>
  );
}

function TravelOrganizationPanel({
  categories,
  locations,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
}: {
  categories: TravelChecklistCategoryDefinition[];
  locations: TravelStorageLocation[];
  createCategoryAction: (formData: FormData) => void | Promise<void>;
  updateCategoryAction: (formData: FormData) => void | Promise<void>;
  deleteCategoryAction: (formData: FormData) => void | Promise<void>;
  createLocationAction: (formData: FormData) => void | Promise<void>;
  updateLocationAction: (formData: FormData) => void | Promise<void>;
  deleteLocationAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <details className={styles.panel}>
      <summary className={styles.sectionTitle}>
        <h2>Organizar la lista</h2>
        <span>Editar categorías y ubicaciones</span>
      </summary>
      <div className={styles.organizationGrid}>
        <section aria-labelledby="travel-categories-title">
          <h3 id="travel-categories-title">Categorías de preparación</h3>
          {categories.map((category) => (
            <form
              action={updateCategoryAction}
              className={styles.organizationRow}
              key={category.slug}
            >
              <input name="slug" type="hidden" value={category.slug} />
              <input
                aria-label={`Nombre de ${category.label}`}
                maxLength={80}
                name="label"
                required
                defaultValue={category.label}
              />
              <input
                aria-label={`Orden de ${category.label}`}
                min="0"
                name="sortOrder"
                type="number"
                defaultValue={category.sortOrder}
              />
              <TravelSubmitButton title="Guardar categoría" type="submit">
                ✓
              </TravelSubmitButton>
              <ConfirmSubmit
                action={deleteCategoryAction}
                message={`¿Borrar la categoría “${category.label}”? Primero debe estar vacía.`}
              >
                <input name="slug" type="hidden" value={category.slug} />
                <TravelSubmitButton
                  className={styles.dangerIconButton}
                  title="Borrar categoría"
                  type="submit"
                >
                  ×
                </TravelSubmitButton>
              </ConfirmSubmit>
            </form>
          ))}
          <form action={createCategoryAction} className={styles.inlineCreate}>
            <input maxLength={80} name="label" placeholder="Nueva categoría" required />
            <TravelSubmitButton type="submit">Añadir</TravelSubmitButton>
          </form>
        </section>
        <section aria-labelledby="travel-locations-title">
          <h3 id="travel-locations-title">Dónde está guardado</h3>
          {locations.map((location) => (
            <form
              action={updateLocationAction}
              className={styles.organizationRow}
              key={location.id}
            >
              <input name="id" type="hidden" value={location.id} />
              <input
                aria-label={`Nombre de ${location.label}`}
                maxLength={80}
                name="label"
                required
                defaultValue={location.label}
              />
              <select
                aria-label={`Contenedor de ${location.label}`}
                name="parentId"
                defaultValue={location.parentId ?? ""}
              >
                <option value="">Principal</option>
                {locations
                  .filter((candidate) => candidate.id !== location.id)
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.label}
                    </option>
                  ))}
              </select>
              <input
                aria-label={`Orden de ${location.label}`}
                min="0"
                name="sortOrder"
                type="number"
                defaultValue={location.sortOrder}
              />
              <TravelSubmitButton title="Guardar ubicación" type="submit">
                ✓
              </TravelSubmitButton>
              <ConfirmSubmit
                action={deleteLocationAction}
                message={`¿Borrar “${location.label}”? Primero debe estar vacía.`}
              >
                <input name="id" type="hidden" value={location.id} />
                <TravelSubmitButton
                  className={styles.dangerIconButton}
                  title="Borrar ubicación"
                  type="submit"
                >
                  ×
                </TravelSubmitButton>
              </ConfirmSubmit>
            </form>
          ))}
          <form action={createLocationAction} className={styles.inlineCreate}>
            <input
              maxLength={80}
              name="label"
              placeholder="Bolso, bolsa o compartimento"
              required
            />
            <select name="parentId">
              <option value="">Principal</option>
              {locations
                .filter((location) => !location.parentId)
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.label}
                  </option>
                ))}
            </select>
            <input min="0" name="sortOrder" type="number" defaultValue="10" />
            <TravelSubmitButton type="submit">Añadir</TravelSubmitButton>
          </form>
        </section>
      </div>
    </details>
  );
}

function getTravelItemPosition(items: TravelChecklistItem[], item: TravelChecklistItem): number {
  return (
    items
      .filter((candidate) => candidate.category === item.category)
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .findIndex((candidate) => candidate.id === item.id) + 1
  );
}

function createTravelGroupItems(groups: TravelChecklistGroup[]): TravelGroupItems {
  return Object.fromEntries(
    groups.map((group) => [group.category.slug, group.items.map((item) => item.id)]),
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
  const items = checklist.categories.flatMap((category) =>
    (groupItems[category.slug] ?? [])
      .map((id) => itemsById.get(id))
      .filter((item): item is TravelChecklistItem => item !== undefined)
      .map((item, index) => ({
        ...item,
        category: category.slug,
        sortOrder: (index + 1) * 10,
      })),
  );

  return {
    categories: checklist.categories,
    groups: groupTravelChecklistItems(items, checklist.categories),
    progress: calculateTravelChecklistProgress(items),
  };
}

function buildVisibleTravelChecklist(
  baseItems: TravelChecklistItem[],
  pendingMutations: PendingTravelMutation[],
  categories: TravelChecklistCategoryDefinition[],
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

          if (item && "category" in position && "sortOrder" in position) {
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

    if (mutation.operation === "reorderStorage") {
      if (Array.isArray(mutation.payload)) {
        for (const position of mutation.payload) {
          const item = itemsById.get(position.id);

          if (item && "storageLocationId" in position && "storageSortOrder" in position) {
            itemsById.set(item.id, {
              ...item,
              storageLocationId: position.storageLocationId,
              storageSortOrder: position.storageSortOrder,
            });
          }
        }
      }

      continue;
    }

    if (
      "label" in mutation.payload &&
      "category" in mutation.payload &&
      "isPacked" in mutation.payload
    ) {
      itemsById.set(mutation.payload.id, mutation.payload);
    }
  }

  const items = [...itemsById.values()];

  return {
    categories,
    groups: groupTravelChecklistItems(items, categories),
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
