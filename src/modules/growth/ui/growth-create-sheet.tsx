"use client";

import { FormEvent, ReactNode, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import { PendingSubmitButton } from "../../../shared/ui/pending-submit-button";
import {
  createHeadCircumferenceEntry,
  createHeightEntry,
  isMeasurementPlace,
  type HeadCircumferenceEntry,
  type HeightEntry,
} from "../domain/growth-entry";
import {
  applyOfflineHeadCircumferenceEntry,
  applyOfflineHeightEntry,
  enqueuePendingGrowthMutation,
} from "../../../shared/infrastructure/offline/irati-offline-db";
import styles from "../../../app/(app)/peso/page.module.css";
import type { GrowthMetric } from "../application/growth-chart-series";

type GrowthCreateSheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  children?: ReactNode;
  metric: GrowthMetric;
};

export function GrowthCreateSheet({ action, children = "+", metric }: GrowthCreateSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [today] = useState(getTodayDateValue);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const label = metric === "height" ? "altura" : "perímetro craneal";

  function closeSheet() {
    setIsOpen(false);
    setOfflineError(null);
  }

  async function submitMeasurement(event: FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return;

    event.preventDefault();
    setOfflineError(null);
    const formData = new FormData(event.currentTarget);
    const place = String(formData.get("place") ?? "");

    if (!isMeasurementPlace(place)) {
      setOfflineError("Revisa el lugar de la medida.");
      return;
    }

    try {
      const entry =
        metric === "height"
          ? {
              id: crypto.randomUUID(),
              ...createHeightEntry({
                measuredOn: String(formData.get("measuredOn") ?? ""),
                heightCm: Number(formData.get("heightCm")),
                notes: String(formData.get("notes") ?? ""),
                place,
              }),
            }
          : {
              id: crypto.randomUUID(),
              ...createHeadCircumferenceEntry({
                measuredOn: String(formData.get("measuredOn") ?? ""),
                headCircumferenceCm: Number(formData.get("headCircumferenceCm")),
                notes: String(formData.get("notes") ?? ""),
                place,
              }),
            };
      const createdAt = new Date().toISOString();

      if (metric === "height") await applyOfflineHeightEntry(entry as HeightEntry);
      else await applyOfflineHeadCircumferenceEntry(entry as HeadCircumferenceEntry);

      await enqueuePendingGrowthMutation({
        createdAt,
        entity: metric,
        id: `growth-create-${metric}-${entry.id}`,
        operation: "create",
        payload: entry,
      });
      window.dispatchEvent(new Event("irati-offline-growth-updated"));
      window.dispatchEvent(new Event("irati-offline-sync-updated"));
      event.currentTarget.reset();
      closeSheet();
    } catch {
      setOfflineError(`No pudimos guardar la ${label} offline.`);
    }
  }

  return (
    <>
      <button
        aria-label={`Añadir ${label}`}
        className={styles.floatingAddButton}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {children}
      </button>
      {isOpen ? (
        <BottomSheet
          ariaLabel={`Cerrar nueva ${label}`}
          labelledBy="new-growth-title"
          onClose={closeSheet}
          styles={styles}
        >
          <form action={action} className={styles.sheetBody} onSubmit={submitMeasurement}>
            <div className={styles.sheetHeader}>
              <p>{metric === "height" ? "Altura" : "Cabeza"}</p>
              <h2 id="new-growth-title">Añadir {label}</h2>
            </div>
            <input name="metric" type="hidden" value={metric} />
            <div className={styles.sheetFields}>
              <label>
                Fecha
                <input defaultValue={today} name="measuredOn" required type="date" />
              </label>
              <label>
                {metric === "height" ? "Centímetros" : "Centímetros de perímetro"}
                <input
                  inputMode="numeric"
                  max={metric === "height" ? 150 : 70}
                  min="1"
                  name={metric === "height" ? "heightCm" : "headCircumferenceCm"}
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
              <PendingSubmitButton className={styles.primaryButton} type="submit">
                Guardar medida
              </PendingSubmitButton>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </>
  );
}

function getTodayDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
