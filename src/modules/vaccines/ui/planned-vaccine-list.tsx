"use client";

import {
  getVaccineDoseStatusLabel,
  PlannedVaccineDoseGroups,
  PlannedVaccineDoseWithStatus,
  vaccineDoseStatuses,
} from "../domain/vaccine-calendar";
import styles from "../../../app/vacunas/page.module.css";

type PlannedVaccineListProps = {
  groups: PlannedVaccineDoseGroups;
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function PlannedVaccineList({ groups, updateAction }: PlannedVaccineListProps) {
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
                <PlannedVaccineItem dose={dose} key={dose.id} updateAction={updateAction} />
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
  updateAction,
}: {
  dose: PlannedVaccineDoseWithStatus;
  updateAction: (formData: FormData) => void | Promise<void>;
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

      <details className={styles.editor}>
        <summary>Editar planificacion</summary>
        <form action={updateAction}>
          <input name="id" type="hidden" value={dose.id} />
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
          <button type="submit">Guardar cambios</button>
        </form>
      </details>
    </li>
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
