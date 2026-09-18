"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TravelChecklist } from "../application/list-travel-checklist";
import {
  TravelChecklistCategoryDefinition,
  TravelStorageLocation,
} from "../domain/travel-checklist-item";
import styles from "../../../app/(app)/viaje/organizar/page.module.css";

type Action = (formData: FormData) => void | Promise<void>;

type TravelOrganizationViewProps = {
  checklist: TravelChecklist;
  createCategoryAction: Action;
  updateCategoryAction: Action;
  deleteCategoryAction: Action;
  reorderCategoryAction: Action;
  createLocationAction: Action;
  updateLocationAction: Action;
  deleteLocationAction: Action;
  reorderLocationAction: Action;
};

type EditorState =
  | { kind: "category"; id: string | null }
  | { kind: "location"; id: string | null; parentId: string | null }
  | null;

type DragState =
  { kind: "category"; id: string } | { kind: "location"; id: string; parentKey: string } | null;

const ROOT_KEY = "root";

export function TravelOrganizationView({
  checklist,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  reorderCategoryAction,
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
  reorderLocationAction,
}: TravelOrganizationViewProps) {
  const router = useRouter();
  const [editor, setEditor] = useState<EditorState>(null);
  const [label, setLabel] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [dragState, setDragState] = useState<DragState>(null);
  const [categoryOrderState, setCategoryOrder] = useState(() =>
    [...checklist.categories].sort(compareSortOrder).map((category) => category.slug),
  );
  const [locationOrderState, setLocationOrders] = useState(() =>
    buildLocationOrders(checklist.locations ?? []),
  );

  const items = useMemo(() => checklist.groups.flatMap((group) => group.items), [checklist.groups]);
  const categoryBySlug = useMemo(
    () => new Map(checklist.categories.map((category) => [category.slug, category])),
    [checklist.categories],
  );
  const locationById = useMemo(
    () => new Map((checklist.locations ?? []).map((location) => [location.id, location])),
    [checklist.locations],
  );
  const childrenByParent = useMemo(() => {
    const result = new Map<string | null, TravelStorageLocation[]>();
    for (const location of checklist.locations ?? []) {
      const siblings = result.get(location.parentId) ?? [];
      siblings.push(location);
      result.set(location.parentId, siblings);
    }
    for (const siblings of result.values()) siblings.sort(compareSortOrder);
    return result;
  }, [checklist.locations]);
  const categoryItemCounts = useMemo(() => countBy(items, (item) => item.category), [items]);
  const locationItemCounts = useMemo(
    () => countBy(items, (item) => item.storageLocationId ?? ""),
    [items],
  );
  const selectedLocation =
    editor?.kind === "location" && editor.id ? locationById.get(editor.id) : undefined;
  const categoryOrder = isCompleteOrder(
    categoryOrderState,
    checklist.categories.map((category) => category.slug),
  )
    ? categoryOrderState
    : [...checklist.categories].sort(compareSortOrder).map((category) => category.slug);
  const expectedLocationOrders = buildLocationOrders(checklist.locations ?? []);
  const locationOrders = isCompleteLocationOrder(locationOrderState, expectedLocationOrders)
    ? locationOrderState
    : expectedLocationOrders;

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  function openCategoryEditor(category?: TravelChecklistCategoryDefinition) {
    if (!online) return;
    setEditor({ kind: "category", id: category?.slug ?? null });
    setLabel(category?.label ?? "");
  }

  function openLocationEditor(
    location?: TravelStorageLocation,
    initialParentId: string | null = null,
  ) {
    if (!online) return;
    setEditor({
      kind: "location",
      id: location?.id ?? null,
      parentId: location?.parentId ?? initialParentId,
    });
    setLabel(location?.label ?? "");
    setParentId(location?.parentId ?? initialParentId);
  }

  async function saveEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online || !editor || !label.trim()) return;
    setIsSaving(true);
    const formData = new FormData();
    formData.set("label", label.trim());
    formData.set("returnTo", "/viaje/organizar");

    if (editor.kind === "category") {
      if (editor.id) {
        formData.set("slug", editor.id);
        formData.set("sortOrder", String((categoryOrder.indexOf(editor.id) + 1) * 10));
        await updateCategoryAction(formData);
      } else {
        await createCategoryAction(formData);
      }
    } else if (editor.id) {
      formData.set("id", editor.id);
      formData.set("parentId", parentId ?? "");
      formData.set("sortOrder", String(selectedLocation?.sortOrder ?? 10));
      await updateLocationAction(formData);
    } else {
      formData.set("parentId", parentId ?? "");
      formData.set("sortOrder", String(nextLocationSortOrder(parentId, childrenByParent)));
      await createLocationAction(formData);
    }

    setIsSaving(false);
    setEditor(null);
    router.refresh();
  }

  async function deleteCategory(category: TravelChecklistCategoryDefinition) {
    if (!online || (categoryItemCounts[category.slug] ?? 0) > 0) return;
    if (!window.confirm(`¿Borrar la categoría “${category.label}”?`)) return;
    const formData = new FormData();
    formData.set("slug", category.slug);
    formData.set("returnTo", "/viaje/organizar");
    await deleteCategoryAction(formData);
    router.refresh();
  }

  async function deleteLocation(location: TravelStorageLocation) {
    const itemCount = locationItemCounts[location.id] ?? 0;
    const childCount = childrenByParent.get(location.id)?.length ?? 0;
    if (!online || itemCount > 0 || childCount > 0) return;
    if (!window.confirm(`¿Borrar “${location.label}”?`)) return;
    const formData = new FormData();
    formData.set("id", location.id);
    formData.set("returnTo", "/viaje/organizar");
    await deleteLocationAction(formData);
    router.refresh();
  }

  async function persistCategoryOrder(nextOrder: string[]) {
    if (!online || nextOrder.join("|") === categoryOrder.join("|")) return;
    setCategoryOrder(nextOrder);
    setBusyOrder("categories");
    const formData = new FormData();
    formData.set("slugs", JSON.stringify(nextOrder));
    await reorderCategoryAction(formData);
    setBusyOrder(null);
    router.refresh();
  }

  async function persistLocationOrder(parentKey: string, nextOrder: string[]) {
    const currentOrder = locationOrders[parentKey] ?? [];
    if (!online || nextOrder.join("|") === currentOrder.join("|")) return;
    setLocationOrders((current) => ({ ...current, [parentKey]: nextOrder }));
    setBusyOrder(parentKey);
    const formData = new FormData();
    formData.set("parentId", parentKey === ROOT_KEY ? "" : parentKey);
    formData.set("ids", JSON.stringify(nextOrder));
    await reorderLocationAction(formData);
    setBusyOrder(null);
    router.refresh();
  }

  function moveCategoryBy(categoryId: string, delta: -1 | 1) {
    const index = categoryOrder.indexOf(categoryId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= categoryOrder.length) return;
    const next = [...categoryOrder];
    [next[index], next[target]] = [next[target], next[index]];
    void persistCategoryOrder(next);
  }

  function moveLocationBy(parentKey: string, locationId: string, delta: -1 | 1) {
    const current = locationOrders[parentKey] ?? [];
    const index = current.indexOf(locationId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= current.length) return;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    void persistLocationOrder(parentKey, next);
  }

  function renderLocationBranch(parentIdForBranch: string | null, depth: number): React.ReactNode {
    const parentKey = parentIdForBranch ?? ROOT_KEY;
    const order =
      locationOrders[parentKey] ??
      (childrenByParent.get(parentIdForBranch) ?? []).map((location) => location.id);
    if (order.length === 0) return null;

    return (
      <ol
        aria-label={parentIdForBranch ? "Compartimentos" : "Ubicaciones principales"}
        className={styles.locationTree}
      >
        {order.map((locationId, index) => {
          const location = locationById.get(locationId);
          if (!location) return null;
          const itemCount = locationItemCounts[location.id] ?? 0;
          const childCount = childrenByParent.get(location.id)?.length ?? 0;
          const blockedReason =
            itemCount > 0
              ? `${itemCount} ${itemCount === 1 ? "elemento asignado" : "elementos asignados"}`
              : childCount > 0
                ? `${childCount} ${childCount === 1 ? "compartimento hijo" : "compartimentos hijos"}`
                : undefined;

          return (
            <li key={location.id}>
              <div
                className={styles.locationRow}
                data-depth={depth}
                draggable={online && busyOrder === null}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDragState({ kind: "location", id: location.id, parentKey })}
                onDrop={() => {
                  if (dragState?.kind !== "location" || dragState.parentKey !== parentKey) return;
                  const next = moveId(
                    locationOrders[parentKey] ?? order,
                    dragState.id,
                    location.id,
                  );
                  setDragState(null);
                  void persistLocationOrder(parentKey, next);
                }}
                onDragEnd={() => setDragState(null)}
              >
                <span aria-hidden="true" className={styles.treeMarker} />
                <button
                  aria-label={`Arrastrar ${location.label}`}
                  className={styles.dragHandle}
                  disabled={!online || busyOrder !== null}
                  title="Arrastrar para ordenar"
                  type="button"
                >
                  ⋮⋮
                </button>
                <div className={styles.rowMain}>
                  <strong>{location.label}</strong>
                  <span>
                    {itemCount} {itemCount === 1 ? "elemento" : "elementos"}
                    {childCount > 0
                      ? ` · ${childCount} ${childCount === 1 ? "hijo" : "hijos"}`
                      : ""}
                  </span>
                </div>
                <div className={styles.rowActions}>
                  <button
                    disabled={!online}
                    onClick={() => openLocationEditor(location)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    aria-label={`Añadir compartimento dentro de ${location.label}`}
                    disabled={!online}
                    onClick={() => openLocationEditor(undefined, location.id)}
                    type="button"
                  >
                    +
                  </button>
                  <button
                    className={styles.dangerButton}
                    disabled={!online || Boolean(blockedReason)}
                    onClick={() => void deleteLocation(location)}
                    title={
                      blockedReason ? `No se puede borrar: ${blockedReason}.` : "Borrar ubicación"
                    }
                    type="button"
                  >
                    Borrar
                  </button>
                  <button
                    aria-label={`Subir ${location.label}`}
                    disabled={!online || index === 0 || busyOrder !== null}
                    onClick={() => moveLocationBy(parentKey, location.id, -1)}
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Bajar ${location.label}`}
                    disabled={!online || index === order.length - 1 || busyOrder !== null}
                    onClick={() => moveLocationBy(parentKey, location.id, 1)}
                    type="button"
                  >
                    ↓
                  </button>
                </div>
              </div>
              {renderLocationBranch(location.id, depth + 1)}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <>
      <div className={styles.topBar}>
        <Link className={styles.backLink} href="/viaje">
          ← Volver a Viaje
        </Link>
        {!online ? <span className={styles.offlineBadge}>Sin conexión · solo lectura</span> : null}
      </div>

      {!online ? (
        <div className={styles.offlineNotice} role="status">
          La organización se puede editar cuando vuelva la conexión. Puedes consultar la estructura
          actual.
        </div>
      ) : null}

      <section aria-labelledby="categories-title" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Cómo se prepara</p>
            <h2 id="categories-title">Categorías</h2>
          </div>
          <button disabled={!online} onClick={() => openCategoryEditor()} type="button">
            Nueva categoría
          </button>
        </div>
        <p className={styles.sectionIntro}>
          Ordena los bloques que aparecen en la lista de preparación.
        </p>
        <div className={styles.summaryList}>
          {categoryOrder.map((categoryId, index) => {
            const category = categoryBySlug.get(categoryId);
            if (!category) return null;
            const itemCount = categoryItemCounts[category.slug] ?? 0;
            return (
              <div
                className={styles.summaryRow}
                draggable={online && busyOrder === null}
                key={category.slug}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDragState({ kind: "category", id: category.slug })}
                onDrop={() => {
                  if (dragState?.kind !== "category") return;
                  setDragState(null);
                  void persistCategoryOrder(moveId(categoryOrder, dragState.id, category.slug));
                }}
                onDragEnd={() => setDragState(null)}
              >
                <button
                  aria-label={`Arrastrar ${category.label}`}
                  className={styles.dragHandle}
                  disabled={!online || busyOrder !== null}
                  title="Arrastrar para ordenar"
                  type="button"
                >
                  ⋮⋮
                </button>
                <div className={styles.rowMain}>
                  <strong>{category.label}</strong>
                  <span>
                    {itemCount} {itemCount === 1 ? "elemento" : "elementos"}
                  </span>
                </div>
                <div className={styles.rowActions}>
                  <button
                    disabled={!online}
                    onClick={() => openCategoryEditor(category)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className={styles.dangerButton}
                    disabled={!online || itemCount > 0}
                    onClick={() => void deleteCategory(category)}
                    title={
                      itemCount > 0
                        ? "No se puede borrar mientras tenga elementos."
                        : "Borrar categoría"
                    }
                    type="button"
                  >
                    Borrar
                  </button>
                  <button
                    aria-label={`Subir ${category.label}`}
                    disabled={!online || index === 0 || busyOrder !== null}
                    onClick={() => moveCategoryBy(category.slug, -1)}
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Bajar ${category.label}`}
                    disabled={!online || index === categoryOrder.length - 1 || busyOrder !== null}
                    onClick={() => moveCategoryBy(category.slug, 1)}
                    type="button"
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {categoryOrder.length === 0 ? (
          <p className={styles.emptyState}>Todavía no hay categorías.</p>
        ) : null}
      </section>

      <section aria-labelledby="locations-title" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Dónde se guarda</p>
            <h2 id="locations-title">Ubicaciones</h2>
          </div>
          <button disabled={!online} onClick={() => openLocationEditor()} type="button">
            Nueva ubicación
          </button>
        </div>
        <p className={styles.sectionIntro}>
          Crea ubicaciones principales y compartimentos sin perder la jerarquía.
        </p>
        {renderLocationBranch(null, 0) ?? (
          <p className={styles.emptyState}>Todavía no hay ubicaciones.</p>
        )}
      </section>

      {editor ? (
        <section aria-labelledby="editor-title" className={styles.editor}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Edición</p>
              <h2 id="editor-title">
                {editor.kind === "category"
                  ? editor.id
                    ? "Editar categoría"
                    : "Nueva categoría"
                  : editor.id
                    ? "Editar ubicación"
                    : parentId
                      ? "Nuevo compartimento"
                      : "Nueva ubicación"}
              </h2>
            </div>
            <button className={styles.quietButton} onClick={() => setEditor(null)} type="button">
              Cancelar
            </button>
          </div>
          <form onSubmit={(event) => void saveEditor(event)}>
            <label htmlFor="organization-label">Nombre</label>
            <input
              autoFocus
              id="organization-label"
              maxLength={80}
              onChange={(event) => setLabel(event.target.value)}
              required
              value={label}
            />
            {editor.kind === "location" ? (
              <label className={styles.fieldGroup} htmlFor="organization-parent">
                Contenedor principal
                <select
                  id="organization-parent"
                  onChange={(event) => setParentId(event.target.value || null)}
                  value={parentId ?? ""}
                >
                  <option value="">Ubicación principal</option>
                  {(checklist.locations ?? [])
                    .filter((location) => location.id !== editor.id)
                    .filter((location) => !isDescendant(location.id, editor.id, locationById))
                    .sort(compareSortOrder)
                    .map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.label}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}
            <button className={styles.primaryButton} disabled={!online || isSaving} type="submit">
              {isSaving ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}

function compareSortOrder(first: { sortOrder: number }, second: { sortOrder: number }) {
  return first.sortOrder - second.sortOrder;
}

function countBy<T>(items: T[], keyOf: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = keyOf(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function buildLocationOrders(locations: TravelStorageLocation[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const location of [...locations].sort(compareSortOrder)) {
    const key = location.parentId ?? ROOT_KEY;
    grouped[key] ??= [];
    grouped[key].push(location.id);
  }
  return grouped;
}

function isCompleteOrder(current: string[], expected: string[]): boolean {
  return current.length === expected.length && current.every((id) => expected.includes(id));
}

function isCompleteLocationOrder(
  current: Record<string, string[]>,
  expected: Record<string, string[]>,
): boolean {
  const currentKeys = Object.keys(current).sort();
  const expectedKeys = Object.keys(expected).sort();
  return (
    currentKeys.length === expectedKeys.length &&
    currentKeys.every(
      (key, index) =>
        key === expectedKeys[index] && isCompleteOrder(current[key] ?? [], expected[key] ?? []),
    )
  );
}

function nextLocationSortOrder(
  parentId: string | null,
  childrenByParent: Map<string | null, TravelStorageLocation[]>,
) {
  const siblings = childrenByParent.get(parentId) ?? [];
  return (siblings.reduce((max, location) => Math.max(max, location.sortOrder), 0) || 0) + 10;
}

function moveId(order: string[], movingId: string, targetId: string): string[] {
  if (movingId === targetId) return order;
  const next = order.filter((id) => id !== movingId);
  const targetIndex = next.indexOf(targetId);
  next.splice(targetIndex < 0 ? next.length : targetIndex, 0, movingId);
  return next;
}

function isDescendant(
  candidateId: string,
  ancestorId: string | null,
  locations: Map<string, TravelStorageLocation>,
): boolean {
  if (!ancestorId) return false;
  let parentId = locations.get(candidateId)?.parentId ?? null;
  while (parentId) {
    if (parentId === ancestorId) return true;
    parentId = locations.get(parentId)?.parentId ?? null;
  }
  return false;
}
