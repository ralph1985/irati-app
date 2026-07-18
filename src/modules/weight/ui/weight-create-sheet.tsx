"use client";

import { KeyboardEvent, PointerEvent, useRef, useState } from "react";

type WeightCreateSheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  styles: Record<string, string>;
};

export function WeightCreateSheet({ action, styles }: WeightCreateSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef<number | null>(null);

  function openSheet() {
    setDragOffset(0);
    setIsOpen(true);
  }

  function closeSheet() {
    setDragOffset(0);
    dragStartYRef.current = null;
    setIsOpen(false);
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
    <>
      <button
        aria-label="Añadir peso"
        className={styles.floatingAddButton}
        onClick={openSheet}
        type="button"
      >
        +
      </button>

      {isOpen ? (
        <div className={styles.sheetBackdrop} onClick={closeSheet}>
          <form
            action={action}
            aria-labelledby="new-weight-title"
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
              aria-label="Cerrar panel de peso"
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
              <h2 id="new-weight-title">Nuevo peso</h2>
            </div>

            <div className={styles.sheetFields}>
              <label>
                Fecha
                <input name="measuredOn" required type="date" />
              </label>

              <label>
                Gramos
                <input
                  inputMode="numeric"
                  max="20000"
                  min="1000"
                  name="weightGrams"
                  required
                  type="number"
                />
              </label>

              <label>
                Lugar
                <select defaultValue="pediatra" name="place" required>
                  <option value="hospital">Hospital</option>
                  <option value="pediatra">Pediatra</option>
                  <option value="farmacia">Farmacia</option>
                </select>
              </label>

              <label className={styles.full}>
                Notas
                <textarea name="notes" rows={3} />
              </label>
            </div>

            <div className={styles.sheetActions}>
              <button className={styles.secondaryButton} onClick={closeSheet} type="button">
                Cancelar
              </button>
              <button className={styles.primaryButton} type="submit">
                Guardar peso
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
