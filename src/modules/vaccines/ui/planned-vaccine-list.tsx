"use client";

import { KeyboardEvent, PointerEvent, useRef, useState } from "react";
import {
  getVaccineDoseStatusLabel,
  PlannedVaccineDoseGroups,
  PlannedVaccineDoseWithStatus,
  vaccineDoseStatuses,
} from "../domain/vaccine-calendar";
import styles from "../../../app/vacunas/page.module.css";

type PlannedVaccineListProps = {
  groups: PlannedVaccineDoseGroups;
  markAppliedAction: (formData: FormData) => void | Promise<void>;
  reopenAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  updateApplicationAction: (formData: FormData) => void | Promise<void>;
};

export function PlannedVaccineList({
  groups,
  markAppliedAction,
  reopenAction,
  updateAction,
  updateApplicationAction,
}: PlannedVaccineListProps) {
  const doses = vaccineDoseStatuses.flatMap((status) => groups[status]);

  if (doses.length === 0) {
    return <p className={styles.empty}>Todavia no hay dosis planificadas.</p>;
  }

  return (
    <div className={styles.statusGroups}>
      {vaccineDoseStatuses.map((status) => (
        <section className={styles.statusGroup} key={status} aria-labelledby={`status-${status}`}>
          <div className={styles.statusTitle}>
            <h3 id={`status-${status}`}>{getVaccineDoseStatusLabel(status)}</h3>
            <span>{groups[status].length}</span>
          </div>
          {groups[status].length > 0 ? (
            <ol className={styles.doseList}>
              {groups[status].map((dose) => (
                <PlannedVaccineItem
                  dose={dose}
                  key={dose.id}
                  markAppliedAction={markAppliedAction}
                  reopenAction={reopenAction}
                  updateAction={updateAction}
                  updateApplicationAction={updateApplicationAction}
                />
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>Sin dosis en este estado.</p>
          )}
        </section>
      ))}
    </div>
  );
}

function PlannedVaccineItem({
  dose,
  markAppliedAction,
  reopenAction,
  updateAction,
  updateApplicationAction,
}: {
  dose: PlannedVaccineDoseWithStatus;
  markAppliedAction: (formData: FormData) => void | Promise<void>;
  reopenAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  updateApplicationAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <li>
      <div className={styles.doseSummary}>
        <div>
          <strong>{dose.vaccineName}</strong>
          <span>
            {dose.doseLabel}
            {dose.ageLabel ? ` · ${dose.ageLabel}` : ""}
          </span>
        </div>
        <div className={styles.dateStack}>
          <span className={styles.statusBadge} data-status={dose.status}>
            {getVaccineDoseStatusLabel(dose.status)}
          </span>
          <time dateTime={dose.plannedDate}>{formatDate(dose.plannedDate)}</time>
        </div>
      </div>

      {dose.appliedOn ? (
        <p className={styles.notes}>Aplicada el {formatDate(dose.appliedOn)}.</p>
      ) : null}
      {dose.notes ? <p className={styles.notes}>{dose.notes}</p> : null}

      {dose.application ? (
        <AppliedVaccineEditor
          dose={dose}
          reopenAction={reopenAction}
          updateApplicationAction={updateApplicationAction}
        />
      ) : (
        <MarkAppliedForm dose={dose} markAppliedAction={markAppliedAction} />
      )}

      <PlannedVaccineEditor dose={dose} updateAction={updateAction} />
    </li>
  );
}

function PlannedVaccineEditor({
  dose,
  updateAction,
}: {
  dose: PlannedVaccineDoseWithStatus;
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef<number | null>(null);
  const titleId = `edit-planned-${dose.id}`;

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
      <button className={styles.secondaryActionButton} onClick={openSheet} type="button">
        Editar planificacion
      </button>

      {isOpen ? (
        <div className={styles.sheetBackdrop} onClick={closeSheet}>
          <form
            action={updateAction}
            aria-labelledby={titleId}
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
              aria-label="Cerrar panel de planificacion"
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
              <p>Planificacion</p>
              <h2 id={titleId}>Editar dosis planificada</h2>
              <span>
                {dose.vaccineName} · {dose.doseLabel}
              </span>
            </div>

            <input name="id" type="hidden" value={dose.id} />

            <div className={styles.sheetFields}>
              <label>
                Vacuna
                <input name="vaccineName" required defaultValue={dose.vaccineName} />
              </label>
              <label>
                Dosis
                <input name="doseLabel" required defaultValue={dose.doseLabel} />
              </label>
              <label>
                Fecha planificada
                <input name="plannedDate" required type="date" defaultValue={dose.plannedDate} />
              </label>
              <label>
                Edad
                <input name="ageLabel" defaultValue={dose.ageLabel ?? ""} />
              </label>
              <label className={styles.full}>
                Notas
                <textarea name="notes" rows={3} defaultValue={dose.notes ?? ""} />
              </label>
            </div>

            <div className={styles.sheetActions}>
              <button className={styles.secondaryButton} onClick={closeSheet} type="button">
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

function MarkAppliedForm({
  dose,
  markAppliedAction,
}: {
  dose: PlannedVaccineDoseWithStatus;
  markAppliedAction: (formData: FormData) => void | Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef<number | null>(null);
  const titleId = `mark-applied-${dose.id}`;

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
      <button className={styles.actionButton} onClick={openSheet} type="button">
        Marcar como aplicada
      </button>

      {isOpen ? (
        <div className={styles.sheetBackdrop} onClick={closeSheet}>
          <form
            action={markAppliedAction}
            aria-labelledby={titleId}
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
              aria-label="Cerrar panel de vacuna"
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
              <p>Aplicacion</p>
              <h2 id={titleId}>Registrar vacuna aplicada</h2>
              <span>
                {dose.vaccineName} · {dose.doseLabel}
              </span>
            </div>

            <input name="plannedDoseId" type="hidden" value={dose.id} />
            <input name="vaccineName" type="hidden" value={dose.vaccineName} />
            <input name="doseLabel" type="hidden" value={dose.doseLabel} />

            <div className={styles.sheetFields}>
              <label>
                Fecha de aplicacion
                <input name="appliedOn" required type="date" defaultValue={dose.plannedDate} />
              </label>
              <label>
                Lugar
                <input name="place" required placeholder="Centro de salud" />
              </label>
              <label>
                Lote
                <input name="lot" />
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
                Guardar aplicacion
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function AppliedVaccineEditor({
  dose,
  reopenAction,
  updateApplicationAction,
}: {
  dose: PlannedVaccineDoseWithStatus;
  reopenAction: (formData: FormData) => void | Promise<void>;
  updateApplicationAction: (formData: FormData) => void | Promise<void>;
}) {
  const application = dose.application;

  if (!application) {
    return null;
  }

  return (
    <details className={styles.editor}>
      <summary>Editar aplicacion</summary>
      <form action={updateApplicationAction}>
        <input name="applicationId" type="hidden" value={application.id} />
        <input name="plannedDoseId" type="hidden" value={dose.id} />
        <label>
          Fecha de aplicacion
          <input name="appliedOn" required type="date" defaultValue={application.appliedOn} />
        </label>
        <label>
          Vacuna
          <input name="vaccineName" required defaultValue={application.vaccineName} />
        </label>
        <label>
          Dosis
          <input name="doseLabel" required defaultValue={application.doseLabel} />
        </label>
        <label>
          Lugar
          <input name="place" required defaultValue={application.place} />
        </label>
        <label>
          Lote
          <input name="lot" defaultValue={application.lot ?? ""} />
        </label>
        <label className={styles.full}>
          Notas
          <textarea name="notes" rows={3} defaultValue={application.notes ?? ""} />
        </label>
        <button type="submit">Guardar aplicacion</button>
      </form>

      <form
        action={reopenAction}
        className={styles.reopenForm}
        onSubmit={(event) => {
          if (!confirm("¿Volver esta vacuna a pendiente?")) {
            event.preventDefault();
          }
        }}
      >
        <input name="applicationId" type="hidden" value={application.id} />
        <button className={styles.reopenButton} type="submit">
          Volver a pendiente
        </button>
      </form>
    </details>
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
