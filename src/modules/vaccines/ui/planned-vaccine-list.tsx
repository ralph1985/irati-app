"use client";

import { PlannedVaccineDose } from "../domain/vaccine-calendar";
import styles from "../../../app/vacunas/page.module.css";

type PlannedVaccineListProps = {
  doses: PlannedVaccineDose[];
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function PlannedVaccineList({ doses, updateAction }: PlannedVaccineListProps) {
  if (doses.length === 0) {
    return <p className={styles.empty}>Todavia no hay dosis planificadas.</p>;
  }

  return (
    <ol className={styles.doseList}>
      {doses.map((dose) => (
        <li key={dose.id}>
          <div className={styles.doseSummary}>
            <div>
              <strong>{dose.vaccineName}</strong>
              <span>
                {dose.doseLabel}
                {dose.ageLabel ? ` · ${dose.ageLabel}` : ""}
              </span>
            </div>
            <time dateTime={dose.plannedDate}>{formatDate(dose.plannedDate)}</time>
          </div>

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
