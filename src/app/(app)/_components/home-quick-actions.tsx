"use client";

import { useState } from "react";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <section className={styles.quickActions} aria-label="Acciones rápidas">
        <button
          aria-expanded={isMenuOpen}
          aria-haspopup="dialog"
          className={styles.addButton}
          onClick={() => setIsMenuOpen(true)}
          type="button"
        >
          <span aria-hidden="true">+</span>
          Añadir
        </button>
      </section>

      {isMenuOpen ? (
        <BottomSheet
          ariaLabel="Cerrar menú Añadir"
          labelledBy="home-add-title"
          onClose={() => setIsMenuOpen(false)}
          styles={styles}
        >
          <div className={styles.addMenu}>
            <div className={styles.sheetHeader}>
              <p>Acciones</p>
              <h2 id="home-add-title">¿Qué quieres hacer?</h2>
            </div>

            <div className={styles.addMenuOptions}>
              <WeightCreateSheet
                action={createWeightAction}
                buttonClassName={styles.addMenuButton}
                onOpen={() => setIsMenuOpen(false)}
                returnTo="/"
                styles={styles}
              >
                <span aria-hidden="true">+</span>
                Añadir peso
              </WeightCreateSheet>

              {nextDose ? (
                <VaccineApplicationSheet
                  buttonClassName={styles.addMenuButton}
                  dose={nextDose}
                  markAppliedAction={markAppliedAction}
                  onOpen={() => setIsMenuOpen(false)}
                  returnTo="/"
                >
                  <span aria-hidden="true">✓</span>
                  Registrar vacuna
                </VaccineApplicationSheet>
              ) : (
                <a className={styles.addMenuButton} href="/vacunas">
                  <span aria-hidden="true">✓</span>
                  Ver vacunas
                </a>
              )}
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
