"use client";

import { KeyboardEvent, PointerEvent, useRef, useState } from "react";
import {
  formatTravelChecklistCategory,
  travelChecklistCategories,
  TravelChecklistCategory,
  TravelChecklistGroup,
  TravelChecklistItem,
  TravelChecklistProgress,
} from "../domain/travel-checklist-item";
import { TravelChecklist } from "../application/list-travel-checklist";
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
  const visibleGroups = checklist.groups.filter((group) => group.items.length > 0);
  const [sheetState, setSheetState] = useState<SheetState>({ mode: "closed" });

  return (
    <>
      <section className={styles.panel} aria-labelledby="travel-progress-title">
        <div className={styles.sectionTitle}>
          <h2 id="travel-progress-title">Preparado</h2>
          <span>{formatProgress(checklist.progress)}</span>
        </div>
        <progress
          aria-label="Progreso de la lista"
          max={Math.max(checklist.progress.total, 1)}
          value={checklist.progress.packed}
        />
        <div className={styles.actions}>
          <button
            aria-label="Añadir item"
            className={styles.iconCommandButton}
            onClick={() => setSheetState({ mode: "create" })}
            title="Añadir item"
            type="button"
          >
            <span aria-hidden="true">+</span>
          </button>
          <form
            action={resetAction}
            onSubmit={(event) => {
              if (!confirm("¿Reiniciar la lista de viaje?")) {
                event.preventDefault();
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
          <span>{checklist.progress.pending} pendientes</span>
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
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Todavia no hay items de viaje.</p>
        )}
      </section>

      <TravelChecklistSheet
        createAction={createAction}
        onClose={() => setSheetState({ mode: "closed" })}
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
  setPackedAction,
}: {
  deleteAction: (formData: FormData) => void | Promise<void>;
  group: TravelChecklistGroup;
  openEditSheet: (item: TravelChecklistItem) => void;
  setPackedAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <details className={styles.group} open={group.progress.pending > 0}>
      <summary className={styles.groupHeader}>
        <span className={styles.groupTitle}>{formatTravelChecklistCategory(group.category)}</span>
        <span>{formatProgress(group.progress)}</span>
      </summary>

      <ol className={styles.items}>
        {group.items.map((item) => (
          <li data-packed={item.isPacked} key={item.id}>
            <form action={setPackedAction} className={styles.itemCheck}>
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
                  if (!confirm("¿Borrar este item?")) {
                    event.preventDefault();
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
  sheetState,
  updateAction,
}: {
  createAction: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
  sheetState: SheetState;
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef<number | null>(null);

  if (sheetState.mode === "closed") {
    return null;
  }

  const isEdit = sheetState.mode === "edit";
  const title = isEdit ? "Editar item" : "Nuevo item";

  function closeSheet() {
    setDragOffset(0);
    dragStartYRef.current = null;
    onClose();
  }

  function handleSheetKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSheet();
    }
  }

  function handleHandleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeSheet();
    }
  }

  function handleDragStart(event: PointerEvent<HTMLDivElement>) {
    dragStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStartYRef.current === null) {
      return;
    }

    setDragOffset(Math.max(0, event.clientY - dragStartYRef.current));
  }

  function handleDragEnd() {
    if (dragOffset > 70) {
      closeSheet();
      return;
    }

    dragStartYRef.current = null;
    setDragOffset(0);
  }

  return (
    <div className={styles.sheetBackdrop} onClick={closeSheet}>
      <section
        aria-labelledby="travel-sheet-title"
        aria-modal="false"
        className={styles.sheet}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleSheetKeyDown}
        role="dialog"
        style={
          {
            "--sheet-drag-offset": `${dragOffset}px`,
          } as React.CSSProperties
        }
      >
        <div
          aria-label="Cerrar panel de viaje"
          className={styles.sheetHandle}
          onKeyDown={handleHandleKeyDown}
          onPointerCancel={handleDragEnd}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          role="button"
          tabIndex={0}
        >
          <span />
        </div>

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
          onCancel={closeSheet}
          submitLabel={isEdit ? "Guardar cambios" : "Guardar item"}
        />
      </section>
    </div>
  );
}

function TravelChecklistItemForm({
  action,
  defaults,
  onCancel,
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
  submitLabel: string;
}) {
  return (
    <form action={action} className={styles.form}>
      {defaults ? <input name="id" type="hidden" value={defaults.id} /> : null}
      {defaults ? (
        <>
          <input name="isPacked" type="hidden" value={defaults.isPacked ? "true" : "false"} />
          <input name="sortOrder" type="hidden" value={defaults.sortOrder} />
          <input name="previousCategory" type="hidden" value={defaults.category} />
        </>
      ) : null}

      <label>
        Item
        <input maxLength={120} name="label" required defaultValue={defaults?.label ?? ""} />
      </label>

      <label>
        Categoria
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
