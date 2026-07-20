"use client";

import { ReactNode, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import {
  getVaccineDoseStatusLabel,
  PlannedVaccineDoseGroups,
  PlannedVaccineDoseWithStatus,
  vaccineDoseStatuses,
} from "../domain/vaccine-calendar";
import { VaccineTimelineGroup } from "../application/vaccine-plan-views";
import styles from "../../../app/(app)/vacunas/page.module.css";

type PlannedVaccineListProps = {
  groups: PlannedVaccineDoseGroups;
  markAppliedAction: (formData: FormData) => void | Promise<void>;
  reopenAction: (formData: FormData) => void | Promise<void>;
  timelineGroups?: VaccineTimelineGroup[];
  updateAction: (formData: FormData) => void | Promise<void>;
  updateApplicationAction: (formData: FormData) => void | Promise<void>;
  view?: "status" | "timeline";
};

export function PlannedVaccineList({
  groups,
  markAppliedAction,
  reopenAction,
  timelineGroups = [],
  updateAction,
  updateApplicationAction,
  view = "status",
}: PlannedVaccineListProps) {
  const doses = vaccineDoseStatuses.flatMap((status) => groups[status]);

  if (doses.length === 0) {
    return <p className={styles.empty}>Todavia no hay dosis planificadas.</p>;
  }

  if (view === "timeline") {
    return (
      <div className={styles.timelineGroups}>
        {timelineGroups.map((group) => (
          <section className={styles.timelineGroup} key={group.ageLabel}>
            <div className={styles.timelineTitle}>
              <h3>{group.ageLabel}</h3>
              <span>{formatDate(group.plannedDate)}</span>
            </div>
            <ol className={styles.doseList}>
              {group.doses.map((dose) => (
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
          </section>
        ))}
      </div>
    );
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

      <div className={styles.doseActions}>
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
      </div>
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
  const titleId = `edit-planned-${dose.id}`;

  return (
    <>
      <button
        aria-label="Editar planificacion"
        className={styles.secondaryActionButton}
        onClick={() => setIsOpen(true)}
        title="Editar planificacion"
        type="button"
      >
        <EditIcon />
      </button>

      {isOpen ? (
        <BottomSheet
          ariaLabel="Cerrar panel de planificacion"
          labelledBy={titleId}
          onClose={() => setIsOpen(false)}
          styles={styles}
        >
          <PlannedVaccineForm
            action={updateAction}
            dose={dose}
            onCancel={() => setIsOpen(false)}
            titleId={titleId}
          />
        </BottomSheet>
      ) : null}
    </>
  );
}

function PlannedVaccineForm({
  action,
  dose,
  onCancel,
  titleId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  dose: PlannedVaccineDoseWithStatus;
  onCancel: () => void;
  titleId: string;
}) {
  return (
    <form action={action} className={styles.sheetBody}>
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
        <button className={styles.secondaryButton} onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className={styles.primaryButton} type="submit">
          Guardar cambios
        </button>
      </div>
    </form>
  );
}

export function VaccineApplicationSheet({
  buttonClassName,
  children,
  dose,
  markAppliedAction,
  returnTo,
}: {
  buttonClassName?: string;
  children?: ReactNode;
  dose: PlannedVaccineDoseWithStatus;
  markAppliedAction: (formData: FormData) => void | Promise<void>;
  returnTo?: string;
}) {
  return (
    <MarkAppliedForm
      buttonClassName={buttonClassName}
      dose={dose}
      markAppliedAction={markAppliedAction}
      returnTo={returnTo}
    >
      {children}
    </MarkAppliedForm>
  );
}

function MarkAppliedForm({
  buttonClassName,
  children,
  dose,
  markAppliedAction,
  returnTo,
}: {
  buttonClassName?: string;
  children?: ReactNode;
  dose: PlannedVaccineDoseWithStatus;
  markAppliedAction: (formData: FormData) => void | Promise<void>;
  returnTo?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = `mark-applied-${dose.id}`;

  return (
    <>
      <button
        aria-label="Marcar como aplicada"
        className={buttonClassName ?? styles.actionButton}
        onClick={() => setIsOpen(true)}
        title="Marcar como aplicada"
        type="button"
      >
        {children ?? <CheckIcon />}
      </button>

      {isOpen ? (
        <BottomSheet
          ariaLabel="Cerrar panel de vacuna"
          labelledBy={titleId}
          onClose={() => setIsOpen(false)}
          styles={styles}
        >
          <VaccineApplicationForm
            action={markAppliedAction}
            dose={dose}
            onCancel={() => setIsOpen(false)}
            returnTo={returnTo}
            submitLabel="Guardar aplicacion"
            title="Registrar vacuna aplicada"
            titleId={titleId}
          />
        </BottomSheet>
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
  const [isOpen, setIsOpen] = useState(false);
  const application = dose.application;
  const titleId = `edit-application-${dose.id}`;

  if (!application) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Editar aplicacion"
        className={styles.actionButton}
        onClick={() => setIsOpen(true)}
        title="Editar aplicacion"
        type="button"
      >
        <EditIcon />
      </button>

      {isOpen ? (
        <BottomSheet
          ariaLabel="Cerrar panel de aplicacion"
          labelledBy={titleId}
          onClose={() => setIsOpen(false)}
          styles={styles}
        >
          <VaccineApplicationForm
            action={updateApplicationAction}
            applicationId={application.id}
            dose={dose}
            onCancel={() => setIsOpen(false)}
            submitLabel="Guardar aplicacion"
            title="Editar aplicacion"
            titleId={titleId}
          />

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
        </BottomSheet>
      ) : null}
    </>
  );
}

function VaccineApplicationForm({
  action,
  applicationId,
  dose,
  onCancel,
  returnTo,
  submitLabel,
  title,
  titleId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  applicationId?: string;
  dose: PlannedVaccineDoseWithStatus;
  onCancel: () => void;
  returnTo?: string;
  submitLabel: string;
  title: string;
  titleId: string;
}) {
  const application = dose.application;

  return (
    <form action={action} className={styles.sheetBody}>
      <div className={styles.sheetHeader}>
        <p>Aplicacion</p>
        <h2 id={titleId}>{title}</h2>
        <span>
          {dose.vaccineName} · {dose.doseLabel}
        </span>
      </div>

      {applicationId ? <input name="applicationId" type="hidden" value={applicationId} /> : null}
      {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
      <input name="plannedDoseId" type="hidden" value={dose.id} />

      <div className={styles.sheetFields}>
        <label>
          Fecha de aplicacion
          <input
            name="appliedOn"
            required
            type="date"
            defaultValue={application?.appliedOn ?? dose.plannedDate}
          />
        </label>
        <label>
          Vacuna
          <input
            name="vaccineName"
            required
            defaultValue={application?.vaccineName ?? dose.vaccineName}
          />
        </label>
        <label>
          Dosis
          <input
            name="doseLabel"
            required
            defaultValue={application?.doseLabel ?? dose.doseLabel}
          />
        </label>
        <label>
          Lugar
          <input
            name="place"
            required
            defaultValue={application?.place ?? ""}
            placeholder="Centro de salud"
          />
        </label>
        <label>
          Lote
          <input name="lot" defaultValue={application?.lot ?? ""} />
        </label>
        <label className={styles.full}>
          Notas
          <textarea name="notes" rows={3} defaultValue={application?.notes ?? ""} />
        </label>
      </div>

      <div className={styles.sheetActions}>
        <button className={styles.secondaryButton} onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className={styles.primaryButton} type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
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

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
