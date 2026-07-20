"use client";

import { PlannedVaccineDoseWithStatus } from "@/modules/vaccines/domain/vaccine-calendar";
import { VaccineApplicationSheet } from "@/modules/vaccines/ui/planned-vaccine-list";
import { WeightCreateSheet } from "@/modules/weight/ui/weight-create-sheet";
import styles from "../page.module.css";

type HomeQuickActionsProps = {
  createWeightAction: (formData: FormData) => void | Promise<void>;
  markAppliedAction: (formData: FormData) => void | Promise<void>;
  nextDose: PlannedVaccineDoseWithStatus | null;
};

export function HomeQuickActions({
  createWeightAction,
  markAppliedAction,
  nextDose,
}: HomeQuickActionsProps) {
  return (
    <section className={styles.quickActions} aria-label="Acciones rapidas">
      <WeightCreateSheet
        action={createWeightAction}
        buttonClassName={styles.quickActionButton}
        returnTo="/"
        styles={styles}
      >
        <span aria-hidden="true">+</span>
        Añadir peso
      </WeightCreateSheet>

      {nextDose ? (
        <VaccineApplicationSheet
          buttonClassName={styles.quickActionButton}
          dose={nextDose}
          markAppliedAction={markAppliedAction}
          returnTo="/"
        >
          <span aria-hidden="true">✓</span>
          Registrar vacuna
        </VaccineApplicationSheet>
      ) : (
        <a className={styles.quickActionButton} href="/vacunas">
          <span aria-hidden="true">✓</span>
          Ver vacunas
        </a>
      )}
    </section>
  );
}
