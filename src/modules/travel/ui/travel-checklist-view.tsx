"use client";

import {
  formatTravelChecklistCategory,
  travelChecklistCategories,
  TravelChecklistCategory,
  TravelChecklistGroup,
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
          <details className={styles.createBox}>
            <summary>Añadir item</summary>
            <TravelChecklistItemForm action={createAction} submitLabel="Guardar item" />
          </details>
          <form
            action={resetAction}
            onSubmit={(event) => {
              if (!confirm("¿Reiniciar la lista de viaje?")) {
                event.preventDefault();
              }
            }}
          >
            <button className={styles.secondaryButton} type="submit">
              Reiniciar lista
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
                setPackedAction={setPackedAction}
                updateAction={updateAction}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Todavia no hay items de viaje.</p>
        )}
      </section>
    </>
  );
}

function TravelChecklistGroupView({
  deleteAction,
  group,
  setPackedAction,
  updateAction,
}: {
  deleteAction: (formData: FormData) => void | Promise<void>;
  group: TravelChecklistGroup;
  setPackedAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <article className={styles.group}>
      <div className={styles.groupHeader}>
        <h3>{formatTravelChecklistCategory(group.category)}</h3>
        <span>{formatProgress(group.progress)}</span>
      </div>

      <ol className={styles.items}>
        {group.items.map((item) => (
          <li data-packed={item.isPacked} key={item.id}>
            <form action={setPackedAction} className={styles.itemCheck}>
              <input name="id" type="hidden" value={item.id} />
              <input name="isPacked" type="hidden" value={item.isPacked ? "false" : "true"} />
              <button aria-pressed={item.isPacked} type="submit">
                <span aria-hidden="true">{item.isPacked ? "✓" : ""}</span>
                {item.isPacked ? "Preparado" : "Pendiente"}
              </button>
            </form>

            <div className={styles.itemBody}>
              <strong>{item.label}</strong>
              {item.notes ? <p>{item.notes}</p> : null}
            </div>

            <details className={styles.editor}>
              <summary>Editar</summary>
              <TravelChecklistItemForm
                action={updateAction}
                defaults={{
                  id: item.id,
                  label: item.label,
                  category: item.category,
                  sortOrder: item.sortOrder,
                  isPacked: item.isPacked,
                  notes: item.notes ?? "",
                }}
                submitLabel="Guardar cambios"
              />
            </details>

            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (!confirm("¿Borrar este item?")) {
                  event.preventDefault();
                }
              }}
            >
              <input name="id" type="hidden" value={item.id} />
              <button className={styles.deleteButton} type="submit">
                Borrar
              </button>
            </form>
          </li>
        ))}
      </ol>
    </article>
  );
}

function TravelChecklistItemForm({
  action,
  defaults,
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
  submitLabel: string;
}) {
  return (
    <form action={action} className={styles.form}>
      {defaults ? <input name="id" type="hidden" value={defaults.id} /> : null}
      {defaults ? (
        <input name="isPacked" type="hidden" value={defaults.isPacked ? "true" : "false"} />
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

      <label>
        Orden
        <input
          inputMode="numeric"
          min="0"
          max="10000"
          name="sortOrder"
          required
          type="number"
          defaultValue={defaults?.sortOrder ?? 1000}
        />
      </label>

      <label className={styles.full}>
        Notas
        <textarea name="notes" rows={3} defaultValue={defaults?.notes ?? ""} />
      </label>

      <button className={styles.primaryButton} type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

function formatProgress(progress: TravelChecklistProgress): string {
  if (progress.total === 0) {
    return "0 de 0";
  }

  return `${progress.packed} de ${progress.total}`;
}
