"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import {
  AppliedVaccineDose,
  assignPlannedVaccineDoseStatuses,
  createAppliedVaccineDose,
  createPlannedVaccineDose,
  groupPlannedVaccineDosesByStatus,
  getVaccineDoseStatusLabel,
  PlannedVaccineDose,
  PlannedVaccineDoseGroups,
  PlannedVaccineDoseWithStatus,
  vaccineDoseStatuses,
} from "../domain/vaccine-calendar";
import { VaccineTimelineGroup } from "../application/vaccine-plan-views";
import {
  applyOfflineAppliedVaccineDose,
  applyOfflinePlannedVaccineDose,
  deleteOfflineAppliedVaccineDose,
  enqueuePendingVaccineMutation,
  listPendingVaccineMutations,
  type PendingVaccineMutation,
} from "../../../shared/infrastructure/offline/irati-offline-db";
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
  const [pendingMutations, setPendingMutations] = useState<PendingVaccineMutation[]>([]);
  const [today] = useState(() => new Date());
  const baseDoses = useMemo(
    () => vaccineDoseStatuses.flatMap((status) => groups[status]),
    [groups],
  );
  const visibleDoses = useMemo(
    () => buildVisibleVaccineDoses(baseDoses, pendingMutations, today),
    [baseDoses, pendingMutations, today],
  );
  const visibleGroups = useMemo(
    () => groupPlannedVaccineDosesByStatus(visibleDoses),
    [visibleDoses],
  );
  const visibleTimelineGroups = useMemo(
    () => buildVisibleTimelineGroups(timelineGroups, visibleDoses),
    [timelineGroups, visibleDoses],
  );
  const doses = visibleDoses;

  useEffect(() => {
    let isActive = true;

    async function refreshPendingMutations() {
      const nextPendingMutations = await listPendingVaccineMutations();

      if (isActive) {
        setPendingMutations(nextPendingMutations);
      }
    }

    void refreshPendingMutations();
    window.addEventListener("irati-offline-vaccines-updated", refreshPendingMutations);
    window.addEventListener("irati-offline-sync-updated", refreshPendingMutations);

    return () => {
      isActive = false;
      window.removeEventListener("irati-offline-vaccines-updated", refreshPendingMutations);
      window.removeEventListener("irati-offline-sync-updated", refreshPendingMutations);
    };
  }, []);

  if (doses.length === 0) {
    return <p className={styles.empty}>Aún no hay dosis planificadas.</p>;
  }

  if (view === "timeline") {
    return (
      <div className={styles.timelineGroups}>
        {visibleTimelineGroups.map((group) => (
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
                  pendingMutations={pendingMutations}
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
            <span>{visibleGroups[status].length}</span>
          </div>
          {visibleGroups[status].length > 0 ? (
            <ol className={styles.doseList}>
              {visibleGroups[status].map((dose) => (
                <PlannedVaccineItem
                  dose={dose}
                  key={dose.id}
                  markAppliedAction={markAppliedAction}
                  reopenAction={reopenAction}
                  updateAction={updateAction}
                  updateApplicationAction={updateApplicationAction}
                  pendingMutations={pendingMutations}
                />
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>Nada en este grupo.</p>
          )}
        </section>
      ))}
    </div>
  );
}

function PlannedVaccineItem({
  dose,
  markAppliedAction,
  pendingMutations,
  reopenAction,
  updateAction,
  updateApplicationAction,
}: {
  dose: PlannedVaccineDoseWithStatus;
  markAppliedAction: (formData: FormData) => void | Promise<void>;
  pendingMutations: PendingVaccineMutation[];
  reopenAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  updateApplicationAction: (formData: FormData) => void | Promise<void>;
}) {
  const pendingMessage = getPendingVaccineDoseMessage(pendingMutations, dose);

  return (
    <li data-pending={pendingMessage ? "true" : "false"}>
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
      {pendingMessage ? <p className={styles.pendingNote}>{pendingMessage}</p> : null}

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
        aria-label="Editar planificación"
        className={styles.secondaryActionButton}
        onClick={() => setIsOpen(true)}
        title="Editar planificación"
        type="button"
      >
        <EditIcon />
      </button>

      {isOpen ? (
        <BottomSheet
          ariaLabel="Cerrar planificación"
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
    <form
      action={action}
      className={styles.sheetBody}
      onSubmit={(event) => {
        if (!navigator.onLine) {
          event.preventDefault();
          void updatePlannedVaccineDoseOffline(event.currentTarget, dose, onCancel);
        }
      }}
    >
      <div className={styles.sheetHeader}>
        <p>Planificación</p>
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
        aria-label="Registrar vacuna aplicada"
        className={buttonClassName ?? styles.actionButton}
        onClick={() => setIsOpen(true)}
        title="Registrar vacuna aplicada"
        type="button"
      >
        {children ?? <CheckIcon />}
      </button>

      {isOpen ? (
        <BottomSheet
          ariaLabel="Cerrar vacuna aplicada"
          labelledBy={titleId}
          onClose={() => setIsOpen(false)}
          styles={styles}
        >
          <VaccineApplicationForm
            action={markAppliedAction}
            dose={dose}
            onCancel={() => setIsOpen(false)}
            returnTo={returnTo}
            submitLabel="Guardar aplicación"
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
        aria-label="Editar aplicación"
        className={styles.actionButton}
        onClick={() => setIsOpen(true)}
        title="Editar aplicación"
        type="button"
      >
        <EditIcon />
      </button>

      {isOpen ? (
        <BottomSheet
          ariaLabel="Cerrar aplicación"
          labelledBy={titleId}
          onClose={() => setIsOpen(false)}
          styles={styles}
        >
          <VaccineApplicationForm
            action={updateApplicationAction}
            applicationId={application.id}
            dose={dose}
            onCancel={() => setIsOpen(false)}
            submitLabel="Guardar aplicación"
            title="Editar aplicación"
            titleId={titleId}
          />

          <form
            action={reopenAction}
            className={styles.reopenForm}
            onSubmit={(event) => {
              if (!confirm("¿Volver esta vacuna a pendiente?")) {
                event.preventDefault();
                return;
              }

              if (!navigator.onLine) {
                event.preventDefault();
                void reopenVaccineDoseOffline(event, dose, () => setIsOpen(false));
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
    <form
      action={action}
      className={styles.sheetBody}
      onSubmit={(event) => {
        if (!navigator.onLine) {
          event.preventDefault();
          void applyVaccineApplicationOffline(event.currentTarget, dose, applicationId, onCancel);
        }
      }}
    >
      <div className={styles.sheetHeader}>
        <p>Aplicación</p>
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
          Fecha de aplicación
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

function buildVisibleVaccineDoses(
  baseDoses: PlannedVaccineDoseWithStatus[],
  pendingMutations: PendingVaccineMutation[],
  today: Date,
): PlannedVaccineDoseWithStatus[] {
  const plannedDosesById = new Map<string, PlannedVaccineDose>(
    baseDoses.map((dose) => [dose.id, stripPlannedDose(dose)]),
  );
  const appliedDosesById = new Map<string, AppliedVaccineDose>(
    baseDoses
      .flatMap((dose) => (dose.application ? [dose.application] : []))
      .map((application) => [application.id, application]),
  );

  for (const mutation of pendingMutations) {
    if (mutation.operation === "updatePlanned") {
      plannedDosesById.set(mutation.payload.id, {
        id: mutation.payload.id,
        ...mutation.payload.dose,
      });
      continue;
    }

    if (mutation.operation === "markApplied") {
      appliedDosesById.set(mutation.payload.applicationId, {
        id: mutation.payload.applicationId,
        ...mutation.payload.dose,
      });
      continue;
    }

    if (mutation.operation === "updateApplication") {
      appliedDosesById.set(mutation.payload.id, {
        id: mutation.payload.id,
        ...mutation.payload.dose,
      });
      continue;
    }

    appliedDosesById.delete(mutation.payload.applicationId);
  }

  return assignPlannedVaccineDoseStatuses(
    [...plannedDosesById.values()],
    [...appliedDosesById.values()],
    today,
  );
}

function buildVisibleTimelineGroups(
  timelineGroups: VaccineTimelineGroup[],
  visibleDoses: PlannedVaccineDoseWithStatus[],
): VaccineTimelineGroup[] {
  const visibleDosesById = new Map(visibleDoses.map((dose) => [dose.id, dose]));

  return timelineGroups
    .map((group) => ({
      ...group,
      doses: group.doses.flatMap((dose) => {
        const visibleDose = visibleDosesById.get(dose.id);
        return visibleDose ? [visibleDose] : [];
      }),
    }))
    .filter((group) => group.doses.length > 0);
}

async function updatePlannedVaccineDoseOffline(
  form: HTMLFormElement,
  dose: PlannedVaccineDoseWithStatus,
  onDone: () => void,
) {
  const formData = new FormData(form);
  const plannedDose = {
    id: dose.id,
    ...createPlannedVaccineDose({
      ageLabel: String(formData.get("ageLabel") ?? ""),
      doseLabel: String(formData.get("doseLabel") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      plannedDate: String(formData.get("plannedDate") ?? ""),
      vaccineName: String(formData.get("vaccineName") ?? ""),
    }),
  };

  await applyOfflinePlannedVaccineDose(plannedDose);
  await enqueuePendingVaccineMutation({
    id: `vaccine-update-planned-${dose.id}-${crypto.randomUUID()}`,
    operation: "updatePlanned",
    payload: {
      basePlannedDose: stripPlannedDose(dose),
      dose: stripPlannedDose(plannedDose),
      id: dose.id,
    },
  });
  onDone();
  dispatchOfflineVaccineEvents();
}

async function applyVaccineApplicationOffline(
  form: HTMLFormElement,
  dose: PlannedVaccineDoseWithStatus,
  applicationId: string | undefined,
  onDone: () => void,
) {
  const formData = new FormData(form);
  const nextApplicationId = applicationId ?? crypto.randomUUID();
  const application = {
    id: nextApplicationId,
    ...createAppliedVaccineDose({
      appliedOn: String(formData.get("appliedOn") ?? ""),
      doseLabel: String(formData.get("doseLabel") ?? ""),
      lot: String(formData.get("lot") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      place: String(formData.get("place") ?? ""),
      plannedDoseId: dose.id,
      vaccineName: String(formData.get("vaccineName") ?? ""),
    }),
  };

  await applyOfflineAppliedVaccineDose(application);
  await enqueuePendingVaccineMutation(
    applicationId
      ? {
          id: `vaccine-update-application-${applicationId}-${crypto.randomUUID()}`,
          operation: "updateApplication",
          payload: {
            baseApplication: requireVaccineApplication(dose),
            dose: stripAppliedDose(application),
            id: applicationId,
            plannedDoseId: dose.id,
          },
        }
      : {
          id: `vaccine-mark-applied-${nextApplicationId}`,
          operation: "markApplied",
          payload: {
            applicationId: nextApplicationId,
            dose: stripAppliedDose(application),
            plannedDoseId: dose.id,
          },
        },
  );
  onDone();
  dispatchOfflineVaccineEvents();
}

async function reopenVaccineDoseOffline(
  _event: FormEvent<HTMLFormElement>,
  dose: PlannedVaccineDoseWithStatus,
  onDone: () => void,
) {
  const application = requireVaccineApplication(dose);

  await deleteOfflineAppliedVaccineDose(application.id);
  await enqueuePendingVaccineMutation({
    id: `vaccine-reopen-${application.id}-${crypto.randomUUID()}`,
    operation: "reopen",
    payload: {
      applicationId: application.id,
      baseApplication: application,
      plannedDoseId: dose.id,
    },
  });
  onDone();
  dispatchOfflineVaccineEvents();
}

function getPendingVaccineDoseMessage(
  pendingMutations: PendingVaccineMutation[],
  dose: PlannedVaccineDoseWithStatus,
): string | null {
  const pendingMutation = pendingMutations.find((mutation) => isMutationForDose(mutation, dose));

  if (!pendingMutation) {
    return null;
  }

  return pendingMutation.lastError ?? "Pendiente de sincronizar.";
}

function isMutationForDose(
  mutation: PendingVaccineMutation,
  dose: PlannedVaccineDoseWithStatus,
): boolean {
  if (mutation.operation === "updatePlanned") {
    return mutation.payload.id === dose.id;
  }

  return mutation.payload.plannedDoseId === dose.id;
}

function requireVaccineApplication(dose: PlannedVaccineDoseWithStatus): AppliedVaccineDose {
  if (!dose.application) {
    throw new Error("Missing vaccine application");
  }

  return dose.application;
}

function stripPlannedDose(dose: PlannedVaccineDose): PlannedVaccineDose {
  return {
    ageLabel: dose.ageLabel,
    doseLabel: dose.doseLabel,
    id: dose.id,
    notes: dose.notes,
    plannedDate: dose.plannedDate,
    vaccineName: dose.vaccineName,
  };
}

function stripAppliedDose(dose: AppliedVaccineDose): Omit<AppliedVaccineDose, "id"> {
  return {
    appliedOn: dose.appliedOn,
    doseLabel: dose.doseLabel,
    lot: dose.lot,
    notes: dose.notes,
    place: dose.place,
    plannedDoseId: dose.plannedDoseId,
    vaccineName: dose.vaccineName,
  };
}

function dispatchOfflineVaccineEvents() {
  window.dispatchEvent(new Event("irati-offline-vaccines-updated"));
  window.dispatchEvent(new Event("irati-offline-sync-updated"));
}
