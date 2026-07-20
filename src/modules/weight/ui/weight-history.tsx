"use client";

import { KeyboardEvent, PointerEvent, useRef, useState } from "react";
import { WeightEntry } from "../domain/weight-entry";
import styles from "../../../app/(app)/peso/page.module.css";

type WeightHistoryProps = {
  deleteAction: (formData: FormData) => void | Promise<void>;
  entries: WeightEntry[];
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function WeightHistory({ deleteAction, entries, updateAction }: WeightHistoryProps) {
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef<number | null>(null);

  if (entries.length === 0) {
    return <p className={styles.empty}>Todavia no hay pesos registrados.</p>;
  }

  function openEditor(entry: WeightEntry) {
    setDragOffset(0);
    setEditingEntry(entry);
  }

  function closeEditor() {
    setDragOffset(0);
    dragStartYRef.current = null;
    setEditingEntry(null);
  }

  function handleSheetKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeEditor();
    }
  }

  function handleHandleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeEditor();
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
      closeEditor();
      return;
    }

    dragStartYRef.current = null;
    setDragOffset(0);
  }

  return (
    <>
      <ol className={styles.history}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <div className={styles.historySummary}>
              <div>
                <strong>{entry.weightGrams.toLocaleString("es-ES")} g</strong>
                <span>{formatPlace(entry.place)}</span>
              </div>
              <time dateTime={entry.measuredOn}>{formatDate(entry.measuredOn)}</time>
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
        <div className={styles.sheetBackdrop} onClick={closeEditor}>
          <form
            action={updateAction}
            aria-labelledby="edit-weight-title"
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
              aria-label="Cerrar panel de edicion de peso"
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
              <p>Peso</p>
              <h2 id="edit-weight-title">Editar peso</h2>
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
        </div>
      ) : null}
    </>
  );
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
