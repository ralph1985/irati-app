"use client";

import { WeightEntry } from "../domain/weight-entry";
import styles from "../../../app/(app)/peso/page.module.css";

type WeightHistoryProps = {
  deleteAction: (formData: FormData) => void | Promise<void>;
  entries: WeightEntry[];
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function WeightHistory({ deleteAction, entries, updateAction }: WeightHistoryProps) {
  if (entries.length === 0) {
    return <p className={styles.empty}>Todavia no hay pesos registrados.</p>;
  }

  return (
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

          <details className={styles.editor}>
            <summary>Editar</summary>
            <form action={updateAction}>
              <input name="id" type="hidden" value={entry.id} />
              <label>
                Fecha
                <input name="measuredOn" required type="date" defaultValue={entry.measuredOn} />
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
                  defaultValue={entry.weightGrams}
                />
              </label>
              <label>
                Lugar
                <select name="place" required defaultValue={entry.place}>
                  <option value="hospital">Hospital</option>
                  <option value="pediatra">Pediatra</option>
                  <option value="farmacia">Farmacia</option>
                </select>
              </label>
              <label className={styles.full}>
                Notas
                <textarea name="notes" rows={3} defaultValue={entry.notes ?? ""} />
              </label>
              <button type="submit">Guardar cambios</button>
            </form>
          </details>

          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!confirm("¿Borrar este peso?")) {
                event.preventDefault();
              }
            }}
          >
            <input name="id" type="hidden" value={entry.id} />
            <button className={styles.deleteButton} type="submit">
              Borrar
            </button>
          </form>
        </li>
      ))}
    </ol>
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
