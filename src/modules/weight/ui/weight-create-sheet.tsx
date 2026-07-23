"use client";

import { FormEvent, ReactNode, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import { createWeightEntry, isWeightPlace } from "../domain/weight-entry";
import {
  applyOfflineWeightEntry,
  enqueuePendingWeightMutation,
} from "../../../shared/infrastructure/offline/irati-offline-db";

type WeightCreateSheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  buttonClassName?: string;
  children?: ReactNode;
  returnTo?: string;
  styles: Record<string, string>;
};

export function WeightCreateSheet({
  action,
  buttonClassName,
  children = "+",
  returnTo,
  styles,
}: WeightCreateSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  function openSheet() {
    setIsOpen(true);
  }

  function closeSheet() {
    setIsOpen(false);
    setOfflineError(null);
  }

  async function submitWeight(event: FormEvent<HTMLFormElement>) {
    if (navigator.onLine) {
      return;
    }

    event.preventDefault();
    setOfflineError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const place = String(formData.get("place") ?? "");

    if (!isWeightPlace(place)) {
      setOfflineError("Revisa el lugar del peso.");
      return;
    }

    try {
      const entry = {
        id: crypto.randomUUID(),
        ...createWeightEntry({
          measuredOn: String(formData.get("measuredOn") ?? ""),
          notes: String(formData.get("notes") ?? ""),
          place,
          weightGrams: Number(formData.get("weightGrams")),
        }),
      };
      const createdAt = new Date().toISOString();

      await applyOfflineWeightEntry(entry);
      await enqueuePendingWeightMutation({
        createdAt,
        id: `weight-create-${entry.id}`,
        operation: "create",
        payload: entry,
      });

      window.dispatchEvent(new Event("irati-offline-weight-updated"));
      window.dispatchEvent(new Event("irati-offline-sync-updated"));
      form.reset();
      closeSheet();
    } catch {
      setOfflineError("No pudimos guardar el peso offline.");
    }
  }

  return (
    <>
      <button
        aria-label="Añadir peso"
        className={buttonClassName ?? styles.floatingAddButton}
        onClick={openSheet}
        type="button"
      >
        {children}
      </button>

      {isOpen ? (
        <BottomSheet
          ariaLabel="Cerrar nuevo peso"
          labelledBy="new-weight-title"
          onClose={closeSheet}
          styles={styles}
        >
          <form action={action} className={styles.sheetBody} onSubmit={submitWeight}>
            <div className={styles.sheetHeader}>
              <p>Peso</p>
              <h2 id="new-weight-title">Añadir peso</h2>
            </div>

            {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}

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

            {offlineError ? <p role="alert">{offlineError}</p> : null}

            <div className={styles.sheetActions}>
              <button className={styles.secondaryButton} onClick={closeSheet} type="button">
                Cancelar
              </button>
              <button className={styles.primaryButton} type="submit">
                Guardar peso
              </button>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </>
  );
}
